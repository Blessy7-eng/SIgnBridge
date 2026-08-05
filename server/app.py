"""
SignBridge backend - production-hardened version.

KEY FIXES from the earlier version:

1. ASYNC MODE: switched from eventlet to Flask-SocketIO's built-in
   'threading' mode. Eventlet requires cooperative yielding - since our
   MediaPipe + PyTorch inference is synchronous, CPU-heavy work, it was
   blocking eventlet's loop long enough that Socket.IO's keep-alive
   pings/polling couldn't get through in time. The browser would think the
   connection died, reconnect, and get a BRAND NEW session (wiping the
   sentence). Real threads + the GIL being released during PyTorch/
   MediaPipe's C++ calls avoids this class of problem.

2. FRAME DROPPING: if a frame is still being processed when a new one
   arrives, we now DROP the new one instead of processing everything in
   order. Without this, slow inference causes a growing backlog, and the
   backlog itself becomes the source of ever-increasing lag.

3. STATELESS EVENTS: the backend no longer sends "here is the full
   sentence" - it only announces "this ONE word was just recognized" (or
   "clear was signed"). The FRONTEND is now the single source of truth for
   the sentence. This means a backend reconnect (which can still happen
   occasionally under real network conditions) can never again wipe out
   what the user already signed.
"""

import base64
import threading
import time
import numpy as np
import cv2
import torch
import torch.nn as nn
import pickle
from collections import Counter

from flask import Flask, request
from flask_socketio import SocketIO

from holistic_utils import extract_hands_only_features

import mediapipe as mp

# ---------- Config ----------
SEQUENCE_LENGTH = 30
CONFIDENCE_THRESHOLD = 0.7

# Raised back from 8 -> 12, and majority ratio tightened: the faster,
# more sensitive setting made rapid sign-to-sign transitions (where the
# window briefly contains a BLEND of two signs) trigger false positives
# too easily. This is a deliberate speed-for-accuracy trade-off.
VOTE_WINDOW_SIZE = 12
VOTE_MAJORITY_RATIO = 0.75
CLEAR_LABEL = 'Clear'
BACKSPACE_LABEL = 'Backspace'  # trained sign - deletes the last recognized word

# Destructive actions (delete/clear) get a STRICTER bar than regular
# letters/words: not just a majority, but a near-unanimous vote AND high
# average confidence. This can't fix a genuinely confident misclassification
# (see notes on hand-occlusion in Backspace training data), but it does
# filter out shorter/noisier bursts that a normal letter's looser threshold
# would let through - accidentally deleting something is costlier than one
# wrong letter, so it's worth demanding more certainty before acting on it.
COMMAND_LABELS = {CLEAR_LABEL, BACKSPACE_LABEL}
COMMAND_MIN_RATIO = 0.92
COMMAND_MIN_AVG_CONFIDENCE = 0.92



class SignLSTM(nn.Module):
    def __init__(self, input_size, hidden_size1, hidden_size2, num_classes):
        super().__init__()
        self.lstm1 = nn.LSTM(input_size, hidden_size1, batch_first=True)
        self.lstm2 = nn.LSTM(hidden_size1, hidden_size2, batch_first=True)
        self.dropout = nn.Dropout(0.3)
        self.fc1 = nn.Linear(hidden_size2, 64)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(64, num_classes)

    def forward(self, x):
        out, _ = self.lstm1(x)
        out = self.dropout(out)
        out, _ = self.lstm2(out)
        out = out[:, -1, :]
        out = self.dropout(out)
        out = self.relu(self.fc1(out))
        out = self.fc2(out)
        return out


device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

checkpoint = torch.load('motion_model.pt', map_location=device, weights_only=False)
model = SignLSTM(
    checkpoint['input_size'],
    checkpoint['hidden_size1'],
    checkpoint['hidden_size2'],
    checkpoint['num_classes']
).to(device)
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()

train_mean = checkpoint['train_mean']
train_std = checkpoint['train_std']

with open('motion_label_encoder.pickle', 'rb') as f:
    encoder = pickle.load(f)

print(f'Model loaded. Classes: {list(encoder.classes_)}')

mp_holistic = mp.solutions.holistic

sessions = {}
sessions_lock = threading.Lock()  # protects the sessions dict itself from concurrent access


def new_session_state():
    return {
        'holistic': mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5),
        'frame_buffer': [],
        'recent_votes': [],
        'last_spoken': None,
        'busy': False,  # True while a frame is actively being processed for this session
    }


app = Flask(__name__)
app.config['SECRET_KEY'] = 'signbridge-dev-secret'  # replace with a real secret before public deployment

# async_mode='threading' - see module docstring for why this matters more
# than it might seem. ping_timeout/ping_interval given generous values as
# an extra safety margin on top of the architectural fix.
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='threading',
    ping_timeout=60,
    ping_interval=25,
    max_http_buffer_size=5_000_000,
)


