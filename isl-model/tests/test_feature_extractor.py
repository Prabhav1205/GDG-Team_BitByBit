"""Tests for geometric feature extraction, translation invariance, and scale invariance."""

import numpy as np
import pytest

from src.feature_extractor import (
    FEATURE_DIM,
    LANDMARK_COUNT,
    extract_features,
    get_feature_column_names,
)


def _generate_mock_hand(seed: int = 42) -> np.ndarray:
    """Generates a synthetic 21x3 hand landmark array."""
    rng = np.random.default_rng(seed)
    # Wrist at (0.5, 0.8, 0.0)
    coords = np.zeros((LANDMARK_COUNT, 3), dtype=np.float32)
    coords[0] = [0.5, 0.8, 0.0]
    for i in range(1, LANDMARK_COUNT):
        coords[i] = coords[0] + rng.uniform(-0.2, 0.2, size=3)
    return coords


def test_feature_column_names():
    cols = get_feature_column_names()
    assert len(cols) == FEATURE_DIM
    assert cols[0] == "x0" and cols[1] == "y0" and cols[2] == "z0"
    assert cols[-3] == "x20" and cols[-2] == "y20" and cols[-1] == "z20"


def test_feature_dimensions():
    hand = _generate_mock_hand()
    feats = extract_features(hand)
    assert isinstance(feats, np.ndarray)
    assert feats.shape == (FEATURE_DIM,)
    assert feats.dtype == np.float32


def test_wrist_origin():
    hand = _generate_mock_hand()
    feats = extract_features(hand)
    # The wrist coordinates (features 0, 1, 2) must be exactly 0.0
    assert np.isclose(feats[0], 0.0, atol=1e-6)
    assert np.isclose(feats[1], 0.0, atol=1e-6)
    assert np.isclose(feats[2], 0.0, atol=1e-6)


def test_translation_invariance():
    hand = _generate_mock_hand()
    shift = np.array([0.35, -0.42, 0.15], dtype=np.float32)
    translated_hand = hand + shift

    feats_orig = extract_features(hand)
    feats_shifted = extract_features(translated_hand)

    assert np.allclose(feats_orig, feats_shifted, atol=1e-5), (
        "Feature extractor must be strictly invariant to camera-frame translations."
    )


def test_scale_invariance():
    hand = _generate_mock_hand()
    wrist = hand[0].copy()
    # Scale all landmark distances from wrist by 2.5x
    scaled_hand = wrist + (hand - wrist) * 2.5

    feats_orig = extract_features(hand)
    feats_scaled = extract_features(scaled_hand)

    assert np.allclose(feats_orig, feats_scaled, atol=1e-5), (
        "Feature extractor must be strictly invariant to hand scale and camera distance."
    )


def test_dict_input_support():
    hand = _generate_mock_hand()
    dict_list = [{"x": float(row[0]), "y": float(row[1]), "z": float(row[2])} for row in hand]
    feats = extract_features(dict_list)
    assert feats.shape == (63,)


def test_invalid_input_count():
    with pytest.raises(ValueError, match="Expected exactly 21 landmarks"):
        extract_features([{"x": 0.1, "y": 0.2, "z": 0.3}] * 15)


def test_nan_values_rejected():
    hand = _generate_mock_hand()
    hand[5, 1] = np.nan
    with pytest.raises(ValueError, match="NaN or infinite"):
        extract_features(hand)
