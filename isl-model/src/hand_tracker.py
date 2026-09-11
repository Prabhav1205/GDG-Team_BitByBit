"""Reusable MediaPipe Hand Tracking Module.

Provides robust single-hand and multi-hand landmark detection, coordinate extraction,
and visual debugging overlays for the ISL recognition pipeline.
Supports both modern MediaPipe 1.0+ (Tasks API) and legacy MediaPipe (<1.0 Solutions API).
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import urllib.request
import cv2
import numpy as np

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    mp = None
    MEDIAPIPE_AVAILABLE = False

# Default storage for MediaPipe 1.0+ task model
DEFAULT_MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
TASK_MODEL_PATH = DEFAULT_MODEL_DIR / "hand_landmarker.task"
TASK_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)

# Standard 21-hand landmark connections
HAND_CONNECTIONS = [
    # Thumb
    (0, 1), (1, 2), (2, 3), (3, 4),
    # Index finger
    (0, 5), (5, 6), (6, 7), (7, 8),
    # Middle finger
    (0, 9), (9, 10), (10, 11), (11, 12),
    # Ring finger
    (0, 13), (13, 14), (14, 15), (15, 16),
    # Pinky
    (0, 17), (17, 18), (18, 19), (19, 20),
    # Palm base
    (5, 9), (9, 13), (13, 17)
]


class HandTracker:
    """Wrapper around MediaPipe Hands for robust, crash-resilient hand tracking.

    Supports:
    - MediaPipe 1.0+ Tasks API (HandLandmarker) with automatic model caching.
    - Legacy MediaPipe (<1.0) Solutions API fallback.
    - 21 landmarks per hand with (x, y, z) normalized coordinates.
    - Graceful handling when no hands are present or camera frames are invalid.
    - High-performance, anti-aliased visual landmark drawing.
    """

    HAND_LANDMARK_COUNT = 21

    def __init__(
        self,
        static_image_mode: bool = False,
        max_num_hands: int = 1,
        min_detection_confidence: float = 0.6,
        min_tracking_confidence: float = 0.5,
        model_path: Optional[Path] = None,
    ) -> None:
        if not MEDIAPIPE_AVAILABLE:
            raise RuntimeError(
                "MediaPipe is not installed. Please install mediapipe via pip install -r requirements.txt"
            )

        self.static_image_mode = static_image_mode
        self.max_num_hands = max_num_hands
        self.min_detection_confidence = min_detection_confidence
        self.min_tracking_confidence = min_tracking_confidence
        self.model_path = Path(model_path) if model_path else TASK_MODEL_PATH

        self._is_legacy = hasattr(mp, "solutions") and hasattr(mp.solutions, "hands")
        self._last_landmarks: Optional[List[Dict[str, float]]] = None

        if self._is_legacy:
            # MediaPipe legacy (<1.0)
            self.mp_hands = mp.solutions.hands
            self.detector = self.mp_hands.Hands(
                static_image_mode=self.static_image_mode,
                max_num_hands=self.max_num_hands,
                min_detection_confidence=self.min_detection_confidence,
                min_tracking_confidence=self.min_tracking_confidence,
            )
        else:
            # Modern MediaPipe 1.0+ Tasks API
            self._ensure_task_model()
            from mediapipe.tasks.python import BaseOptions
            from mediapipe.tasks.python.vision import (
                HandLandmarker,
                HandLandmarkerOptions,
                RunningMode,
            )

            base_options = BaseOptions(model_asset_path=str(self.model_path))
            options = HandLandmarkerOptions(
                base_options=base_options,
                running_mode=RunningMode.IMAGE,
                num_hands=self.max_num_hands,
                min_hand_detection_confidence=self.min_detection_confidence,
                min_tracking_confidence=self.min_tracking_confidence,
            )
            self.detector = HandLandmarker.create_from_options(options)

    def _ensure_task_model(self) -> None:
        """Ensures the hand_landmarker.task model file is available locally."""
        if not self.model_path.exists() or self.model_path.stat().st_size == 0:
            print(f"[HandTracker] Downloading MediaPipe task model to {self.model_path}...")
            self.model_path.parent.mkdir(parents=True, exist_ok=True)
            urllib.request.urlretrieve(TASK_MODEL_URL, self.model_path)
            print("[HandTracker] Task model downloaded successfully.")

    def process_frame(
        self, frame: np.ndarray
    ) -> Tuple[bool, Optional[List[Dict[str, float]]], Optional[Any]]:
        """Processes a BGR camera frame and detects hand landmarks.

        Args:
            frame: BGR image from OpenCV.

        Returns:
            Tuple of:
            - hand_detected (bool): True if at least one valid hand with 21 landmarks was found.
            - landmarks (Optional[List[Dict[str, float]]]): List of 21 landmark dicts with keys 'x', 'y', 'z'.
            - raw_results: Raw detection result.
        """
        if frame is None or frame.size == 0:
            return False, None, None

        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            if self._is_legacy:
                rgb_frame.flags.writeable = False
                results = self.detector.process(rgb_frame)
                rgb_frame.flags.writeable = True

                if not results.multi_hand_landmarks:
                    self._last_landmarks = None
                    return False, None, results

                primary_hand = results.multi_hand_landmarks[0]
                landmarks = [
                    {"x": float(lm.x), "y": float(lm.y), "z": float(lm.z)}
                    for lm in primary_hand.landmark
                ]
            else:
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
                results = self.detector.detect(mp_image)

                if not results.hand_landmarks:
                    self._last_landmarks = None
                    return False, None, results

                primary_hand = results.hand_landmarks[0]
                landmarks = [
                    {"x": float(lm.x), "y": float(lm.y), "z": float(lm.z)}
                    for lm in primary_hand
                ]

            if len(landmarks) != self.HAND_LANDMARK_COUNT:
                self._last_landmarks = None
                return False, None, results

            self._last_landmarks = landmarks
            return True, landmarks, results

        except Exception as e:
            print(f"[HandTracker Warning] Frame processing failed: {e}")
            self._last_landmarks = None
            return False, None, None

    def draw_landmarks(
        self,
        frame: np.ndarray,
        results: Optional[Any] = None,
        draw_connections: bool = True,
        landmark_color: Tuple[int, int, int] = (0, 255, 120),  # Neon Green/Cyan
        connection_color: Tuple[int, int, int] = (255, 200, 0),  # Bright Cyan/Yellow
    ) -> np.ndarray:
        """Draws clean, high-visibility hand landmarks and connections on frame."""
        if self._last_landmarks is None or len(self._last_landmarks) != self.HAND_LANDMARK_COUNT:
            return frame

        h, w, _ = frame.shape
        px_coords: List[Tuple[int, int]] = []

        for lm in self._last_landmarks:
            cx = int(np.clip(lm["x"] * w, 0, w - 1))
            cy = int(np.clip(lm["y"] * h, 0, h - 1))
            px_coords.append((cx, cy))

        if draw_connections:
            for start_idx, end_idx in HAND_CONNECTIONS:
                if start_idx < len(px_coords) and end_idx < len(px_coords):
                    cv2.line(
                        frame,
                        px_coords[start_idx],
                        px_coords[end_idx],
                        connection_color,
                        2,
                        cv2.LINE_AA,
                    )

        for idx, pt in enumerate(px_coords):
            # Wrist and fingertips have slightly larger radii
            radius = 5 if idx in (0, 4, 8, 12, 16, 20) else 3
            cv2.circle(frame, pt, radius, landmark_color, -1, cv2.LINE_AA)
            cv2.circle(frame, pt, radius + 1, (0, 0, 0), 1, cv2.LINE_AA)

        return frame

    def close(self) -> None:
        """Releases MediaPipe resources."""
        if hasattr(self, "detector") and self.detector:
            self.detector.close()

    def __enter__(self) -> "HandTracker":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()

