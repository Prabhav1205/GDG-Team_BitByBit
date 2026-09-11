"""Dataset Loading, Preprocessing, and Validation Utilities.

Ensures training dataset integrity: checks column count, missing values,
empty classes, severe class imbalance, and provides detailed summary reports.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

from src.feature_extractor import FEATURE_DIM, get_feature_column_names


class DatasetValidationError(ValueError):
    """Raised when dataset fails critical schema or integrity checks."""
    pass


def validate_and_load_dataset(
    csv_path: Path,
    expected_dim: int = FEATURE_DIM,
    imbalance_warning_ratio: float = 0.4,
    min_samples_per_class: int = 10,
) -> Tuple[pd.DataFrame, np.ndarray, np.ndarray, Dict[str, int]]:
    """Loads and strictly validates the ISL landmark dataset.

    Args:
        csv_path: Path to dataset CSV file.
        expected_dim: Expected feature count (default 63).
        imbalance_warning_ratio: Ratio below which class imbalance triggers warning.
        min_samples_per_class: Minimum samples required per class to allow training.

    Returns:
        Tuple of:
        - raw DataFrame
        - X (np.ndarray): Feature matrix of shape (N, expected_dim)
        - y (np.ndarray): Target labels array of shape (N,)
        - class_counts (Dict[str, int]): Count of samples per class

    Raises:
        DatasetValidationError: On missing file, empty dataset, invalid columns, or NaN values.
    """
    path = Path(csv_path)
    if not path.exists():
        raise DatasetValidationError(f"Dataset file does not exist at: {path}")

    if path.stat().st_size == 0:
        raise DatasetValidationError(f"Dataset file is completely empty: {path}")

    try:
        df = pd.read_csv(path)
    except Exception as e:
        raise DatasetValidationError(f"Failed to parse CSV at {path}: {e}")

    if df.empty:
        raise DatasetValidationError("Dataset contains header but 0 data rows.")

    # 1. Validate Column Structure
    if "label" not in df.columns:
        raise DatasetValidationError("Required 'label' column is missing from dataset.")

    expected_feature_cols = get_feature_column_names()
    actual_feature_cols = [c for c in df.columns if c != "label"]

    if len(actual_feature_cols) != expected_dim:
        raise DatasetValidationError(
            f"Expected {expected_dim} feature columns, but found {len(actual_feature_cols)}."
        )

    # 2. Check Missing / Null Values
    missing_count = int(df.isnull().sum().sum())
    if missing_count > 0:
        nan_cols = df.columns[df.isnull().any()].tolist()
        raise DatasetValidationError(
            f"Dataset contains {missing_count} NaN/null values in columns: {nan_cols[:5]}..."
        )

    # 3. Check for Non-Numeric Feature Data
    try:
        X = df[actual_feature_cols].to_numpy(dtype=np.float32)
    except (ValueError, TypeError) as e:
        raise DatasetValidationError(f"Feature columns contain non-numeric data: {e}")

    # Check finite numbers (no inf)
    if not np.all(np.isfinite(X)):
        raise DatasetValidationError("Feature matrix contains Infinite (inf) values.")

    y = df["label"].astype(str).str.strip().to_numpy()

    # 4. Check Empty or Blank Labels
    blank_labels = (y == "") | (y == "nan")
    if np.any(blank_labels):
        raise DatasetValidationError(
            f"Dataset contains {int(np.sum(blank_labels))} rows with blank/empty labels."
        )

    # 5. Check Class Frequencies & Imbalance
    unique_classes, counts = np.unique(y, return_counts=True)
    class_counts: Dict[str, int] = dict(zip(unique_classes, counts.tolist()))

    if len(unique_classes) < 2:
        raise DatasetValidationError(
            f"Dataset must contain at least 2 distinct classes to train. Found: {len(unique_classes)}"
        )

    for cls_name, count in class_counts.items():
        if count < min_samples_per_class:
            raise DatasetValidationError(
                f"Class '{cls_name}' has only {count} samples, which is below the "
                f"minimum required ({min_samples_per_class}). Please collect more samples."
            )

    # Print Formatted Dataset Summary
    print("\n" + "=" * 50)
    print("           DATASET VALIDATION SUMMARY")
    print("=" * 50)
    print(f"Total Samples    : {len(df)}")
    print(f"Number of Classes: {len(class_counts)}")
    print(f"Feature Count    : {expected_dim}")
    print("-" * 50)
    print(f"{'Class':<20} | {'Samples':<10} | {'Percentage':<10}")
    print("-" * 50)

    max_samples = max(class_counts.values())
    imbalanced_classes = []

    for cls_name, count in sorted(class_counts.items(), key=lambda x: x[0]):
        pct = (count / len(df)) * 100
        print(f"{cls_name:<20} | {count:<10} | {pct:>8.1f}%")
        if count < (max_samples * imbalance_warning_ratio):
            imbalanced_classes.append((cls_name, count))

    print("-" * 50)

    # Check Duplicates
    dup_count = int(df.duplicated().sum())
    if dup_count > 0:
        print(f"[Warning] Found {dup_count} exact duplicate rows. Consider cleaning identical frames.")

    if imbalanced_classes:
        print("\n[WARNING] Class Imbalance Detected:")
        for cls_name, count in imbalanced_classes:
            print(
                f"  - '{cls_name}' has only {count} samples (less than {imbalance_warning_ratio*100:.0f}% "
                f"of dominant class with {max_samples} samples)."
            )
        print("  Recommendation: Collect more verified samples for underrepresented classes.\n")
    else:
        print("\n[OK] Class balance is within acceptable parameters.\n")

    return df, X, y, class_counts
