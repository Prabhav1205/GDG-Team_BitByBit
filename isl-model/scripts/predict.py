"""Real-Time Webcam Prediction Tool with Temporal Smoothing.

Performs live inference on webcam feed:
- MediaPipe hand landmark detection.
- Canonical feature normalization.
- RandomForest probability scoring.
- Temporal smoothing / majority voting filter.
- Dynamic visual kiosk HUD showing prediction, confidence, and confirmed phrase.
- Press 'q' or ESC to exit cleanly.
"""

from pathlib import Path
import sys
import time
import cv2

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.hand_tracker import HandTracker, MEDIAPIPE_AVAILABLE
from src.predictor import GesturePredictor, ModelNotLoadedError
from src.smoothing import TemporalSmoother

MODEL_PATH = PROJECT_ROOT / "models" / "isl_model.pkl"
CONFIG_PATH = PROJECT_ROOT / "config" / "gestures.json"


def main() -> None:
    print("\n" + "=" * 60)
    print("      ISL KIOSK - REAL-TIME GESTURE RECOGNITION")
    print("=" * 60)

    if not MEDIAPIPE_AVAILABLE:
        print("[ERROR] MediaPipe is not installed. Run: pip install -r requirements.txt")
        sys.exit(1)

    if not MODEL_PATH.exists():
        print(f"[ERROR] Trained model not found at: {MODEL_PATH}")
        print("Please train a model first using:")
        print("  python scripts/train.py")
        sys.exit(1)

    # Initialize components
    predictor = GesturePredictor(
        model_path=MODEL_PATH,
        gestures_config_path=CONFIG_PATH,
        confidence_threshold=0.75,
    )
    smoother = TemporalSmoother(window_size=7, majority_ratio=0.65)
    tracker = HandTracker(max_num_hands=1)

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Failed to open default webcam (index 0).")
        sys.exit(1)

    window_name = "ISL Kiosk - Live Recognition (Press Q to quit)"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

    prev_time = time.time()
    fps = 0.0

    try:
        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                time.sleep(0.05)
                continue

            curr_time = time.time()
            dt = curr_time - prev_time
            if dt > 0:
                fps = 0.9 * fps + 0.1 * (1.0 / dt)
            prev_time = curr_time

            # 1. Mirror frame
            frame = cv2.flip(frame, 1)
            h, w, _ = frame.shape

            # 2. Hand tracking
            detected, landmarks, raw_results = tracker.process_frame(frame)

            display_gesture = "NONE"
            display_conf = 0.0
            display_phrase = "Place hand in frame"
            status_text = "Searching for hand..."
            card_color = (40, 40, 40)
            text_color = (180, 180, 180)

            if detected:
                tracker.draw_landmarks(frame, raw_results)

                # 3. Model Inference
                pred_result = predictor.predict(landmarks)
                frame_gesture = pred_result["gesture"]
                frame_confidence = pred_result["confidence"]

                # 4. Temporal Smoothing
                smoothed_gesture, smoothed_conf, is_confirmed = smoother.add_prediction(
                    frame_gesture, frame_confidence
                )

                display_gesture = smoothed_gesture
                display_conf = smoothed_conf

                if is_confirmed:
                    display_phrase = predictor.get_phrase_for_gesture(smoothed_gesture)
                    status_text = "GESTURE CONFIRMED [Ready for Kiosk Action]"
                    card_color = (25, 120, 25)    # Rich Green
                    text_color = (255, 255, 255)
                elif smoothed_gesture != "UNKNOWN":
                    display_phrase = predictor.get_phrase_for_gesture(smoothed_gesture)
                    status_text = "Stabilizing gesture..."
                    card_color = (30, 80, 150)    # Amber/Blue
                    text_color = (230, 230, 230)
                else:
                    display_phrase = "Unrecognized gesture or transition"
                    status_text = "UNKNOWN [Try adjusting hand position]"
                    card_color = (40, 40, 120)    # Crimson/Dark Red
                    text_color = (200, 200, 200)
            else:
                # Hand lost - reset smoother buffer
                smoother.reset()

            # Render Kiosk HUD
            # Bottom banner
            banner_h = 130
            cv2.rectangle(frame, (0, h - banner_h), (w, h), (15, 15, 15), -1)
            cv2.rectangle(frame, (10, h - banner_h + 10), (w - 10, h - 10), card_color, -1)

            # Header info
            cv2.putText(
                frame,
                f"Status: {status_text}",
                (25, h - banner_h + 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (220, 220, 220),
                1,
                cv2.LINE_AA,
            )

            # Detected Gesture and Confidence
            cv2.putText(
                frame,
                f"Gesture: {display_gesture} ({display_conf * 100:.1f}%)",
                (25, h - banner_h + 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                text_color,
                2,
                cv2.LINE_AA,
            )

            # Phrase text
            cv2.putText(
                frame,
                f"Phrase: \"{display_phrase}\"",
                (25, h - banner_h + 105),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.75,
                (255, 255, 100),
                2,
                cv2.LINE_AA,
            )

            # Top info (FPS, exit hint)
            cv2.putText(
                frame,
                f"FPS: {fps:.1f} | Press 'q' to quit",
                (15, 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (240, 240, 240),
                1,
                cv2.LINE_AA,
            )

            cv2.imshow(window_name, frame)

            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), ord("Q"), 27):
                print("\n[INFO] Exiting prediction preview.")
                break

    except KeyboardInterrupt:
        print("\n[INFO] Stopped by user.")
    finally:
        cap.release()
        tracker.close()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
