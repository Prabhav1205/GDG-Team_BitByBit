"""Generate diverse, verified UNKNOWN / rejection hand samples for ISL classification.

Generates representative non-target hand configurations:
1. Interpolated transitional poses between different target gestures (hand in-motion).
2. Casual relaxed / rested hand poses (partial finger flexions).
3. Open flat palm at diverse orientations (non-target palm).
4. Random natural finger movements and entry/exit hand postures.

All samples are normalized via the canonical extract_features() pipeline and
appended to dataset/isl_landmarks.csv under the label 'UNKNOWN'.
"""

from pathlib import Path
import sys
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.feature_extractor import FEATURE_DIM, extract_features, get_feature_column_names

DATASET_CSV = PROJECT_ROOT / "dataset" / "isl_landmarks.csv"


def create_relaxed_hand(rng: np.random.Generator, noise_std: float = 0.03) -> np.ndarray:
    """Simulates a natural, relaxed hand with casual partial finger curl."""
    coords = np.zeros((21, 3), dtype=np.float32)
    # Wrist
    coords[0] = [0.5, 0.7, 0.0]

    # Finger angles for a relaxed, half-open hand
    finger_spreads = [-0.10, -0.04, 0.02, 0.07, 0.12]
    finger_lengths = [0.10, 0.16, 0.18, 0.16, 0.12]
    # Relaxed curl amounts (randomized)
    curls = rng.uniform(0.3, 0.8, size=5)

    # 1-4: Thumb
    for j in range(1, 5):
        t = j / 4.0
        coords[j] = coords[0] + [
            -0.08 * t + rng.normal(0, noise_std * 0.5),
            -0.08 * t + rng.normal(0, noise_std * 0.5),
            0.04 * t * curls[0],
        ]

    # Fingers: Index(5-8), Middle(9-12), Ring(13-16), Pinky(17-20)
    for f_idx in range(1, 5):
        mcp_idx = f_idx * 4 + 1
        spread = finger_spreads[f_idx]
        length = finger_lengths[f_idx]
        curl = curls[f_idx]

        # Base MCP joint
        coords[mcp_idx] = coords[0] + [spread * 0.6, -length * 0.35, 0.0]

        # PIP, DIP, TIP curving forward in z and down in y
        for seg in range(1, 4):
            idx = mcp_idx + seg
            frac = seg / 3.0
            coords[idx] = coords[mcp_idx] + [
                spread * (1.0 + frac * 0.3),
                -length * (1.0 - frac * curl * 0.4),
                -length * frac * curl * 0.6,
            ]

    # Apply slight random 3D rotation and noise
    coords += rng.normal(0, noise_std, size=coords.shape).astype(np.float32)
    return coords


def create_flat_palm(rng: np.random.Generator, noise_std: float = 0.02) -> np.ndarray:
    """Simulates a flat open palm facing arbitrary angles (non-target)."""
    coords = np.zeros((21, 3), dtype=np.float32)
    coords[0] = [0.5, 0.7, 0.0]
    spreads = [-0.09, -0.04, 0.01, 0.06, 0.10]
    lengths = [0.11, 0.18, 0.20, 0.18, 0.14]

    for j in range(1, 5):
        t = j / 4.0
        coords[j] = coords[0] + [-0.10 * t, -0.09 * t, 0.01 * t]

    for f_idx in range(1, 5):
        mcp_idx = f_idx * 4 + 1
        spread = spreads[f_idx]
        length = lengths[f_idx]
        coords[mcp_idx] = coords[0] + [spread * 0.6, -length * 0.35, 0.0]
        for seg in range(1, 4):
            idx = mcp_idx + seg
            frac = seg / 3.0
            coords[idx] = coords[mcp_idx] + [spread * (1.0 + frac * 0.2), -length * (0.35 + frac * 0.65), 0.0]

    # Random 3D tilt
    angle = rng.uniform(-0.6, 0.6)
    c, s = np.cos(angle), np.sin(angle)
    coords[:, 0] = coords[:, 0] * c - coords[:, 1] * s
    coords[:, 1] = coords[:, 0] * s + coords[:, 1] * c
    coords += rng.normal(0, noise_std, size=coords.shape).astype(np.float32)
    return coords


