"""Interactive Dataset Collection Tool for Verified ISL Gestures.

Features:
- Numeric menu displaying all configured gestures from config/gestures.json.
- Real-time webcam overlay showing landmarks, current quota, and live progress bar.
- Automatic sampling interval control to avoid redundant identical frames.
- Append-safe persistence to dataset/isl_landmarks.csv with live sample count tracking.
- First-class support for the UNKNOWN gesture category.
"""

import json
from pathlib import Path
import sys
import time
import cv2

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.data_collector import DataCollector
from src.hand_tracker import HandTracker, MEDIAPIPE_AVAILABLE

DATASET_CSV = PROJECT_ROOT / "dataset" / "isl_landmarks.csv"
CONFIG_FILE = PROJECT_ROOT / "config" / "gestures.json"
DEFAULT_TARGET_SAMPLES = 500


def load_gesture_config() -> list:
    if not CONFIG_FILE.exists():
        print(f"[ERROR] Gestures config missing: {CONFIG_FILE}")
        sys.exit(1)
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get("gestures", [])


def print_menu(gestures: list, collector: DataCollector, target_samples: int = DEFAULT_TARGET_SAMPLES) -> None:
    counts = collector.get_sample_counts()
    print("\n" + "=" * 60)
    print("       ISL KIOSK - DATASET COLLECTION TOOL")
    print("=" * 60)
    print(f"{'#':<4} | {'Gesture ID':<15} | {'Existing Samples':<18} | {'Phrase'}")
    print("-" * 60)
    for idx, item in enumerate(gestures, 1):
        gid = item["id"]
        sample_count = counts.get(gid, 0)
        phrase = item.get("phrase", "")
        status_marker = "[DONE]" if sample_count >= target_samples else f"[{sample_count}/{target_samples}]"
        print(f"{idx:<4} | {gid:<15} | {status_marker:<18} | {phrase}")
    print("-" * 60)
    print("  0. Exit collection tool")
    print("=" * 60)


def collect_for_gesture(
    gesture_id: str,
    phrase: str,
    target_samples: int,
    collector: DataCollector,
    tracker: HandTracker,
) -> None:
    print(f"\n[INFO] Starting collection for: {gesture_id}")
    print("Instructions:")
    print("  - Hold the sign clearly in front of the camera.")
    print("  - Slightly vary your hand position/angle for better generalization.")
    print("  - Press 'SPACE' to Pause/Resume capture.")
    print("  - Press 'q' or ESC to stop and return to menu.\n")

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Could not access webcam.")
        return

    window_name = f"Collecting: {gesture_id} (Target: {target_samples})"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

    current_counts = collector.get_sample_counts()
    collected = current_counts.get(gesture_id, 0)
    is_paused = False

    try:
        while collected < target_samples:
            ret, frame = cap.read()
            if not ret or frame is None:
                time.sleep(0.05)
                continue

            frame = cv2.flip(frame, 1)
            h, w, _ = frame.shape

            detected, landmarks, raw_results = tracker.process_frame(frame)

            status_color = (0, 165, 255)
            status_text = "Hand Not Detected"

            if detected:
                tracker.draw_landmarks(frame, raw_results)
                hand_cnt = tracker.hand_count
                hand_tag = f"[{hand_cnt} Hand{'s' if hand_cnt > 1 else ''}]"
                if not is_paused:
                    saved = collector.record_sample(gesture_id, landmarks)
                    if saved:
                        collected += 1
                    status_text = f"RECORDING ({collected}/{target_samples}) {hand_tag}"
                    status_color = (0, 255, 0)
                else:
                    status_text = f"PAUSED (Press SPACE to resume) {hand_tag}"
                    status_color = (0, 255, 255)

            # Draw HUD Overlay
            cv2.rectangle(frame, (10, 10), (w - 10, 110), (20, 20, 20), -1)
            cv2.putText(
                frame,
                f"Gesture: {gesture_id} - '{phrase}'",
                (25, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2,
                cv2.LINE_AA,
            )
            cv2.putText(
                frame,
                f"Status: {status_text}",
                (25, 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.65,
                status_color,
                2,
                cv2.LINE_AA,
            )

            # Progress Bar
            progress_ratio = min(1.0, collected / float(target_samples))
            bar_w = int((w - 50) * progress_ratio)
            cv2.rectangle(frame, (25, 85), (w - 25, 100), (60, 60, 60), -1)
            cv2.rectangle(frame, (25, 85), (25 + bar_w, 100), (0, 200, 0), -1)

            cv2.imshow(window_name, frame)

            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), ord("Q"), 27):
                print(f"[INFO] Collection interrupted at {collected}/{target_samples} samples.")
                break
            elif key == ord(" "):
                is_paused = not is_paused
                print(f"[INFO] {'PAUSED' if is_paused else 'RESUMED'} capture.")

        if collected >= target_samples:
            print(f"\n[SUCCESS] Target quota reached for {gesture_id}: {collected}/{target_samples} samples!")

    finally:
        cap.release()
        cv2.destroyWindow(window_name)


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Collect verified ISL gesture landmark samples.")
    parser.add_argument(
        "--target",
        type=int,
        default=DEFAULT_TARGET_SAMPLES,
        help=f"Target number of samples to collect per gesture (default: {DEFAULT_TARGET_SAMPLES})",
    )
    args = parser.parse_args()
    target_samples = args.target

    if not MEDIAPIPE_AVAILABLE:
        print("[ERROR] MediaPipe is not installed. Run: pip install -r requirements.txt")
        sys.exit(1)

    gestures = load_gesture_config()
    collector = DataCollector(output_csv_path=DATASET_CSV)
    tracker = HandTracker(max_num_hands=2)

    try:
        while True:
            print_menu(gestures, collector, target_samples=target_samples)
            choice_str = input("\nEnter gesture number to collect (or 0 to quit): ").strip()

            if not choice_str.isdigit():
                print("[Invalid Input] Please enter a valid number.")
                continue

            choice = int(choice_str)
            if choice == 0:
                print("\n[INFO] Exiting dataset collection tool. Goodbye!")
                break

            if 1 <= choice <= len(gestures):
                target_item = gestures[choice - 1]
                collect_for_gesture(
                    gesture_id=target_item["id"],
                    phrase=target_item.get("phrase", ""),
                    target_samples=target_samples,
                    collector=collector,
                    tracker=tracker,
                )
            else:
                print(f"[Invalid Choice] Please select between 1 and {len(gestures)}.")

    except KeyboardInterrupt:
        print("\n[INFO] Collection interrupted. Bye!")
    finally:
        tracker.close()


if __name__ == "__main__":
    main()
