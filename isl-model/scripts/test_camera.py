"""Camera and Hand Tracking Sanity Check Script.

Verifies:
1. Webcam connectivity and capture.
2. Horizontal mirror flip for natural kiosk interaction.
3. MediaPipe hand detection and landmark tracking.
4. Landmark skeleton rendering.
5. Clean shutdown when pressing 'Q'.
"""

import sys
from pathlib import Path
import time
import cv2

# Add parent directory to sys.path to ensure src imports work when running directly
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.hand_tracker import HandTracker, MEDIAPIPE_AVAILABLE


def main() -> None:
    print("\n" + "=" * 50)
    print("      ISL KIOSK - CAMERA & TRACKING TEST")
    print("=" * 50)
    print("Controls: Press 'q' or ESC in the video window to exit.")

    if not MEDIAPIPE_AVAILABLE:
        print("\n[ERROR] MediaPipe is not installed.")
        print("Please run: pip install -r requirements.txt")
        sys.exit(1)

    # Attempt to open webcam (try indices 0, 1, 2)
    cap = None
    cam_index = 0
    for idx in (0, 1, 2):
        temp_cap = cv2.VideoCapture(idx)
        if temp_cap.isOpened():
            ret, test_frame = temp_cap.read()
            if ret and test_frame is not None:
                cap = temp_cap
                cam_index = idx
                print(f"[OK] Camera successfully opened at index {cam_index}")
                break
            temp_cap.release()

    if cap is None:
        print("\n[ERROR] Could not open any webcam (tried indices 0, 1, 2).")
        print("Please check camera connection and permissions.")
        sys.exit(1)

    # Initialize tracker
    tracker = HandTracker(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.5,
    )

    prev_time = time.time()
    fps = 0.0

    window_name = "ISL Kiosk - Camera Sanity Test (Press Q to quit)"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

    try:
        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                print("[Warning] Failed to grab frame from camera.")
                time.sleep(0.05)
                continue

            # Calculate FPS
            curr_time = time.time()
            dt = curr_time - prev_time
            if dt > 0:
                fps = 0.9 * fps + 0.1 * (1.0 / dt)
            prev_time = curr_time

            # 1. Flip horizontally for natural mirror interaction
            frame = cv2.flip(frame, 1)

            # 2. Detect hand landmarks (supports both hands)
            detected, landmarks, raw_results = tracker.process_frame(frame)

            # 3. Draw landmarks
            if detected:
                tracker.draw_landmarks(frame, raw_results)
                cnt = tracker.hand_count
                hands_str = ", ".join(tracker.get_handedness()) or f"{cnt} Hands"
                status_text = f"Status: {cnt} Hand{'s' if cnt > 1 else ''} Detected ({hands_str})"
                status_color = (0, 255, 0)  # Green
            else:
                status_text = "Status: No Hand Detected"
                status_color = (0, 165, 255)  # Orange

            # 4. Display HUD overlay
            h, w, _ = frame.shape
            cv2.rectangle(frame, (10, 10), (w - 10, 80), (20, 20, 20), -1)
            cv2.putText(
                frame,
                status_text,
                (25, 45),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                status_color,
                2,
                cv2.LINE_AA,
            )
            cv2.putText(
                frame,
                f"FPS: {fps:.1f} | Cam: #{cam_index} | Press 'q' to exit",
                (25, 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (200, 200, 200),
                1,
                cv2.LINE_AA,
            )

            cv2.imshow(window_name, frame)

            # Check for quit key
            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), ord("Q"), 27):  # 'q' or ESC
                print("\n[INFO] Exiting camera test cleanly.")
                break

    except KeyboardInterrupt:
        print("\n[INFO] Interrupted by user.")
    finally:
        cap.release()
        tracker.close()
        cv2.destroyAllWindows()
        print("[INFO] Camera released and windows closed.")


if __name__ == "__main__":
    main()
