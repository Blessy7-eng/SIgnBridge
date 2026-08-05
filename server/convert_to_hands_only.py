import os
import numpy as np

from holistic_utils import convert_full_vector_to_hands_only

SOURCE_DIR = './data_motion'          # your existing recordings (249 features/frame)
TARGET_DIR = './data_motion_hands'    # new hands-only version (126 features/frame)

if not os.path.exists(TARGET_DIR):
    os.makedirs(TARGET_DIR)

converted = 0
skipped = 0

for class_name in sorted(os.listdir(SOURCE_DIR)):
    class_source_dir = os.path.join(SOURCE_DIR, class_name)
    if not os.path.isdir(class_source_dir):
        continue

    class_target_dir = os.path.join(TARGET_DIR, class_name)
    os.makedirs(class_target_dir, exist_ok=True)

    for fname in os.listdir(class_source_dir):
        if not fname.endswith('.npy'):
            continue

        sequence = np.load(os.path.join(class_source_dir, fname))  # (seq_len, 249)

        if sequence.shape[1] != 249:
            print(f'Warning: {class_name}/{fname} has unexpected shape {sequence.shape}, skipping.')
            skipped += 1
            continue

        hands_only_sequence = np.array([
            convert_full_vector_to_hands_only(frame.tolist())
            for frame in sequence
        ])  # (seq_len, 126)

        np.save(os.path.join(class_target_dir, fname), hands_only_sequence)
        converted += 1

print(f'\nConverted {converted} sequences into {TARGET_DIR}/ (skipped {skipped}).')
print('Your original data_motion/ folder is untouched - this created a separate copy.')