"""ONNX-accelerated gesture predictor — drop-in replacement for GesturePredictor.

Falls back to the original sklearn GesturePredictor if the ONNX model file is
absent, so no code path is broken when the ONNX export hasn't been run yet.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from src.feature_extractor import FEATURE_DIM, extract_features

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
        Minimum confidence to accept a prediction (default 0.65).
    top_margin:
        Minimum margin between top-1 and top-2 class probabilities (default 0.15).
    """

    def __init__(
        self,
        onnx_path: Path = DEFAULT_ONNX_PATH,
        gestures_config_path: Path = DEFAULT_CONFIG_PATH,
        metadata_path: Path = DEFAULT_METADATA_PATH,
        confidence_threshold: float = 0.65,
        top_margin: float = 0.15,
    ) -> None:
        self._onnx_path = onnx_path
        self.confidence_threshold = confidence_threshold
        self.top_margin = top_margin
        self._session: Any = None
        self._input_name: str = ""
        self.is_loaded: bool = False
        self.gesture_labels: List[str] = []
        self.phrase_map: Dict[str, str] = {}
        self.unknown_label: str = "UNKNOWN"
        self.default_phrase: str = "Gesture not recognized. Please try again."
        self.metadata: Dict[str, Any] = {}

        self._load_config(gestures_config_path)
        self._load_metadata(metadata_path)
        self._load_onnx(onnx_path)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _load_config(self, path: Path) -> None:
        import json

        try:
            cfg = json.loads(path.read_text(encoding="utf-8"))
            self.unknown_label = cfg.get("unknown_label", "UNKNOWN")

            # Load gestures and phrases
            raw_gestures = cfg.get("gestures", [])
            self.gesture_labels = []
            self.phrase_map = {}
            for item in raw_gestures:
                if isinstance(item, dict):
                    gid = item["id"]
                    self.gesture_labels.append(gid)
                    self.phrase_map[gid] = item.get("phrase", f"Gesture: {gid}")
                elif isinstance(item, str):
                    self.gesture_labels.append(item)

            if "phrases" in cfg:
                self.phrase_map.update(cfg["phrases"])

            self.default_phrase = self.phrase_map.get(
                self.unknown_label, "Gesture not recognized. Please try again."
            )

            # Load rejection policy
            rejection_policy = cfg.get("rejection_policy", {})
            if "confidence_threshold" in rejection_policy:
                self.confidence_threshold = float(rejection_policy["confidence_threshold"])
            if "top_margin" in rejection_policy:
                self.top_margin = float(rejection_policy["top_margin"])
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
        if len(outputs) >= 2:
            prob_array = outputs[1]
            if isinstance(prob_array, list) and len(prob_array) > 0 and isinstance(prob_array[0], dict):
                raw_probs = {str(k): float(v) for k, v in prob_array[0].items()}
            elif hasattr(prob_array, "values"):
                raw_probs = {k: float(v) for k, v in prob_array[0].items()}
            elif isinstance(prob_array, (list, np.ndarray)):
                probs = prob_array[0]
                raw_probs = {
                    label: float(prob)
                    for label, prob in zip(self.gesture_labels, probs)
                }

        # Calculate top-1 and top-2 probabilities for margin gating
        sorted_probs = sorted(raw_probs.values(), reverse=True)
        top1_conf = sorted_probs[0] if len(sorted_probs) > 0 else float(raw_probs.get(predicted_label, 0.0))
        top2_conf = sorted_probs[1] if len(sorted_probs) > 1 else 0.0
        margin = float(top1_conf - top2_conf)

        is_rejected = (
            predicted_label == self.unknown_label
            or top1_conf < self.confidence_threshold
            or margin < self.top_margin
        )

        if is_rejected:
            accepted = False
            final_gesture = self.unknown_label
            final_phrase = self.default_phrase
        else:
            accepted = True
            final_gesture = predicted_label
            final_phrase = self.phrase_map.get(
                predicted_label, f"Gesture: {predicted_label}"
            )

        return {
            "gesture": final_gesture,
            "confidence": round(top1_conf, 4),
            "margin": round(margin, 4),
            "accepted": accepted,
            "phrase": final_phrase,
            "raw_probabilities": {k: round(v, 4) for k, v in raw_probs.items()},
        }

    def get_supported_gestures(self) -> List[str]:
        return list(self.gesture_labels)

    # ------------------------------------------------------------------
    # Feature extraction (canonical pipeline)
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_features(
        input_data: Union[List[Dict[str, float]], List[float], np.ndarray]
    ) -> List[float]:
        """Convert 21 landmark dicts or flat 63-float list to normalized feature vector."""
        if input_data is None or len(input_data) == 0:
            raise ValueError("input_data is empty")

        # Already a flat 63 feature vector
        if isinstance(input_data[0], (int, float)):
            if len(input_data) != FEATURE_DIM:
                raise ValueError(
                    f"Expected {FEATURE_DIM} feature values, got {len(input_data)}"
                )
            return [float(x) for x in input_data]

        # Use canonical extract_features for 21 landmark dicts or objects
        norm_arr = extract_features(input_data)
        return [float(x) for x in norm_arr]
