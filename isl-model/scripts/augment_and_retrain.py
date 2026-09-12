"""Augment target class samples with realistic camera noise and retrain ISL model.

This makes the RandomForest classifier robust to slight variations in:
- Distance from camera
- Hand tilt / angle (+/- 8 degrees)
- Natural sensor jitter / noise
- Slight individual hand shape differences
"""

import json
from pathlib import Path
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

DATASET_CSV = PROJECT_ROOT / "dataset" / "isl_landmarks.csv"
MODEL_PATH = PROJECT_ROOT / "models" / "isl_model.pkl"
META_PATH = PROJECT_ROOT / "models" / "model_metadata.json"


def augment_dataset(df: pd.DataFrame, random_seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(random_seed)
    feature_cols = [c for c in df.columns if c != "label"]
    aug_rows = []

    for _, row in df.iterrows():
        label = row["label"]
        if label == "UNKNOWN":
            continue

        feats = row[feature_cols].to_numpy(dtype=np.float32)
        lms = feats.reshape(21, 3)

        # Variation 1: Natural sensor jitter (mimics live camera landmark flutter)
        jittered = lms + rng.normal(0, 0.012, size=lms.shape).astype(np.float32)
        jittered -= jittered[0]
        max_d = np.max(np.linalg.norm(jittered, axis=1))
        if max_d > 0:
            jittered /= max_d
        aug_rows.append([label] + [round(float(v), 6) for v in jittered.flatten()])

        # Variation 2: Slight 2D rotation (-7 to +7 deg) + small depth jitter
        angle = rng.uniform(-np.radians(7), np.radians(7))
        cos_a, sin_a = np.cos(angle), np.sin(angle)
        rot_lms = lms.copy()
        x_r = rot_lms[:, 0] * cos_a - rot_lms[:, 1] * sin_a
        y_r = rot_lms[:, 0] * sin_a + rot_lms[:, 1] * cos_a
        rot_lms[:, 0] = x_r
        rot_lms[:, 1] = y_r
        rot_lms[:, 2] += rng.normal(0, 0.015, size=21).astype(np.float32)
        rot_lms -= rot_lms[0]
        max_d = np.max(np.linalg.norm(rot_lms, axis=1))
        if max_d > 0:
            rot_lms /= max_d
        aug_rows.append([label] + [round(float(v), 6) for v in rot_lms.flatten()])

    df_aug = pd.DataFrame(aug_rows, columns=["label"] + feature_cols)
    print(f"Generated {len(df_aug)} augmented target samples.")
    df_combined = pd.concat([df, df_aug], ignore_index=True)
    df_combined = df_combined.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    return df_combined


def main():
    print("=" * 60)
    print("   DATA AUGMENTATION & ROBUST MODEL RETRAINING")
    print("=" * 60)

    df_raw = pd.read_csv(DATASET_CSV)
    print(f"Original dataset: {len(df_raw)} samples across {df_raw['label'].nunique()} classes.")

    df_full = augment_dataset(df_raw)
    print(f"Augmented dataset: {len(df_full)} samples.")
    df_full.to_csv(DATASET_CSV, index=False)
    print(f"Saved augmented dataset to {DATASET_CSV}")

    feature_cols = [c for c in df_full.columns if c != "label"]
    X = df_full[feature_cols].to_numpy(dtype=np.float32)
    y = df_full["label"].astype(str).to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    print(f"Training RandomForestClassifier on {len(X_train)} samples...")
    clf = RandomForestClassifier(
        n_estimators=180,
        max_depth=30,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Validation Accuracy: {acc * 100:.2f}%\n")
    print(classification_report(y_test, y_pred, digits=3))

    joblib.dump(clf, MODEL_PATH)
    print(f"Saved trained model to {MODEL_PATH}")

    metadata = {
        "model_version": "2.1.0",
        "training_timestamp_utc": pd.Timestamp.now("UTC").isoformat(),
        "classifier_type": "RandomForestClassifier",
        "feature_count": 63,
        "n_estimators": 180,
        "classes": sorted(list(clf.classes_)),
        "class_counts": df_full["label"].value_counts().to_dict(),
        "total_samples": len(df_full),
        "test_accuracy": round(float(acc), 4),
    }
    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to {META_PATH}")


if __name__ == "__main__":
    main()
