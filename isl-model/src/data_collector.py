"""Data Collector Engine for Verified ISL Gestures.

Handles frame sampling interval control, feature extraction via the canonical
pipeline, and safe CSV persistence for dataset creation.
"""

import csv
from pathlib import Path
import time
from typing import Any, Dict, List, Optional, Sequence, Union
import numpy as np
import pandas as pd

from src.feature_extractor import (
    FEATURE_DIM,
    extract_features,
    get_feature_column_names,
)


class DataCollector:
    """Manages recording of verified hand landmark samples to CSV."""

    def __init__(
        self,
        output_csv_path: Path,
        sampling_interval_sec: float = 0.12,  # ~8 frames/sec to ensure variance
    ) -> None:
        """Initializes collector with storage destination and capture pacing.

        Args:
            output_csv_path: Path to dataset CSV file.
            sampling_interval_sec: Minimum seconds between recorded frames to avoid duplicate captures.
        """
        self.output_csv_path = Path(output_csv_path)
        self.sampling_interval_sec = sampling_interval_sec
        self.last_capture_time = 0.0

        self.output_csv_path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_header()

    def _ensure_header(self) -> None:
        """Creates or prepends standardized header if missing from the CSV."""
        cols = ["label"] + get_feature_column_names()
        if not self.output_csv_path.exists() or self.output_csv_path.stat().st_size == 0:
            with open(self.output_csv_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(cols)
            return

        # Check if first line starts with 'label'
        with open(self.output_csv_path, "r", encoding="utf-8") as f:
            first_line = f.readline().strip()

        if not first_line.startswith("label"):
            with open(self.output_csv_path, "r", encoding="utf-8") as f:
                existing = f.read()
            header_str = ",".join(cols) + "\n"
            with open(self.output_csv_path, "w", encoding="utf-8") as f:
                f.write(header_str + existing)

    def get_sample_counts(self) -> Dict[str, int]:
        """Returns the current count of collected samples per label from the CSV."""
        if not self.output_csv_path.exists() or self.output_csv_path.stat().st_size == 0:
            return {}

        try:
            df = pd.read_csv(self.output_csv_path)
            if "label" in df.columns:
                counts = df["label"].value_counts().to_dict()
                return {str(k): int(v) for k, v in counts.items()}
            return {}
        except Exception:
            return {}

    def can_capture(self) -> bool:
        """Checks if sufficient time has elapsed since the last recorded sample."""
        now = time.time()
        return (now - self.last_capture_time) >= self.sampling_interval_sec

    def record_sample(
        self,
        label: str,
        landmarks: Union[Sequence[Dict[str, float]], Sequence[Any], np.ndarray],
    ) -> bool:
        """Extracts features and appends a single verified landmark sample.

        Args:
            label: Gesture class name (e.g., 'HELP', 'YES', 'UNKNOWN').
            landmarks: Raw 21 MediaPipe landmark coordinates.

        Returns:
            bool: True if sample was recorded, False if throttled by sampling interval.
        """
        if not self.can_capture():
            return False

        # Extract features using the canonical extractor
        features = extract_features(landmarks)

        if len(features) != FEATURE_DIM:
            raise ValueError(f"Extracted features dimension mismatch: {len(features)} != {FEATURE_DIM}")

        # Append row to CSV
        row = [label] + [round(float(v), 6) for v in features]
        with open(self.output_csv_path, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(row)

        self.last_capture_time = time.time()
        return True
