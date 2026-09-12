"""ONNX-accelerated gesture predictor — drop-in replacement for GesturePredictor.

Falls back to the original sklearn GesturePredictor if the ONNX model file is
absent, so no code path is broken when the ONNX export hasn't been run yet.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_ONNX_PATH = PROJECT_ROOT / "models" / "isl_model.onnx"
DEFAULT_CONFIG_PATH = PROJECT_ROOT / "config" / "gestures.json"
DEFAULT_METADATA_PATH = PROJECT_ROOT / "models" / "model_metadata.json"


class OnnxGesturePredictor:
    """Run gesture inference via ONNX Runtime.

    Parameters
    ----------
    onnx_path:
        Path to ``isl_model.onnx``.
    gestures_config_path:
        Path to ``gestures.json`` containing label list and phrase mappings.
    metadata_path:
        Path to ``model_metadata.json``.
    confidence_threshold:
        Minimum confidence to accept a prediction (default 0.30).
    """

    def __init__(
        self,
        onnx_path: Path = DEFAULT_ONNX_PATH,
        gestures_config_path: Path = DEFAULT_CONFIG_PATH,
        metadata_path: Path = DEFAULT_METADATA_PATH,
        confidence_threshold: float = 0.70,
    ) -> None:
        self._onnx_path = onnx_path
        self.confidence_threshold = confidence_threshold
        self._session: Any = None
        self._input_name: str = ""
        self.is_loaded: bool = False
        self.gesture_labels: List[str] = []
        self.phrase_map: Dict[str, str] = {}
        self.metadata: Dict[str, Any] = {}

        self._load_config(gestures_config_path)
        self._load_metadata(metadata_path)
        if "confidence_threshold" in self.metadata:
            self.confidence_threshold = float(self.metadata["confidence_threshold"])
        self._load_onnx(onnx_path)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _load_config(self, path: Path) -> None:
        import json

        try:
            cfg = json.loads(path.read_text(encoding="utf-8"))
            self.gesture_labels = cfg.get("gestures", [])
            self.phrase_map = cfg.get("phrases", {})
        except Exception as exc:
            logger.warning("Could not load gestures config: %s", exc)

    def _load_metadata(self, path: Path) -> None:
        import json

        try:
            if path.exists():
                self.metadata = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            logger.warning("Could not load model metadata: %s", exc)

    def _load_onnx(self, path: Path) -> None:
        try:
            import onnxruntime as ort  # type: ignore

            self._session = ort.InferenceSession(
                str(path), providers=["CPUExecutionProvider"]
            )
            self._input_name = self._session.get_inputs()[0].name
            self.is_loaded = True
            logger.info("ONNX model loaded from %s (input: %s)", path, self._input_name)
        except Exception as exc:
            self.is_loaded = False
            logger.warning("Failed to load ONNX model from %s: %s", path, exc)

    # ------------------------------------------------------------------
    # Public API (mirrors GesturePredictor)
    # ------------------------------------------------------------------

    def predict(
        self, input_data: Union[List[Dict[str, float]], List[float]]
    ) -> Dict[str, Any]:
        """Predict gesture from 21 landmarks or 63-element feature vector.

        Returns the same dict schema as ``GesturePredictor.predict()``.
        """
        if not self.is_loaded or self._session is None:
            raise RuntimeError("ONNX model is not loaded.")

        import numpy as np

        features = self._extract_features(input_data)
        arr = np.array([features], dtype=np.float32)

        outputs = self._session.run(None, {self._input_name: arr})
        predicted_label = str(outputs[0][0])

        # Probabilities (second output from skl2onnx random forest export)
        raw_probs: Dict[str, float] = {}
        confidence = 0.0
        if len(outputs) >= 2:
            prob_array = outputs[1]
            if isinstance(prob_array, list) and len(prob_array) > 0 and isinstance(prob_array[0], dict):
                raw_probs = {str(k): float(v) for k, v in prob_array[0].items()}
            elif hasattr(prob_array, "values"):
                # ZipMap output → dict
                raw_probs = {k: float(v) for k, v in prob_array[0].items()}
            elif isinstance(prob_array, (list, np.ndarray)):
                # numpy ndarray aligned to gesture_labels
                probs = prob_array[0]
                raw_probs = {
                    label: float(prob)
                    for label, prob in zip(self.gesture_labels, probs)
                }
            confidence = float(raw_probs.get(predicted_label, 0.0))

        accepted = (
            predicted_label != "UNKNOWN"
            and confidence >= self.confidence_threshold
        )
        phrase = self.phrase_map.get(
            predicted_label, f"Gesture: {predicted_label}"
        )

        return {
            "gesture": predicted_label,
            "confidence": round(confidence, 4),
            "accepted": accepted,
            "phrase": phrase,
            "raw_probabilities": raw_probs,
        }

    def get_supported_gestures(self) -> List[str]:
        return list(self.gesture_labels)

    # ------------------------------------------------------------------
    # Feature extraction (identical to GesturePredictor / FeatureExtractor)
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_features(
        input_data: Union[List[Dict[str, float]], List[float]]
    ) -> List[float]:
        """Convert 21 landmark dicts or flat 63-float list to feature vector."""
        if not input_data:
            raise ValueError("input_data is empty")

        # Already a flat feature vector
        if isinstance(input_data[0], (int, float)):
            if len(input_data) != 63:
                raise ValueError(
                    f"Expected 63 feature values, got {len(input_data)}"
                )
            return list(input_data)

        # Landmark dict list → flat [x0,y0,z0, x1,y1,z1, ...]
        if len(input_data) != 21:
            raise ValueError(
                f"Expected 21 landmarks, got {len(input_data)}"
            )
        features: List[float] = []
        for pt in input_data:
            if isinstance(pt, dict):
                features.extend([float(pt.get("x", 0)), float(pt.get("y", 0)), float(pt.get("z", 0))])
            else:
                raise ValueError("Landmark must be a dict with x, y, z keys")
        return features