@socketio.on('connect')
def handle_connect():
    with sessions_lock:
        sessions[request.sid] = new_session_state()
    print(f'Client connected: {request.sid}')


@socketio.on('disconnect')
def handle_disconnect():
    with sessions_lock:
        state = sessions.pop(request.sid, None)
    if state:
        state['holistic'].close()
    print(f'Client disconnected: {request.sid}')


def process_frame(sid, image_b64):
    """
    Runs in a background thread (via socketio.start_background_task), NOT
    directly in the Socket.IO event handler. This keeps the handler itself
    fast and non-blocking, so keep-alive traffic never gets stuck behind
    slow inference.
    """
    state = sessions.get(sid)
    if state is None:
        return

    try:
        image_bytes = base64.b64decode(image_b64)
        np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        print(f'Failed to decode frame: {e}')
        state['busy'] = False
        return

    if frame is None:
        state['busy'] = False
        return

    # From here on, the session could theoretically be closed by a
    # concurrent disconnect while this background thread is mid-flight
    # (e.g. the frontend reconnects quickly, such as switching between
    # Practice page signs). If that happens, state['holistic'] may already
    # be closed underneath us - catch that instead of crashing the thread.
    try:
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = state['holistic'].process(frame_rgb)

        features = extract_hands_only_features(results)

        state['frame_buffer'].append(features)
        state['frame_buffer'] = state['frame_buffer'][-SEQUENCE_LENGTH:]

        if len(state['frame_buffer']) < SEQUENCE_LENGTH:
            state['busy'] = False
            return

        seq_array = np.array(state['frame_buffer'])
        seq_array = (seq_array - train_mean) / train_std

        input_seq = torch.tensor(seq_array[np.newaxis, ...], dtype=torch.float32).to(device)
        with torch.no_grad():
            output = model(input_seq)
            probs = torch.softmax(output, dim=1)[0]
            best_idx = int(torch.argmax(probs).item())
            confidence = probs[best_idx].item()

        predicted_label = encoder.inverse_transform([best_idx])[0]

        if confidence >= CONFIDENCE_THRESHOLD:
            state['recent_votes'].append((predicted_label, confidence))
        else:
            state['recent_votes'].append(None)
        state['recent_votes'] = state['recent_votes'][-VOTE_WINDOW_SIZE:]

        if len(state['recent_votes']) == VOTE_WINDOW_SIZE:
            entries = [v for v in state['recent_votes'] if v is not None]
            vote_counts = Counter(label for label, _ in entries)
            if vote_counts:
                top_label, top_count = vote_counts.most_common(1)[0]
                ratio = top_count / VOTE_WINDOW_SIZE

                if top_label in COMMAND_LABELS:
                    avg_confidence = sum(c for label, c in entries if label == top_label) / top_count
                    passes = ratio >= COMMAND_MIN_RATIO and avg_confidence >= COMMAND_MIN_AVG_CONFIDENCE
                else:
                    passes = ratio >= VOTE_MAJORITY_RATIO

                if passes and top_label != state['last_spoken']:
                    if top_label == CLEAR_LABEL:
                        state['last_spoken'] = top_label
                        socketio.emit('cleared', {}, room=sid)
                    elif top_label == BACKSPACE_LABEL:
                        state['last_spoken'] = top_label
                        # Frontend just listens for 'undo_last' - it doesn't
                        # need to know or care what triggered it.
                        socketio.emit('undo_last', {}, room=sid)
                    else:
                        state['last_spoken'] = top_label
                        # Only the single recognized WORD is sent - the frontend
                        # owns the running sentence, not this backend session.
                        socketio.emit('prediction', {'word': top_label}, room=sid)

            if all(v is None for v in state['recent_votes']):
                state['last_spoken'] = None

    except Exception as e:
        # Session likely closed mid-processing (a disconnect race) - this
        # is expected occasionally under rapid reconnects, not a real bug
        # each time. Log quietly and move on instead of crashing the thread.
        print(f'process_frame: session {sid} closed mid-processing, skipping frame ({e})')

    state['busy'] = False


@socketio.on('frame')
def handle_frame(data):
    sid = request.sid
    state = sessions.get(sid)
    if state is None:
        return

    # DROP this frame if the previous one is still being processed, instead
    # of queueing it up. This is what prevents a growing backlog (and the
    # ever-increasing lag that comes with it) if inference is briefly
    # slower than the incoming frame rate.
    if state['busy']:
        return
    state['busy'] = True

    try:
        image_b64 = data['image'].split(',')[1]
    except Exception:
        state['busy'] = False
        return

    socketio.start_background_task(process_frame, sid, image_b64)


if __name__ == '__main__':
    print('Starting SignBridge backend on http://localhost:5000')
    socketio.run(app, host='0.0.0.0', port=5000, debug=False)