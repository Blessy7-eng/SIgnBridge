import os
import cv2
import numpy as np
import mediapipe as mp

from holistic_utils import extract_hands_only_features

DATA_DIR = './data_motion_hands'   # hands-only data lives separately from the old full-feature data
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# Edit this list as you add more motion signs. Start small, prove the
# pipeline works end-to-end, then expand.
CLASSES = ['Backspace']

SEQUENCES_PER_CLASS = 30   # separate recordings per sign - more is better, this is a minimum
SEQUENCE_LENGTH = 30       # frames per recording (~1 second at 30fps)
CAMERA_INDEX = 1

mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils

cap = cv2.VideoCapture(CAMERA_INDEX)
if not cap.isOpened():
    raise IOError(f"Could not open camera index {CAMERA_INDEX}. Try 0, 1, or 2.")

try:
    with mp_holistic.Holistic(min_detection_confidence=0.5, min_tracking_confidence=0.5) as holistic:
        for class_name in CLASSES:
            class_dir = os.path.join(DATA_DIR, class_name)
            os.makedirs(class_dir, exist_ok=True)

            # Lets you re-run this script later to add MORE recordings without
            # overwriting what you already collected
            existing = len([f for f in os.listdir(class_dir) if f.endswith('.npy')])

            for seq_idx in range(existing, existing + SEQUENCES_PER_CLASS):
                # "Get ready" pause before each recording
                while True:
                    ret, frame = cap.read()
                    if not ret:
                        raise IOError("Camera stopped returning frames.")
                    cv2.putText(
                        frame, f'"{class_name}" recording {seq_idx + 1} - Press "Q" to start',
                        (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2, cv2.LINE_AA
                    )
                    cv2.imshow('frame', frame)
                    if cv2.waitKey(25) & 0xFF == ord('q'):
                        break

                # Actually record SEQUENCE_LENGTH frames for this one repetition
                sequence = []
                for frame_num in range(SEQUENCE_LENGTH):
                    ret, frame = cap.read()
                    if not ret:
                        continue

                    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    results = holistic.process(frame_rgb)

                    cv2.putText(
                        frame, f'Recording "{class_name}" ({frame_num + 1}/{SEQUENCE_LENGTH})',
                        (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2, cv2.LINE_AA
                    )
                    cv2.imshow('frame', frame)
                    cv2.waitKey(1)

                    sequence.append(extract_hands_only_features(results))

                sequence = np.array(sequence)  # shape: (SEQUENCE_LENGTH, FRAME_FEATURE_SIZE)
                np.save(os.path.join(class_dir, f'{seq_idx}.npy'), sequence)

                # Progress print after EVERY recording, so a stall or crash is
                # immediately obvious in the terminal instead of discovered later
                print(f'  Saved {class_name} {seq_idx + 1}/{existing + SEQUENCES_PER_CLASS}')

            print(f'Finished class "{class_name}".')

    print('\nDone collecting all classes.')

except Exception as e:
    print(f'\nCOLLECTION STOPPED EARLY due to an error: {e}')
    raise

finally:
    # This runs even if something crashes above, so the camera is always
    # released and windows always close cleanly
    cap.release()
    cv2.destroyAllWindows()

    # Final summary - check this against SEQUENCES_PER_CLASS (30) for every
    # class before moving on to build_motion_dataset.py
    print('\n--- Final counts per class ---')
    for class_name in CLASSES:
        class_dir = os.path.join(DATA_DIR, class_name)
        if os.path.exists(class_dir):
            count = len([f for f in os.listdir(class_dir) if f.endswith('.npy')])
        else:
            count = 0
        flag = '' if count >= SEQUENCES_PER_CLASS else '  <-- INCOMPLETE'
        print(f'{class_name}: {count}{flag}')