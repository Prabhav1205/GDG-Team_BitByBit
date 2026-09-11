"""Model Training CLI Entry Point.

Executes the end-to-end dataset validation, stratified splitting, RandomForest
training, comprehensive evaluation, and model artifact generation.
"""

import argparse
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.preprocess import DatasetValidationError
from src.train_model import train_isl_classifier

DEFAULT_DATASET = PROJECT_ROOT / "dataset" / "isl_landmarks.csv"
DEFAULT_MODEL_OUT = PROJECT_ROOT / "models" / "isl_model.pkl"
DEFAULT_META_OUT = PROJECT_ROOT / "models" / "model_metadata.json"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Train the ISL Gesture Recognition RandomForest Classifier."
    )
    parser.add_argument(
        "--dataset",
        type=Path,
        default=DEFAULT_DATASET,
        help="Path to landmark CSV dataset (default: dataset/isl_landmarks.csv)",
    )
    parser.add_argument(
        "--model-out",
        type=Path,
        default=DEFAULT_MODEL_OUT,
        help="Output path for trained model .pkl (default: models/isl_model.pkl)",
    )
    parser.add_argument(
        "--meta-out",
        type=Path,
        default=DEFAULT_META_OUT,
        help="Output path for model metadata JSON (default: models/model_metadata.json)",
    )
    parser.add_argument(
        "--n-estimators",
        type=int,
        default=200,
        help="Number of trees in RandomForest (default: 200)",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Proportion of dataset for validation split (default: 0.2)",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random seed for reproducibility (default: 42)",
    )

    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("         ISL CLASSIFIER - TRAINING PIPELINE")
    print("=" * 60)
    print(f"Dataset path   : {args.dataset}")
    print(f"Model output   : {args.model_out}")
    print(f"Metadata output: {args.meta_out}")
    print(f"Trees (n_est)  : {args.n_estimators}")
    print("=" * 60)

    try:
        results = train_isl_classifier(
            dataset_path=args.dataset,
            model_output_path=args.model_out,
            metadata_output_path=args.meta_out,
            n_estimators=args.n_estimators,
            test_size=args.test_size,
            random_state=args.random_state,
        )
        acc = results["accuracy"] * 100.0
        print(f"\n[COMPLETE] Model training successfully finished with {acc:.2f}% validation accuracy.")
        print(f"Model saved to: {args.model_out}")
        print("Ready for real-time testing: python scripts/predict.py")

    except DatasetValidationError as e:
        print(f"\n[DATASET ERROR] Validation failed: {e}")
        print("Please check dataset/isl_landmarks.csv or collect additional samples via:")
        print("  python scripts/collect_dataset.py\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n[TRAINING FAILED] Unexpected error during training: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
