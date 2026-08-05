"""
Shared helper for turning MediaPipe Holistic results into a FIXED-LENGTH
per-frame feature vector: both hands + upper body pose + mouth shape.

Same principle as landmark_utils.py from the static model: this one
function must be used identically during data collection AND live
inference, or your model will drift and silently perform badly.

Per-frame feature vector layout:
  Left hand   : 21 landmarks x (x,y,z) = 63
  Right hand  : 21 landmarks x (x,y,z) = 63
  Pose        : 33 landmarks x (x,y,z) = 99
  Mouth       : 12 selected face-mesh points x (x,y) = 24
  TOTAL       = 249 numbers per frame

Missing body parts in a given frame (e.g. hand out of frame) are zero-filled,
same approach as the static model.
"""

NUM_HAND_LANDMARKS = 21
HAND_COORDS = 3  # x, y, z
HAND_FEATURES = NUM_HAND_LANDMARKS * HAND_COORDS  # 63 per hand

NUM_POSE_LANDMARKS = 33
POSE_COORDS = 3  # x, y, z (skipping MediaPipe's "visibility" value to keep this simple)
POSE_FEATURES = NUM_POSE_LANDMARKS * POSE_COORDS  # 99

# A small fixed set of lip/mouth point indices from MediaPipe's 468-point
# face mesh. We deliberately don't use the full face -- 468 points per frame
# is mostly irrelevant noise for sign language; we only care about mouth
# shape and movement (non-manual markers).
MOUTH_LANDMARK_IDS = [61, 291, 0, 17, 78, 308, 13, 14, 87, 317, 82, 312]
MOUTH_COORDS = 2  # x, y is enough for mouth shape
MOUTH_FEATURES = len(MOUTH_LANDMARK_IDS) * MOUTH_COORDS  # 24

FRAME_FEATURE_SIZE = (HAND_FEATURES * 2) + POSE_FEATURES + MOUTH_FEATURES  # 249


def _hand_vector(hand_landmarks):
    if hand_landmarks is None:
        return [0.0] * HAND_FEATURES
    vec = []
    for lm in hand_landmarks.landmark:
        vec.extend([lm.x, lm.y, lm.z])
    return vec


def _pose_vector(pose_landmarks):
    if pose_landmarks is None:
        return [0.0] * POSE_FEATURES
    vec = []
    for lm in pose_landmarks.landmark:
        vec.extend([lm.x, lm.y, lm.z])
    return vec


def _mouth_vector(face_landmarks):
    if face_landmarks is None:
        return [0.0] * MOUTH_FEATURES
    vec = []
    for idx in MOUTH_LANDMARK_IDS:
        lm = face_landmarks.landmark[idx]
        vec.extend([lm.x, lm.y])
    return vec


def extract_frame_features(results):
    """
    Build ONE frame's feature vector from a MediaPipe Holistic `results`
    object. Always returns a fixed-length list (FRAME_FEATURE_SIZE).

    Note: Holistic directly labels left_hand_landmarks / right_hand_landmarks
    for you -- unlike the plain Hands solution, there's no separate
    handedness lookup needed here.
    """
    left = _hand_vector(results.left_hand_landmarks)
    right = _hand_vector(results.right_hand_landmarks)
    pose = _pose_vector(results.pose_landmarks)
    mouth = _mouth_vector(results.face_landmarks)
    return left + right + pose + mouth


# ---------------------------------------------------------------------------
# HANDS-ONLY feature extraction (no pose, no face/mouth)
#
# Use this instead of extract_frame_features() when you only care about hand
# shape -- e.g. alphabet letters, where pose/mouth data is irrelevant and can
# actually add noise that makes visually similar letters (C, O, S) harder to
# tell apart.
#
# IMPORTANT DIFFERENCE from _hand_vector() above: each hand's landmarks are
# normalized to THAT HAND'S OWN local bounding box (x,y minus that hand's
# min x,y), same approach as the original static-image model. This makes
# recognition position-invariant -- holding a sign in the top-left of the
# frame produces the same features as holding it center-frame, which the
# raw/global coordinates used elsewhere in this file do NOT guarantee.
# ---------------------------------------------------------------------------

FRAME_FEATURE_SIZE_HANDS_ONLY = HAND_FEATURES * 2  # 126 (both hands, x,y,z, bbox-normalized)


def _hand_vector_normalized(hand_landmarks):
    """Same idea as landmark_utils.py's static-model normalization, but
    keeping the z coordinate too (Holistic gives us z for free)."""
    if hand_landmarks is None:
        return [0.0] * HAND_FEATURES

    xs = [lm.x for lm in hand_landmarks.landmark]
    ys = [lm.y for lm in hand_landmarks.landmark]
    min_x, min_y = min(xs), min(ys)

    vec = []
    for lm in hand_landmarks.landmark:
        vec.extend([lm.x - min_x, lm.y - min_y, lm.z])
    return vec


def extract_hands_only_features(results):
    """
    Build ONE frame's HANDS-ONLY feature vector (126 numbers: left hand +
    right hand, each bbox-normalized). No pose, no mouth/face.
    """
    left = _hand_vector_normalized(results.left_hand_landmarks)
    right = _hand_vector_normalized(results.right_hand_landmarks)
    return left + right


def convert_full_vector_to_hands_only(full_frame_vector):
    """
    Takes ONE frame's already-extracted 249-length vector (from
    extract_frame_features) and converts it to the 126-length hands-only,
    bbox-normalized version -- WITHOUT needing the original video.

    This lets you reuse data you already recorded instead of re-collecting
    everything from scratch. Layout reminder: [0:63]=left hand (x,y,z * 21),
    [63:126]=right hand (x,y,z * 21), [126:225]=pose, [225:249]=mouth.
    """
    import numpy as np

    def _renormalize_hand(flat_63):
        arr = np.array(flat_63, dtype=np.float32).reshape(21, 3)  # (landmark, xyz)
        if np.all(arr == 0.0):
            return [0.0] * HAND_FEATURES  # hand wasn't detected in this frame
        min_x = arr[:, 0].min()
        min_y = arr[:, 1].min()
        arr[:, 0] -= min_x
        arr[:, 1] -= min_y
        return arr.flatten().tolist()

    left_raw = full_frame_vector[0:HAND_FEATURES]
    right_raw = full_frame_vector[HAND_FEATURES:HAND_FEATURES * 2]

    return _renormalize_hand(left_raw) + _renormalize_hand(right_raw)