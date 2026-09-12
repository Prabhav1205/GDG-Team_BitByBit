"""Test prediction against running FastAPI server for all 10 gestures."""

import json
from pathlib import Path
import urllib.request

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SAMPLES_FILE = PROJECT_ROOT / "config" / "sample_gesture_vectors.json"

def test_api():
    with open(SAMPLES_FILE, "r", encoding="utf-8") as f:
        samples = json.load(f)

    for gesture_name, data in samples.items():
        payload = json.dumps({"features": data["features"]}).encode("utf-8")
        req = urllib.request.Request(
            "http://127.0.0.1:8000/predict",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            res = json.loads(resp.read().decode("utf-8"))
            print(f"Tested {gesture_name:<12} => Predicted: {res['gesture']:<12} Confidence: {res['confidence']}")
            assert res["gesture"] == gesture_name
            assert res["confidence"] >= 0.90

if __name__ == "__main__":
    test_api()
    print("\nALL 10 GESTURES PREDICTED WITH 100% ACCURACY!")
