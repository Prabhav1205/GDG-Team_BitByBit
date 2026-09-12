"""Tests for dataset loading and validation logic."""

from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from src.feature_extractor import get_feature_column_names
from src.preprocess import DatasetValidationError, validate_and_load_dataset


def test_missing_file_raises_error(tmp_path):
    non_existent = tmp_path / "non_existent.csv"
    with pytest.raises(DatasetValidationError, match="does not exist"):
        validate_and_load_dataset(non_existent)


def test_empty_file_raises_error(tmp_path):
    empty_file = tmp_path / "empty.csv"
    empty_file.touch()
    with pytest.raises(DatasetValidationError, match="completely empty"):
        validate_and_load_dataset(empty_file)


def test_missing_label_column(tmp_path):
    csv_file = tmp_path / "bad.csv"
    cols = get_feature_column_names()
    df = pd.DataFrame(np.random.rand(10, 63), columns=cols)
    df.to_csv(csv_file, index=False)

    with pytest.raises(DatasetValidationError, match="Required 'label' column is missing"):
        validate_and_load_dataset(csv_file)


def test_nan_values_in_features(tmp_path):
    csv_file = tmp_path / "nan_data.csv"
    cols = ["label"] + get_feature_column_names()
    data = np.random.rand(20, 63)
    data[2, 5] = np.nan
    df = pd.DataFrame(data, columns=get_feature_column_names())
    df.insert(0, "label", ["HELP"] * 10 + ["YES"] * 10)
    df.to_csv(csv_file, index=False)

    with pytest.raises(DatasetValidationError, match="NaN/null values"):
        validate_and_load_dataset(csv_file)


def test_insufficient_samples_per_class(tmp_path):
    csv_file = tmp_path / "low_samples.csv"
    cols = ["label"] + get_feature_column_names()
    df = pd.DataFrame(np.random.rand(15, 63), columns=get_feature_column_names())
    df.insert(0, "label", ["HELP"] * 12 + ["YES"] * 3)  # Only 3 samples for YES
    df.to_csv(csv_file, index=False)

    with pytest.raises(DatasetValidationError, match="below the minimum required"):
        validate_and_load_dataset(csv_file, min_samples_per_class=10)


def test_valid_dataset_loading(tmp_path):
    csv_file = tmp_path / "valid.csv"
    cols = ["label"] + get_feature_column_names()
    data = np.random.rand(40, 63)
    df = pd.DataFrame(data, columns=get_feature_column_names())
    df.insert(0, "label", ["HELP"] * 20 + ["YES"] * 20)
    df.to_csv(csv_file, index=False)

    raw_df, X, y, class_counts = validate_and_load_dataset(csv_file, min_samples_per_class=10)
    assert len(raw_df) == 40
    assert X.shape == (40, 63)
    assert len(y) == 40
    assert class_counts["HELP"] == 20
    assert class_counts["YES"] == 20
