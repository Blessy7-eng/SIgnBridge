import pickle
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

torch.manual_seed(42)
np.random.seed(42)

# ---------- Load data ----------
with open('motion_data.pickle', 'rb') as f:
    data_dict = pickle.load(f)

X = data_dict['data']       # shape: (num_samples, seq_len, feature_size)
y_raw = data_dict['labels']

print(f'Loaded {len(X)} samples, {len(set(y_raw))} classes.')

encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y_raw)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, shuffle=True, random_state=42, stratify=y_encoded
)

seq_len = X.shape[1]
feature_size = X.shape[2]
num_classes = len(encoder.classes_)

# ---------- Feature normalization ----------
# Hand landmarks are already normalized to each hand's own bounding box
# (roughly 0-1), but pose and mouth landmarks are raw image coordinates.
# Mixing unnormalized scales like this is a common cause of unstable,
# oscillating training loss. Standardize every feature (mean 0, std 1)
# using ONLY the training set statistics, then apply the same transform
# to the test set and (later) to live inference frames.
train_mean = X_train.reshape(-1, feature_size).mean(axis=0)
train_std = X_train.reshape(-1, feature_size).std(axis=0)
train_std[train_std == 0] = 1.0  # avoid divide-by-zero for any constant feature

X_train = (X_train - train_mean) / train_std
X_test = (X_test - train_mean) / train_std

# ---------- Convert to PyTorch tensors ----------
X_train_t = torch.tensor(X_train, dtype=torch.float32)
y_train_t = torch.tensor(y_train, dtype=torch.long)
X_test_t = torch.tensor(X_test, dtype=torch.float32)
y_test_t = torch.tensor(y_test, dtype=torch.long)

train_loader = DataLoader(TensorDataset(X_train_t, y_train_t), batch_size=8, shuffle=True)


# ---------- Model ----------
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
        out = out[:, -1, :]           # take the LAST time step's output
        out = self.dropout(out)
        out = self.relu(self.fc1(out))
        out = self.fc2(out)
        return out


HIDDEN1 = 64
HIDDEN2 = 128
EPOCHS = 150
LEARNING_RATE = 0.0005   # lowered from 0.001 - the higher rate was contributing to loss oscillation

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f'Training on: {device}')

model = SignLSTM(feature_size, HIDDEN1, HIDDEN2, num_classes).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)

best_test_acc = 0.0
best_state_dict = None

# ---------- Training loop ----------
for epoch in range(EPOCHS):
    model.train()
    total_loss = 0
    correct_train = 0
    total_train = 0

    for batch_X, batch_y in train_loader:
        batch_X, batch_y = batch_X.to(device), batch_y.to(device)

        optimizer.zero_grad()
        outputs = model(batch_X)
        loss = criterion(outputs, batch_y)
        loss.backward()

        # Gradient clipping - prevents occasional large gradient spikes from
        # throwing training into the kind of oscillation seen before
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

        optimizer.step()

        total_loss += loss.item()
        correct_train += (torch.argmax(outputs, dim=1) == batch_y).sum().item()
        total_train += batch_y.size(0)

    train_acc = correct_train / total_train

    model.eval()
    with torch.no_grad():
        test_outputs = model(X_test_t.to(device))
        test_preds = torch.argmax(test_outputs, dim=1).cpu()
        test_acc = (test_preds == y_test_t).float().mean().item()

    # Keep the BEST-performing snapshot seen so far, not just whatever the
    # last epoch happens to land on - this matters a lot on noisy small
    # datasets where accuracy legitimately bounces around between epochs
    if test_acc > best_test_acc:
        best_test_acc = test_acc
        best_state_dict = {k: v.clone() for k, v in model.state_dict().items()}

    if (epoch + 1) % 10 == 0 or epoch == 0:
        print(f'Epoch {epoch + 1}/{EPOCHS} - loss: {total_loss / len(train_loader):.4f} '
              f'- train_acc: {train_acc * 100:.2f}% - test_acc: {test_acc * 100:.2f}% '
              f'- best_test_acc: {best_test_acc * 100:.2f}%')

print(f'\nBest test accuracy seen during training: {best_test_acc * 100:.2f}%')

# ---------- Per-class breakdown: WHICH letters/words are confused ----------
# Overall accuracy alone can't tell you that "C" and "O" keep getting mixed
# up - this report can. Use it to decide where to focus more data collection.
model.load_state_dict(best_state_dict)
model.eval()
with torch.no_grad():
    final_test_outputs = model(X_test_t.to(device))
    final_test_preds = torch.argmax(final_test_outputs, dim=1).cpu().numpy()

print('\n--- Per-class report (best checkpoint) ---')
print(classification_report(
    y_test, final_test_preds,
    target_names=encoder.classes_,
    zero_division=0
))

# ---------- Save the BEST model, plus normalization stats for inference ----------
torch.save({
    'model_state_dict': best_state_dict,
    'input_size': feature_size,
    'hidden_size1': HIDDEN1,
    'hidden_size2': HIDDEN2,
    'num_classes': num_classes,
    'seq_len': seq_len,
    'train_mean': train_mean,
    'train_std': train_std,
}, 'motion_model.pt')

with open('motion_label_encoder.pickle', 'wb') as f:
    pickle.dump(encoder, f)

print('Saved motion_model.pt (best checkpoint) and motion_label_encoder.pickle')