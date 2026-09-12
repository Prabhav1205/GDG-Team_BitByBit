"""Extract representative sample landmark feature vectors from dataset for frontend test buttons."""

import json
from pathlib import Path
import pandas as pd
import joblib

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = PROJECT_ROOT / "dataset" / "isl_landmarks.csv"
MODEL_PATH = PROJECT_ROOT / "models" / "isl_model.pkl"
OUTPUT_JSON = PROJECT_ROOT / "config" / "sample_gesture_vectors.json"

def main():
    df = pd.read_csv(DATASET_PATH)
    model = joblib.load(MODEL_PATH)
    
    samples = {}
    classes = sorted(df['label'].unique())
    feature_cols = [c for c in df.columns if c != 'label']
    
    for cls in classes:
        cls_df = df[df['label'] == cls]
        X_cls = cls_df[feature_cols].to_numpy()
        probs = model.predict_proba(X_cls)
        cls_idx = list(model.classes_).index(cls)
        cls_conf = probs[:, cls_idx]
        best_idx = int(cls_conf.argmax())
        
        best_features = X_cls[best_idx].tolist()
        best_c = float(cls_conf[best_idx])
        
        # Convert 63 normalized coordinates to 21 landmark points
        # where wrist is at (0.5, 0.6) and hand extends upward
        landmarks = []
        for i in range(21):
            dx = best_features[i * 3]
            dy = best_features[i * 3 + 1]
            dz = best_features[i * 3 + 2]
            landmarks.append({
                "x": round(0.5 + dx * 0.3, 4),
                "y": round(0.6 + dy * 0.3, 4),
                "z": round(dz * 0.3, 4)
            })
            
        samples[cls] = {
            "confidence": round(best_c, 4),
            "features": [round(x, 5) for x in best_features],
            "landmarks": landmarks
        }
        print(f"Gesture: {cls:<12} Confidence: {best_c:.4f}")
        
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(samples, f, indent=2)
    print(f"\nWrote sample vectors to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
