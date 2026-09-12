"""Export the trained sklearn gesture forest to ONNX and validate parity."""
import json
import sys
from pathlib import Path

import joblib
import numpy as np
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import onnxruntime as ort

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


def main() -> None:
    model_path = ROOT / "models" / "isl_model.pkl"
    output_path = ROOT / "models" / "isl_model.onnx"
    metadata_path = ROOT / "models" / "model_metadata.json"
    model = joblib.load(model_path)
    model.n_jobs = 1
    onnx_model = convert_sklearn(model, initial_types=[("features", FloatTensorType([None, 63]))], target_opset=15)
    output_path.write_bytes(onnx_model.SerializeToString())
    session = ort.InferenceSession(str(output_path), providers=["CPUExecutionProvider"])
    samples = np.random.default_rng(42).normal(size=(10, 63)).astype(np.float32)
    sklearn_labels = model.predict(samples)
    onnx_labels = session.run(None, {session.get_inputs()[0].name: samples})[0]
    if not np.array_equal(sklearn_labels.astype(str), np.asarray(onnx_labels).astype(str)):
        raise RuntimeError("ONNX predictions did not match sklearn predictions")
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    metadata.update({"onnx_model_path": str(output_path.name), "onnx_opset_version": 15})
    metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"[ONNX] Converted RandomForestClassifier -> {output_path}")
    print("[ONNX] Validation: 10/10 predictions match original model")


if __name__ == "__main__":
    main()
