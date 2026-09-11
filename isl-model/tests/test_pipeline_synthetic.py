"""End-to-End Pipeline Verification with Synthetic Test Hand Geometry.

IMPORTANT:
This file generates a strictly isolated synthetic mathematical dataset purely
to verify that the ML training, evaluation, file serialization, and prediction
software pipeline works end-to-end without bugs.
It does NOT generate fake ISL or claim to represent real signs.
"""

from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from src.feature_extractor import (
    FEATURE_DIM,
    extract_features,
    get_feature_column_names,
)
from src.predictor import GesturePredictor
from src.train_model import train_isl_classifier


def create_synthetic_hands(base_offset: float, num_samples: int = 40, noise: float = 0.01) -> list:
    """Creates a list of (21, 3) raw hand landmark arrays with distinctive geometry."""
    rng = np.random.default_rng(42)
    hands = []
    for _ in range(num_samples):
        coords = np.zeros((21, 3), dtype=np.float32)
        # Wrist at origin
        coords[0] = [0.5, 0.7, 0.0]
        for i in range(1, 21):
            coords[i] = coords[0] + [0.04 * (i % 5), -0.04 * (i // 5), 0.0]
        # Make index and middle finger tips distinctive
        coords[8] += [base_offset * 0.15, base_offset * 0.15, 0.0]
        coords[12] += [-base_offset * 0.15, -base_offset * 0.15, 0.0]
        coords += rng.normal(0, noise, size=coords.shape).astype(np.float32)
        hands.append(coords)
    return hands


def test_synthetic_end_to_end_pipeline(tmp_path):
    # 1. Create a controlled synthetic dataset using canonical extract_features
    dataset_csv = tmp_path / "synthetic_test_data.csv"
    model_pkl = tmp_path / "test_model.pkl"
    meta_json = tmp_path / "test_meta.json"
    config_json = Path(__file__).resolve().parent.parent / "config" / "gestures.json"

    cols = ["label"] + get_feature_column_names()

    hands_help = create_synthetic_hands(base_offset=2.0, num_samples=40)
    hands_yes = create_synthetic_hands(base_offset=-2.0, num_samples=40)
    hands_unknown = create_synthetic_hands(base_offset=0.0, num_samples=40)

    rows = []
    for h in hands_help:
        feats = extract_features(h)
        rows.append(["HELP"] + list(feats))
    for h in hands_yes:
        feats = extract_features(h)
        rows.append(["YES"] + list(feats))
    for h in hands_unknown:
        feats = extract_features(h)
        rows.append(["UNKNOWN"] + list(feats))

    df = pd.DataFrame(rows, columns=cols)
    df.to_csv(dataset_csv, index=False)

    # 2. Execute Training
    train_results = train_isl_classifier(
        dataset_path=dataset_csv,
        model_output_path=model_pkl,
        metadata_output_path=meta_json,
        n_estimators=50,
        test_size=0.25,
        random_state=42,
    )

    assert model_pkl.exists()
    assert meta_json.exists()
    assert train_results["accuracy"] >= 0.90

    # 3. Test Prediction Engine with raw 21x3 landmarks and feature vectors
    predictor = GesturePredictor(
        model_path=model_pkl,
        gestures_config_path=config_json,
        confidence_threshold=0.70,
        metadata_path=meta_json,
    )

    assert predictor.is_loaded is True

    # Test predicting a raw landmark sample for HELP
    test_raw_help = hands_help[0]
    pred_help = predictor.predict(test_raw_help)
    assert pred_help["gesture"] == "HELP"
    assert pred_help["accepted"] is True
    assert pred_help["phrase"] == "I need help."
    assert pred_help["confidence"] >= 0.70

    # Test predicting a raw landmark sample for YES
    test_raw_yes = hands_yes[0]
    pred_yes = predictor.predict(test_raw_yes)
    assert pred_yes["gesture"] == "YES"
    assert pred_yes["accepted"] is True
    assert pred_yes["phrase"] == "Yes."

    # Test low-confidence / UNKNOWN handling
    noisy_point = np.random.uniform(-10.0, 10.0, size=(FEATURE_DIM,)).astype(np.float32)
    pred_noisy = predictor.predict(noisy_point)
    if pred_noisy["confidence"] < 0.70:
        assert pred_noisy["accepted"] is False
        assert pred_noisy["gesture"] == "UNKNOWN"
