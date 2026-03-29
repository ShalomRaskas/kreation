#!/usr/bin/env python3
"""
face_detect.py — MediaPipe face landmark sampling for Kreation video editor
Usage:  python3 face_detect.py <video_path> [frame_interval]
Output: JSON array of look-away events  [{timestamp, type, deviation?}, ...]

Samples every `frame_interval` frames (default 30).
For each sampled frame, runs MediaPipe FaceMesh and checks whether the
speaker's nose tip deviates significantly from the eye midpoint — a reliable
proxy for horizontal head rotation (looking left/right off-camera).
"""
import sys
import json

try:
    import cv2
    import mediapipe as mp
except ImportError:
    # Graceful fallback — server will proceed without face signals
    print(json.dumps([]))
    sys.exit(0)


def detect_looking_away(video_path, frame_interval=30, yaw_threshold=0.35):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=False,
        min_detection_confidence=0.5,
    )

    events = []
    frame_num = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_num % frame_interval == 0:
            timestamp = round(frame_num / fps, 2)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = face_mesh.process(rgb)

            if not result.multi_face_landmarks:
                events.append({'timestamp': timestamp, 'type': 'no_face'})
            else:
                lm = result.multi_face_landmarks[0].landmark
                # MediaPipe FaceMesh indices:
                #   1  = nose tip
                #  33  = left eye outer corner
                # 263  = right eye outer corner
                nose_x    = lm[1].x
                l_eye_x   = lm[33].x
                r_eye_x   = lm[263].x
                eye_mid_x = (l_eye_x + r_eye_x) / 2.0
                eye_span  = abs(r_eye_x - l_eye_x)

                if eye_span > 0:
                    deviation = (nose_x - eye_mid_x) / eye_span
                    if abs(deviation) > yaw_threshold:
                        events.append({
                            'timestamp': timestamp,
                            'type': 'looking_away',
                            'deviation': round(deviation, 3),
                        })

        frame_num += 1

    cap.release()
    face_mesh.close()
    return events


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps([]))
        sys.exit(1)

    interval = int(sys.argv[2]) if len(sys.argv) > 2 else 30
    events = detect_looking_away(sys.argv[1], frame_interval=interval)
    print(json.dumps(events))