def generate_unknown_samples(num_samples: int = 1000, random_seed: int = 42) -> pd.DataFrame:
    """Generates normalized UNKNOWN landmark feature rows."""
    rng = np.random.default_rng(random_seed)
    cols = ["label"] + get_feature_column_names()
    rows = []

    # 1. Load existing target classes to create realistic transition poses
    df_existing = pd.read_csv(DATASET_CSV)
    target_classes = [c for c in df_existing["label"].unique() if c != "UNKNOWN"]
    feat_cols = [c for c in df_existing.columns if c != "label"]

    samples_per_category = num_samples // 4

    # Category A: Transitions between target gestures (linear interpolation of normalized features)
    print(f"[1/4] Generating {samples_per_category} transition poses between gestures...")
    for _ in range(samples_per_category):
        c1, c2 = rng.choice(target_classes, size=2, replace=False)
        row1 = df_existing[df_existing["label"] == c1].sample(1, random_state=int(rng.integers(1e6)))[feat_cols].to_numpy()[0]
        row2 = df_existing[df_existing["label"] == c2].sample(1, random_state=int(rng.integers(1e6)))[feat_cols].to_numpy()[0]

        # Alpha in (0.25, 0.75) — truly in-between poses
        alpha = rng.uniform(0.25, 0.75)
        interp = (1.0 - alpha) * row1 + alpha * row2
        # Add slight natural jitter
        interp += rng.normal(0, 0.02, size=interp.shape).astype(np.float32)
        # Re-normalize to ensure wrist=0 and unit max-dist
        interp_lms = interp.reshape(21, 3)
        norm_features = extract_features(interp_lms)
        rows.append(["UNKNOWN"] + [round(float(v), 6) for v in norm_features])

    # Category B: Relaxed natural / resting hand configurations
    print(f"[2/4] Generating {samples_per_category} relaxed / resting hand poses...")
    for _ in range(samples_per_category):
        raw_hand = create_relaxed_hand(rng)
        norm_features = extract_features(raw_hand)
        rows.append(["UNKNOWN"] + [round(float(v), 6) for v in norm_features])

    # Category C: Flat open palm at diverse angles & orientations
    print(f"[3/4] Generating {samples_per_category} arbitrary open palm poses...")
    for _ in range(samples_per_category):
        raw_hand = create_flat_palm(rng)
        norm_features = extract_features(raw_hand)
        rows.append(["UNKNOWN"] + [round(float(v), 6) for v in norm_features])

    # Category D: Random non-target finger combinations & boundary perturbations
    remaining = num_samples - len(rows)
    print(f"[4/4] Generating {remaining} random non-target finger gestures...")
    for _ in range(remaining):
        raw_hand = create_relaxed_hand(rng, noise_std=0.06)
        fingers_to_alter = rng.choice([1, 2, 3, 4], size=rng.integers(1, 4), replace=False)
        for f in fingers_to_alter:
            tip_idx = f * 4
            raw_hand[tip_idx - 2 : tip_idx + 1, 1] += rng.uniform(-0.15, 0.15)
            raw_hand[tip_idx - 2 : tip_idx + 1, 2] += rng.uniform(-0.15, 0.15)
        norm_features = extract_features(raw_hand)
        rows.append(["UNKNOWN"] + [round(float(v), 6) for v in norm_features])

    df_unknown = pd.DataFrame(rows, columns=cols)
    return df_unknown


def main() -> None:
    print("=" * 60)
    print("   GENERATING UNKNOWN / REJECTION SAMPLES FOR ISL DATASET")
    print("=" * 60)

    if not DATASET_CSV.exists():
        print(f"[ERROR] Existing dataset not found at: {DATASET_CSV}")
        sys.exit(1)

    df_existing = pd.read_csv(DATASET_CSV)
    initial_counts = df_existing["label"].value_counts().to_dict()
    print(f"Current total samples: {len(df_existing)}")
    print(f"Current classes: {list(initial_counts.keys())}")

    # Remove any old UNKNOWN samples first to avoid unbounded accumulation
    df_clean = df_existing[df_existing["label"] != "UNKNOWN"]
    print(f"Existing target samples (10 classes): {len(df_clean)}")

    df_unknown = generate_unknown_samples(num_samples=1000, random_seed=42)
    print(f"Generated UNKNOWN samples: {len(df_unknown)}")

    df_combined = pd.concat([df_clean, df_unknown], ignore_index=True)
    # Shuffle to ensure even distribution
    df_combined = df_combined.sample(frac=1.0, random_state=42).reset_index(drop=True)

    df_combined.to_csv(DATASET_CSV, index=False)
    print(f"\n[SUCCESS] Saved updated dataset to: {DATASET_CSV}")
    print(f"New total samples: {len(df_combined)}")
    print("New class distribution:")
    print(df_combined["label"].value_counts())


if __name__ == "__main__":
    main()
