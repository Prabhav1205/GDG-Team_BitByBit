"""Temporal Smoothing and Confirmation Logic for Gesture Predictions.

Prevents frame-by-frame flickering, spurious classifications, and transient hand
movements from triggering false predictions. Uses a sliding window majority voting
filter combined with confidence weighting.
"""

from collections import Counter, deque
from typing import Deque, List, Optional, Tuple


class TemporalSmoother:
    """Sliding-window majority-vote temporal smoother.

    A prediction is only considered confirmed ('accepted') when a single class
    commands a decisive majority across recent frames (above majority_ratio).
    """

    def __init__(
        self,
        window_size: int = 7,
        majority_ratio: float = 0.65,
        unknown_label: str = "UNKNOWN",
    ) -> None:
        """Initialize the temporal smoother.

        Args:
            window_size: Number of consecutive frames retained in history buffer.
            majority_ratio: Fraction of frames in window that must agree on the same gesture.
            unknown_label: Label assigned to unconfirmed or unclassified gestures.
        """
        if window_size < 1:
            raise ValueError("window_size must be >= 1")
        if not (0.0 < majority_ratio <= 1.0):
            raise ValueError("majority_ratio must be between 0.0 and 1.0")

        self.window_size = window_size
        self.majority_ratio = majority_ratio
        self.unknown_label = unknown_label

        self.gesture_buffer: Deque[str] = deque(maxlen=window_size)
        self.confidence_buffer: Deque[float] = deque(maxlen=window_size)

    def add_prediction(self, gesture: str, confidence: float) -> Tuple[str, float, bool]:
        """Appends a single frame prediction and returns the smoothed status.

        Args:
            gesture: Predicted gesture label for the current frame.
            confidence: Associated probability score [0.0 - 1.0].

        Returns:
            Tuple of:
            - smoothed_gesture (str): The majority-voted gesture label.
            - avg_confidence (float): Mean confidence of matching majority frames.
            - is_confirmed (bool): True if majority_ratio threshold is met and gesture != UNKNOWN.
        """
        self.gesture_buffer.append(gesture)
        self.confidence_buffer.append(float(confidence))
        return self.get_smoothed_prediction()

    def get_smoothed_prediction(self) -> Tuple[str, float, bool]:
        """Calculates current majority vote from the active window.

        Returns:
            Tuple of:
            - smoothed_gesture (str): Majority gesture or UNKNOWN.
            - avg_confidence (float): Average confidence of candidate frames.
            - is_confirmed (bool): True if criteria are satisfied.
        """
        if not self.gesture_buffer:
            return self.unknown_label, 0.0, False

        count = len(self.gesture_buffer)
        counts = Counter(self.gesture_buffer)
        most_common_gesture, most_common_count = counts.most_common(1)[0]

        # Calculate average confidence for the dominant gesture frames
        matching_confs = [
            conf
            for g, conf in zip(self.gesture_buffer, self.confidence_buffer)
            if g == most_common_gesture
        ]
        avg_conf = sum(matching_confs) / len(matching_confs) if matching_confs else 0.0

        # Check if window meets confirmation threshold
        ratio = most_common_count / float(count)
        # Require buffer to have filled at least 60% of window_size before confirming
        min_required_samples = max(2, int(self.window_size * 0.6))
        buffer_sufficient = count >= min_required_samples

        is_confirmed = (
            buffer_sufficient
            and ratio >= self.majority_ratio
            and most_common_gesture != self.unknown_label
        )

        if is_confirmed:
            return most_common_gesture, round(avg_conf, 4), True
        else:
            return (
                most_common_gesture if buffer_sufficient else self.unknown_label,
                round(avg_conf, 4),
                False,
            )

    def reset(self) -> None:
        """Clears the temporal history buffer.

        Should be invoked when:
        - Hand leaves the camera frame.
        - User completes or cancels a gesture interaction.
        """
        self.gesture_buffer.clear()
        self.confidence_buffer.clear()
