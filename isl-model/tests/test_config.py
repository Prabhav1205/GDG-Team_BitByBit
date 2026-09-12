"""Tests for gesture configuration schema and phrase mappings."""

import json
from pathlib import Path
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = PROJECT_ROOT / "config" / "gestures.json"


def test_config_file_exists():
    assert CONFIG_PATH.exists(), f"Missing config file at {CONFIG_PATH}"


def test_config_structure():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "gestures" in data
    assert "unknown_label" in data
    assert data["unknown_label"] == "UNKNOWN"

    gestures = data["gestures"]
    assert len(gestures) >= 10, f"Expected at least 10 gestures, found {len(gestures)}"

    gesture_ids = set()
    for g in gestures:
        assert "id" in g
        assert "phrase" in g
        assert len(g["id"]) > 0
        assert len(g["phrase"]) > 0
        gesture_ids.add(g["id"])

    # Check required placeholder classes
    required_ids = [
        "HELP",
        "YES",
        "NO",
        "FORM",
        "MONEY",
        "APPOINTMENT",
        "ID",
        "WHERE",
        "THANK_YOU",
        "FINISH",
        "UNKNOWN",
    ]
    for req in required_ids:
        assert req in gesture_ids, f"Required gesture '{req}' missing from config."
