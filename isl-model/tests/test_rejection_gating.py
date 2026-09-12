"""Tests for ISL rejection gating: confidence threshold, top-1 vs top-2 margin, and UNKNOWN class."""

import json
from pathlib import Path
import numpy as np
import pytest

from src.feature_extractor import FEATURE_DIM, extract_features
from src.predictor import GesturePredictor

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "models" / "isl_model.pkl"
CONFIG_PATH = PROJECT_ROOT / "config" / "gestures.json"
SAMPLES_PATH = PROJECT_ROOT / "config" / "sample_gesture_vectors.json"


@pytest.fixture
def predictor():
    assert MODEL_PATH.exists(), "Trained model must exist"
    return GesturePredictor(
        model_path=MODEL_PATH,
        gestures_config_path=CONFIG_PATH,
        confidence_threshold=0.65,
        top_margin=0.15,
    )


@pytest.fixture
def sample_vectors():
    with open(SAMPLES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_target_gestures_accepted(predictor, sample_vectors):
    """Verifies that clear target ISL gestures pass rejection gating."""
    target_classes = [
        "HELP", "YES", "NO", "FORM", "MONEY",
        "APPOINTMENT", "ID", "WHERE", "THANK_YOU", "FINISH"
    ]
    for gesture_name in target_classes:
        sample = sample_vectors[gesture_name]
        landmarks = sample["landmarks"]
        result = predictor.predict(landmarks)

        assert result["gesture"] == gesture_name, f"Expected {gesture_name}, got {result['gesture']}"
        assert result["accepted"] is True, f"Gesture {gesture_name} should be accepted"
        assert result["confidence"] >= 0.65
        assert result["margin"] >= 0.15


def test_unknown_class_rejected(predictor, sample_vectors):
    """Verifies that UNKNOWN poses are rejected (accepted = False)."""
    unknown_sample = sample_vectors["UNKNOWN"]
    result = predictor.predict(unknown_sample["landmarks"])

    assert result["gesture"] == "UNKNOWN"
    assert result["accepted"] is False


def test_random_noise_rejected(predictor):
    """Verifies that random hand configurations are classified as UNKNOWN."""
    rng = np.random.default_rng(12345)
    for _ in range(10):
        random_landmarks = [
            {"x": float(x), "y": float(y), "z": float(z)}
            for x, y, z in rng.uniform(0.0, 1.0, size=(21, 3))
        ]
        result = predictor.predict(random_landmarks)
        assert result["accepted"] is False
        assert result["gesture"] == "UNKNOWN"


def test_margin_gating_behavior(predictor):
    """Verifies that if top-1 and top-2 margin is too small, prediction is rejected."""
    # Create a mock predictor instance with artificially high margin requirement
    strict_predictor = GesturePredictor(
        model_path=MODEL_PATH,
        gestures_config_path=CONFIG_PATH,
        confidence_threshold=0.50,
        top_margin=0.999,  # Impossibly high margin
    )
    with open(SAMPLES_PATH, "r", encoding="utf-8") as f:
        samples = json.load(f)

    # Even a real gesture should be rejected if required margin is > 0.999
    sample = samples["HELP"]
    result = strict_predictor.predict(sample["landmarks"])
    if result["margin"] < 0.999:
        assert result["accepted"] is False
        assert result["gesture"] == "UNKNOWN"


def test_landmark_and_feature_normalization_parity(sample_vectors):
    """Verifies that extracting features from 21 landmarks produces normalized vector matching specs."""
    for gesture_name, data in sample_vectors.items():
        landmarks = data["landmarks"]
        features = extract_features(landmarks)
        assert len(features) == FEATURE_DIM
        # Wrist coordinates should be at origin (0, 0, 0)
        assert abs(features[0]) < 1e-5
        assert abs(features[1]) < 1e-5
        assert abs(features[2]) < 1e-5
        # Max coordinate should be bounded in [-1.0, 1.0]
        assert np.max(np.abs(features)) <= 1.0001
