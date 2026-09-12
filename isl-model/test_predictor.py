import sys, json
sys.path.insert(0, '.')

from src.predictor import GesturePredictor
from src.feature_extractor import extract_features
import numpy as np

print('=== ISL PREDICTOR END-TO-END TEST ===')
predictor = GesturePredictor(
    model_path='models/isl_model.pkl',
    gestures_config_path='config/gestures.json',
    metadata_path='models/model_metadata.json',
)

print('Model loaded:', predictor.is_loaded)
print('Classes:', predictor.get_supported_gestures())
print('Confidence threshold:', predictor.confidence_threshold)
print('Top margin:', predictor.top_margin)
print()

# Load known sample gesture vectors
with open('config/sample_gesture_vectors.json') as f:
    samples = json.load(f)

passed = 0
failed = 0

for gesture_id in samples.keys():
    sample = samples[gesture_id]
    if 'features' in sample:
        features = sample['features']
    elif 'landmarks' in sample:
        features = extract_features(sample['landmarks']).tolist()
    else:
        continue

    result = predictor.predict(features)
    got = result['gesture']
    conf = result['confidence']
    margin = result['margin']
    accepted = result['accepted']
    ok = got == gesture_id
    status = 'PASS' if ok else 'FAIL'
    if ok:
        passed += 1
    else:
        failed += 1
    print(f'{status} | Expected: {gesture_id:15} | Got: {got:15} | Conf: {conf:.3f} | Margin: {margin:.3f} | Accepted: {accepted}')

print()
print(f'Sample test results: {passed} PASS / {failed} FAIL out of {passed+failed}')

# Test random noise rejection
np.random.seed(42)
noise = np.random.uniform(-0.5, 0.5, 63).astype(np.float32).tolist()
r = predictor.predict(noise)
reject_ok = not r['accepted'] or r['gesture'] == 'UNKNOWN'
label = 'PASS' if reject_ok else 'FAIL'
print(f'Random noise rejection: {label} (got: {r["gesture"]} conf: {r["confidence"]:.3f})')
