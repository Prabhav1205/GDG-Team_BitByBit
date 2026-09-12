"""Standardized Geometric Feature Extractor for ISL Hand Landmarks.

Converts raw 3D MediaPipe hand landmarks into a translation-invariant,
scale-invariant 63-dimensional numerical vector.

CRITICAL INVARIANT:
The exact same feature extraction logic defined in this module MUST be used
for dataset collection, training preprocessing, real-time prediction, and API inference.
"""

from typing import Any, Dict, List, Sequence, Union
import numpy as np

LANDMARK_COUNT = 21
FEATURE_DIM = LANDMARK_COUNT * 3  # 63


def get_feature_column_names() -> List[str]:
    """Generates the standardized column names for the 63 landmark features.

    Returns:
        List of strings: ['x0', 'y0', 'z0', 'x1', 'y1', 'z1', ..., 'x20', 'y20', 'z20']
    """
    cols: List[str] = []
    for i in range(LANDMARK_COUNT):
        cols.extend([f"x{i}", f"y{i}", f"z{i}"])
    return cols


def extract_features(
    landmarks: Union[Sequence[Dict[str, float]], Sequence[Any], np.ndarray]
) -> np.ndarray:
    """Converts 21 hand landmarks into a normalized 63-dimensional feature vector.

    Normalization Pipeline:
    1. Input Parsing: Extracts (x, y, z) into a (21, 3) float32 numpy array.
    2. Translation Invariance: Uses Wrist (landmark 0) as origin.
       Subtracts wrist coordinates: (x_i - x_0, y_i - y_0, z_i - z_0).
    3. Scale Invariance: Calculates max Euclidean distance from wrist to any landmark:
       scale = max(sqrt(dx_i^2 + dy_i^2 + dz_i^2)).
       Divides all translated coordinates by this scale (with epsilon guard).
    4. Flattening: Reshapes to 1D vector of shape (63,).

    Args:
        landmarks: Exactly 21 landmarks. Can be:
            - List of dicts with 'x', 'y', 'z' keys
            - List of objects with .x, .y, .z attributes (MediaPipe Landmark objects)
            - NumPy array of shape (21, 3)

    Returns:
        np.ndarray: Normalized 1D float32 array of shape (63,).

    Raises:
        ValueError: If input does not contain exactly 21 landmarks or values are invalid.
    """
    if landmarks is None:
        raise ValueError("Landmarks input cannot be None.")

    # Convert varied input representations into (21, 3) ndarray
    if isinstance(landmarks, np.ndarray):
        if landmarks.shape == (LANDMARK_COUNT, 3):
            coords = landmarks.astype(np.float32)
        elif landmarks.shape == (FEATURE_DIM,):
            coords = landmarks.reshape(LANDMARK_COUNT, 3).astype(np.float32)
        else:
            raise ValueError(
                f"Expected numpy array of shape (21, 3) or (63,), got {landmarks.shape}"
            )
    else:
        if len(landmarks) != LANDMARK_COUNT:
            raise ValueError(
                f"Expected exactly {LANDMARK_COUNT} landmarks, received {len(landmarks)}"
            )

        parsed_coords = []
        for idx, pt in enumerate(landmarks):
            if isinstance(pt, dict):
                if not all(k in pt for k in ("x", "y", "z")):
                    raise ValueError(f"Landmark at index {idx} missing required coordinates: {pt}")
                parsed_coords.append([float(pt["x"]), float(pt["y"]), float(pt["z"])])
            elif hasattr(pt, "x") and hasattr(pt, "y") and hasattr(pt, "z"):
                parsed_coords.append([float(pt.x), float(pt.y), float(pt.z)])
            elif isinstance(pt, (list, tuple)) and len(pt) == 3:
                parsed_coords.append([float(pt[0]), float(pt[1]), float(pt[2])])
            else:
                raise ValueError(
                    f"Unsupported landmark item format at index {idx}: {type(pt)}"
                )

        coords = np.array(parsed_coords, dtype=np.float32)

    # Check for NaN / Inf
    if not np.all(np.isfinite(coords)):
        raise ValueError("Landmark coordinates contain NaN or infinite values.")

    # Step 2: Translation relative to wrist (landmark index 0)
    wrist = coords[0].copy()
    translated = coords - wrist

    # Step 3: Scale normalization based on maximum distance from wrist
    # Exclude wrist (index 0 which has dist 0)
    distances = np.linalg.norm(translated, axis=1)
    max_distance = float(np.max(distances))

    # Guard against division by zero (e.g. if all points collapsed onto wrist)
    epsilon = 1e-6
    if max_distance < epsilon:
        scale = 1.0
    else:
        scale = max_distance

    normalized = translated / scale

    # Step 4: Flatten into 63-dimensional vector
    flattened = normalized.flatten().astype(np.float32)
    return flattened
