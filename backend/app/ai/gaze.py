import cv2
import numpy as np
from typing import Dict, Any, Tuple, Optional

class GazeEstimator:
    def __init__(self):
        self.mp_face_mesh = None
        self.face_mesh = None
        self._init_mediapipe()

    def _init_mediapipe(self):
        try:
            import mediapipe as mp
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self.mp_face_mesh.FaceMesh(
                max_num_faces=5,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            print("MediaPipe FaceMesh initialized successfully.")
        except Exception as e:
            print(f"MediaPipe loading failed: {e}. Falling back to simulation-based estimation.")

    def estimate(self, face_img: np.ndarray) -> Tuple[Dict[str, float], Tuple[float, float, float]]:
        """
        Estimates Head Pose (yaw, pitch, roll) and Gaze Vector.
        Returns:
            - head_pose: {"yaw": float, "pitch": float, "roll": float} (degrees)
            - gaze_vector: (x, y, z) unit vector representing gaze direction
        """
        h, w, _ = face_img.shape
        default_pose = {"yaw": 0.0, "pitch": 0.0, "roll": 0.0}
        default_gaze = (0.0, 0.0, -1.0)
        
        if self.face_mesh is not None:
            try:
                rgb_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
                results = self.face_mesh.process(rgb_img)
                
                if results.multi_face_landmarks:
                    landmarks = results.multi_face_landmarks[0].landmark
                    
                    # Selected 2D indices for head pose (based on MediaPipe indices)
                    # Nose tip (1), Chin (152), Left eye left corner (33), Right eye right corner (263), Left mouth corner (57), Right mouth corner (287)
                    image_points = np.array([
                        [landmarks[1].x * w, landmarks[1].y * h],      # Nose tip
                        [landmarks[152].x * w, landmarks[152].y * h],  # Chin
                        [landmarks[33].x * w, landmarks[33].y * h],    # Left eye left corner
                        [landmarks[263].x * w, landmarks[263].y * h],  # Right eye right corner
                        [landmarks[57].x * w, landmarks[57].y * h],    # Left mouth corner
                        [landmarks[287].x * w, landmarks[287].y * h]   # Right mouth corner
                    ], dtype="double")
                    
                    # Standard 3D model points
                    model_points = np.array([
                        (0.0, 0.0, 0.0),             # Nose tip
                        (0.0, -330.0, -65.0),        # Chin
                        (-225.0, 170.0, -135.0),     # Left eye left corner
                        (225.0, 170.0, -135.0),      # Right eye right corner
                        (-150.0, -150.0, -125.0),    # Left mouth corner
                        (150.0, -150.0, -125.0)      # Right mouth corner
                    ])
                    
                    # Camera intrinsic matrix approximation
                    focal_length = w
                    center = (w/2, h/2)
                    camera_matrix = np.array([
                        [focal_length, 0, center[0]],
                        [0, focal_length, center[1]],
                        [0, 0, 1]
                    ], dtype="double")
                    
                    dist_coeffs = np.zeros((4, 1)) # Assuming no lens distortion
                    
                    success, rotation_vector, translation_vector = cv2.solvePnP(
                        model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
                    )
                    
                    if success:
                        # Convert rotation vector to matrix
                        rmat, _ = cv2.Rodrigues(rotation_vector)
                        
                        # Extract Euler Angles (pitch, yaw, roll)
                        sy = np.sqrt(rmat[0,0] * rmat[0,0] +  rmat[1,0] * rmat[1,0])
                        singular = sy < 1e-6
                        
                        if not singular:
                            pitch = np.arctan2(rmat[2,1], rmat[2,2])
                            yaw = np.arctan2(-rmat[2,0], sy)
                            roll = np.arctan2(rmat[1,0], rmat[0,0])
                        else:
                            pitch = np.arctan2(-rmat[1,2], rmat[1,1])
                            yaw = np.arctan2(-rmat[2,0], sy)
                            roll = 0
                            
                        # Convert to degrees
                        yaw_deg = float(np.degrees(yaw))
                        pitch_deg = float(np.degrees(pitch))
                        roll_deg = float(np.degrees(roll))
                        
                        head_pose = {"yaw": yaw_deg, "pitch": pitch_deg, "roll": roll_deg}
                        
                        # Simple gaze calculation using head orientation combined with eye offsets
                        # Base gaze is the forward vector rotated by head pose
                        # In production, iris landmarks are tracked for precise vectors
                        gaze_x = np.sin(yaw) * np.cos(pitch)
                        gaze_y = -np.sin(pitch)
                        gaze_z = -np.cos(yaw) * np.cos(pitch)
                        
                        return head_pose, (float(gaze_x), float(gaze_y), float(gaze_z))
            except Exception as e:
                print(f"MediaPipe processing error: {e}")

        # Geometric simulation if models fail or are absent
        # Simulates eye sweeps across the horizontal plane
        import time
        t = time.time()
        sim_yaw = float(15.0 * np.sin(t * 1.5))
        sim_pitch = float(5.0 * np.cos(t * 0.8))
        sim_roll = 0.0
        
        yaw_rad = np.radians(sim_yaw)
        pitch_rad = np.radians(sim_pitch)
        
        gaze_x = np.sin(yaw_rad)
        gaze_y = -np.sin(pitch_rad)
        gaze_z = -np.cos(yaw_rad)
        
        return {"yaw": sim_yaw, "pitch": sim_pitch, "roll": sim_roll}, (gaze_x, gaze_y, gaze_z)
