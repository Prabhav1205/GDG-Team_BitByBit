"""ISL Gesture Predictor Engine.

Loads the trained scikit-learn classifier, extracts normalized features from
landmarks using the shared canonical feature extractor, evaluates class probabilities,
applies configurable confidence gating, and maps recognized gestures to institutional phrases.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Union
import joblib
import numpy as np

from src.feature_extractor import FEATURE_DIM, extract_features


class ModelNotLoadedError(RuntimeError):
    """Raised when inference is requested before a valid model is loaded."""
    pass


class GesturePredictor:
    """Production predictor engine for ISL landmark recognition."""

    def __init__(
        self,
        model_path: Union[str, Path],
        gestures_config_path: Union[str, Path],
        confidence_threshold: float = 0.65,
        top_margin: float = 0.15,

        metadata_path: Optional[Union[str, Path]] = None,
    ) -> None:
        """Initializes the predictor with model weights and configuration.

        Args:
            model_path: Path to serialized .pkl model file.
            gestures_config_path: Path to gestures.json configuration.
            confidence_threshold: Minimum probability required to accept a prediction.
            top_margin: Minimum margin between top-1 and top-2 class probabilities.
            metadata_path: Optional path to model_metadata.json.
        """
        self.model_path = Path(model_path)
        self.gestures_config_path = Path(gestures_config_path)
        self.metadata_path = Path(metadata_path) if metadata_path else None
        self.confidence_threshold = confidence_threshold
        self.top_margin = top_margin

        self.model = None
        self.metadata = {}
        self.phrase_map: Dict[str, str] = {}
        self.unknown_label: str = "UNKNOWN"
        self.default_phrase: str = "Gesture not recognized. Please try again."

        self._load_config()
        self._load_model()

    def _load_config(self) -> None:
        """Loads gesture mappings and institutional phrases."""
        if not self.gestures_config_path.exists():
            raise FileNotFoundError(
                f"Gesture configuration file not found at: {self.gestures_config_path}"
            )

        with open(self.gestures_config_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)

        self.unknown_label = cfg.get("unknown_label", "UNKNOWN")

        # Load rejection policy parameters from config if present
        rejection_policy = cfg.get("rejection_policy", {})
        if "confidence_threshold" in rejection_policy:
            self.confidence_threshold = float(rejection_policy["confidence_threshold"])
        if "top_margin" in rejection_policy:
            self.top_margin = float(rejection_policy["top_margin"])

        self.phrase_map = {}
        for item in cfg.get("gestures", []):
            g_id = item["id"]
            phrase = item.get("phrase", "")
            self.phrase_map[g_id] = phrase

        self.default_phrase = self.phrase_map.get(
            self.unknown_label, "Gesture not recognized. Please try again."
        )

    def _load_model(self) -> None:
        """Loads serialized scikit-learn model and metadata."""
        if not self.model_path.exists():
            print(f"[Predictor Notice] Model file not found at {self.model_path}. Inference disabled until trained.")
            return

        try:
            self.model = joblib.load(self.model_path)
        except Exception as e:
            raise RuntimeError(f"Failed to deserialize model at {self.model_path}: {e}")

        # The saved forest was trained with parallel workers. Keeping inference
        # single-threaded avoids joblib spawning a Windows multiprocessing pool
        # for each kiosk request (which can fail under restricted hosts).
        if hasattr(self.model, "n_jobs"):
            self.model.n_jobs = 1

        # Load metadata if present
        meta_file = self.metadata_path or self.model_path.parent / "model_metadata.json"
        if meta_file.exists():
            try:
                with open(meta_file, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            except Exception:
                self.metadata = {}

    @property
    def is_loaded(self) -> bool:
        """Checks if a valid model is currently loaded."""
        return self.model is not None

    def get_supported_gestures(self) -> List[str]:
        """Returns list of classes supported by the active model or config."""
        if self.model and hasattr(self.model, "classes_"):
            return list(self.model.classes_)
        return list(self.phrase_map.keys())

    def get_phrase_for_gesture(self, gesture: str) -> str:
        """Retrieves user-facing kiosk phrase for a gesture label."""
        return self.phrase_map.get(gesture, self.default_phrase)

    def predict(
        self,
        landmarks: Union[Sequence[Dict[str, float]], Sequence[Any], np.ndarray],
    ) -> Dict[str, Any]:
        """Predicts ISL gesture from raw hand landmarks.

        Args:
            landmarks: 21 MediaPipe hand landmark points.

        Returns:
            Dict matching standard kiosk contract:
            {
                "gesture": str,
                "confidence": float,
                "accepted": bool,
                "phrase": str,
                "raw_probabilities": Dict[str, float]
            }
        """
        if not self.is_loaded:
            raise ModelNotLoadedError(
                "Inference model is not loaded. Train the model first via scripts/train.py"
            )

        # 1. Feature Extraction (or direct 63-element vector support)
        if isinstance(landmarks, np.ndarray) and landmarks.shape == (FEATURE_DIM,):
            feature_vector = landmarks.astype(np.float32)
        elif (
            isinstance(landmarks, (list, tuple))
            and len(landmarks) == FEATURE_DIM
            and isinstance(landmarks[0], (int, float))
        ):
            feature_vector = np.array(landmarks, dtype=np.float32)
        else:
            feature_vector = extract_features(landmarks)

        # 2. Reshape for classifier (1, 63)
        features_2d = feature_vector.reshape(1, -1)

        # 3. Model Inference & Probabilities
        classes = list(self.model.classes_)
        probabilities = self.model.predict_proba(features_2d)[0]
        prob_dict = {cls_name: round(float(prob), 4) for cls_name, prob in zip(classes, probabilities)}

        # Sort classes by descending probability to find top-1 and top-2
        sorted_indices = np.argsort(probabilities)[::-1]
        best_idx = int(sorted_indices[0])
        best_class = str(classes[best_idx])
        best_confidence = float(probabilities[best_idx])
        second_confidence = float(probabilities[sorted_indices[1]]) if len(sorted_indices) > 1 else 0.0
        margin = float(best_confidence - second_confidence)

        # 4. Multi-Criteria Rejection Gating
        # Reject if:
        # - Best predicted class is explicit UNKNOWN
        # - Confidence is below the required threshold
        # - Margin between top-1 and top-2 predictions is smaller than top_margin
        is_rejected = (
            best_class == self.unknown_label
            or best_confidence < self.confidence_threshold
            or margin < self.top_margin
        )

        if is_rejected:
            accepted = False
            final_gesture = self.unknown_label
            final_phrase = self.default_phrase
        else:
            accepted = True
            final_gesture = best_class
            final_phrase = self.get_phrase_for_gesture(best_class)

        return {
            "gesture": final_gesture,
            "confidence": round(best_confidence, 4),
            "margin": round(margin, 4),
            "accepted": accepted,
            "phrase": final_phrase,
            "raw_probabilities": prob_dict,
        }
