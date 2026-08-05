import os
import numpy as np
import pickle

DATA_DIR = './data_motion_hands'
data = []
labels = []

for class_name in sorted(os.listdir(DATA_DIR)):
    class_dir = os.path.join(DATA_DIR, class_name)
    if not os.path.isdir(class_dir):
        continue

    for fname in os.listdir(class_dir):
        if not fname.endswith('.npy'):
            continue
        seq = np.load(os.path.join(class_dir, fname))
        data.append(seq)
        labels.append(class_name)

data = np.array(data)    # shape: (num_samples, SEQUENCE_LENGTH, FRAME_FEATURE_SIZE)
labels = np.array(labels)

print(f'Loaded {len(data)} sequences across {len(set(labels))} classes.')
print(f'Shape per sample: {data.shape[1:]}')

with open('motion_data.pickle', 'wb') as f:
    pickle.dump({'data': data, 'labels': labels}, f)

print('Saved motion_data.pickle')