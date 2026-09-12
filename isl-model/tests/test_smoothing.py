"""Tests for temporal smoothing filter and majority voting."""

import pytest
from src.smoothing import TemporalSmoother


def test_initial_state():
    smoother = TemporalSmoother(window_size=5, majority_ratio=0.6)
    gesture, conf, confirmed = smoother.get_smoothed_prediction()
    assert gesture == "UNKNOWN"
    assert conf == 0.0
    assert not confirmed


def test_single_frame_not_confirmed():
    smoother = TemporalSmoother(window_size=5, majority_ratio=0.6)
    # A single frame of HELP should not instantly confirm
    gesture, conf, confirmed = smoother.add_prediction("HELP", 0.95)
    assert not confirmed


def test_majority_voting_confirmation():
    smoother = TemporalSmoother(window_size=5, majority_ratio=0.6)
    # Feed 4 HELP out of 5 frames
    smoother.add_prediction("HELP", 0.90)
    smoother.add_prediction("HELP", 0.92)
    smoother.add_prediction("NO", 0.60)
    smoother.add_prediction("HELP", 0.94)
    gesture, conf, confirmed = smoother.add_prediction("HELP", 0.96)

    assert confirmed is True
    assert gesture == "HELP"
    # Average confidence of HELP frames
    expected_avg = round((0.90 + 0.92 + 0.94 + 0.96) / 4, 4)
    assert conf == expected_avg


def test_flickering_transitions_rejected():
    smoother = TemporalSmoother(window_size=5, majority_ratio=0.7)
    # Alternating predictions (unstable hand or noise)
    smoother.add_prediction("HELP", 0.85)
    smoother.add_prediction("YES", 0.80)
    smoother.add_prediction("NO", 0.82)
    smoother.add_prediction("HELP", 0.88)
    gesture, conf, confirmed = smoother.add_prediction("YES", 0.75)

    assert confirmed is False


def test_unknown_never_confirmed():
    smoother = TemporalSmoother(window_size=5, majority_ratio=0.6)
    # Even if UNKNOWN is the majority, confirmed must remain False
    for _ in range(5):
        smoother.add_prediction("UNKNOWN", 0.40)
    gesture, conf, confirmed = smoother.get_smoothed_prediction()

    assert gesture == "UNKNOWN"
    assert confirmed is False


def test_reset_clears_buffer():
    smoother = TemporalSmoother(window_size=5, majority_ratio=0.6)
    for _ in range(5):
        smoother.add_prediction("HELP", 0.95)
    assert smoother.get_smoothed_prediction()[2] is True

    smoother.reset()
    assert smoother.get_smoothed_prediction() == ("UNKNOWN", 0.0, False)
