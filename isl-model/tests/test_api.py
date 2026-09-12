"""Tests for FastAPI endpoints using TestClient."""

from fastapi.testclient import TestClient
import pytest

from api.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "mediapipe_available" in data
    assert "model_loaded" in data


def test_model_endpoint(client):
    response = client.get("/model")
    assert response.status_code == 200
    data = response.json()
    assert "model_loaded" in data
    assert "supported_gestures" in data
    assert "phrase_mappings" in data
    assert "HELP" in data["phrase_mappings"]


def test_predict_endpoint_validation(client):
    # Missing both landmarks and features
    response = client.post("/predict", json={})
    assert response.status_code == 422

    # Malformed landmarks count (less than 21)
    bad_payload = {
        "landmarks": [{"x": 0.5, "y": 0.5, "z": 0.0}] * 10
    }
    response = client.post("/predict", json=bad_payload)
    assert response.status_code == 422

    # Multi-hand input must validate every candidate, not silently ignore a
    # malformed hand and score a different one.
    response = client.post("/predict", json={"all_landmarks": bad_payload["landmarks"]})
    assert response.status_code == 422

    response = client.post("/predict", json={"all_landmarks": []})
    assert response.status_code == 422
