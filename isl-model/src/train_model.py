"""Model Training Pipeline for ISL Landmark Classifier.

Trains a RandomForestClassifier using stratified train/test split, generates
comprehensive classification metrics and confusion matrix, checks for low-performing
classes, and serializes the model and metadata.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)
from sklearn.model_selection import train_test_split

from src.feature_extractor import FEATURE_DIM
from src.preprocess import validate_and_load_dataset


def train_isl_classifier(
    dataset_path: Path,
    model_output_path: Path,
    metadata_output_path: Path,
    n_estimators: int = 200,
    max_depth: Optional[int] = None,
    test_size: float = 0.2,
    random_state: int = 42,
    underperforming_threshold: float = 0.80,
) -> Dict[str, Any]:
    """Trains, evaluates, and saves the ISL gesture classifier.

    Args:
        dataset_path: Path to validated CSV dataset.
        model_output_path: Target path for the serialized .pkl model.
        metadata_output_path: Target path for the metadata JSON file.
        n_estimators: Number of trees in the forest.
        max_depth: Maximum tree depth (None for unlimited).
        test_size: Proportion of dataset to hold out for evaluation.
        random_state: Seed for reproducibility.
        underperforming_threshold: Score below which class triggers warning.

    Returns:
        Dict containing training summary metrics and status.
    """
    # 1. Load and Validate Dataset
    _, X, y, class_counts = validate_and_load_dataset(dataset_path)

    # 2. Stratified Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        stratify=y,
        random_state=random_state,
    )

    print(f"\nTraining set size : {len(X_train)} samples")
    print(f"Testing set size  : {len(X_test)} samples")
    print(f"Hyperparameters   : n_estimators={n_estimators}, max_depth={max_depth}\n")

    # 3. Model Initialization and Training
    clf = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        random_state=random_state,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    # 4. Evaluation on Test Set
    y_pred = clf.predict(X_test)
    overall_accuracy = float(accuracy_score(y_test, y_pred))
    classes = sorted(list(np.unique(y)))

    # Classification Report
    report_dict = classification_report(
        y_test, y_pred, labels=classes, output_dict=True, zero_division=0
    )
    report_text = classification_report(
        y_test, y_pred, labels=classes, zero_division=0
    )

    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred, labels=classes).tolist()

    print("=" * 60)
    print(f"CLASSIFICATION REPORT (Overall Accuracy: {overall_accuracy * 100:.2f}%)")
    print("=" * 60)
    print(report_text)

    # 5. Check for Underperforming Classes
    underperforming = []
    for cls_name in classes:
        cls_metrics = report_dict.get(cls_name, {})
        recall = cls_metrics.get("recall", 0.0)
        precision = cls_metrics.get("precision", 0.0)
        f1 = cls_metrics.get("f1-score", 0.0)

        if recall < underperforming_threshold or precision < underperforming_threshold:
            underperforming.append({
                "class": cls_name,
                "precision": round(precision, 3),
                "recall": round(recall, 3),
                "f1": round(f1, 3),
            })

    if underperforming:
        print("\n" + "!" * 60)
        print("ATTENTION: POORLY PERFORMING CLASSES IDENTIFIED")
        print("!" * 60)
        for item in underperforming:
            print(
                f"  - '{item['class']}': Precision={item['precision']}, "
                f"Recall={item['recall']}, F1={item['f1']}"
            )
        print("Action: These gestures frequently confuse with adjacent poses.")
        print("Recommendation: Collect additional diverse samples and verify distinctive hand shape.\n")
    else:
        print("\n[OK] All classes performed above the reliability threshold.\n")

    # 6. Save Model and Metadata
    model_output_path = Path(model_output_path)
    metadata_output_path = Path(metadata_output_path)
    model_output_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_output_path.parent.mkdir(parents=True, exist_ok=True)

    joblib.dump(clf, model_output_path)
    print(f"[SUCCESS] Trained model saved to: {model_output_path}")

    metadata = {
        "model_version": "1.0.0",
        "training_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "classifier_type": "RandomForestClassifier",
        "feature_count": FEATURE_DIM,
        "n_estimators": n_estimators,
        "classes": classes,
        "class_counts": class_counts,
        "total_samples": len(X),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "test_accuracy": round(overall_accuracy, 4),
        "confusion_matrix": cm,
        "underperforming_classes": underperforming,
    }

    with open(metadata_output_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[SUCCESS] Model metadata saved to: {metadata_output_path}")

    return {
        "accuracy": overall_accuracy,
        "classes": classes,
        "metadata": metadata,
        "underperforming": underperforming,
    }
