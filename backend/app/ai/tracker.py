import numpy as np
from typing import List, Dict, Any, Tuple

def calculate_iou(boxA: List[int], boxB: List[int]) -> float:
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])
    
    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
    
    unionArea = boxAArea + boxBArea - interArea
    if unionArea == 0:
        return 0.0
    return interArea / float(unionArea)

class MultiObjectTracker:
    def __init__(self, max_lost_frames: int = 30, min_iou: float = 0.25):
        self.max_lost_frames = max_lost_frames
        self.min_iou = min_iou
        self.next_track_id = 1
        # Track representation: {track_id: {"bbox": [...], "lost_frames": 0, "class": "...", "velocity": [0.0, 0.0]}}
        self.tracks: Dict[int, Dict[str, Any]] = {}

    def update(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Updates tracks with new frame detections using velocity prediction and
        a ByteTrack-style two-stage association pipeline.
        """
        # 1. Split detections into high and low confidence groups
        high_dets = []
        low_dets = []
        for d in detections:
            conf = d.get("confidence", 1.0)
            if conf >= 0.4:
                high_dets.append(d)
            elif conf >= 0.15:
                low_dets.append(d)

        matched_tracks = set()
        matched_high_dets = set()
        matched_low_dets = set()
        updated_tracks = []

        # 2. Predict step: Get predicted bounding boxes for existing tracks based on velocity
        predicted_tracks = {}
        for track_id, track_data in self.tracks.items():
            bbox = track_data["bbox"]
            vx, vy = track_data.get("velocity", [0.0, 0.0])
            
            # Predict next bounding box position
            pred_bbox = [
                int(bbox[0] + vx),
                int(bbox[1] + vy),
                int(bbox[2] + vx),
                int(bbox[3] + vy)
            ]
            predicted_tracks[track_id] = pred_bbox

        # --- STAGE 1: Match high confidence detections with predicted tracks ---
        high_matches = []
        for track_id, pred_bbox in predicted_tracks.items():
            track_data = self.tracks[track_id]
            for det_idx, det in enumerate(high_dets):
                if det["class"] != track_data["class"]:
                    continue
                iou = calculate_iou(pred_bbox, det["bbox"])
                if iou >= self.min_iou:
                    high_matches.append((iou, track_id, det_idx))

        # Sort matches by highest IoU first
        high_matches.sort(key=lambda x: x[0], reverse=True)

        for iou, track_id, det_idx in high_matches:
            if track_id in matched_tracks or det_idx in matched_high_dets:
                continue
            matched_tracks.add(track_id)
            matched_high_dets.add(det_idx)

            # Calculate new velocity
            old_bbox = self.tracks[track_id]["bbox"]
            new_bbox = high_dets[det_idx]["bbox"]
            
            old_cx = (old_bbox[0] + old_bbox[2]) / 2.0
            old_cy = (old_bbox[1] + old_bbox[3]) / 2.0
            new_cx = (new_bbox[0] + new_bbox[2]) / 2.0
            new_cy = (new_bbox[1] + new_bbox[3]) / 2.0
            
            vx_new = new_cx - old_cx
            vy_new = new_cy - old_cy
            
            # Smooth velocity update (exponential moving average)
            prev_vx, prev_vy = self.tracks[track_id].get("velocity", [0.0, 0.0])
            vx = 0.7 * prev_vx + 0.3 * vx_new
            vy = 0.7 * prev_vy + 0.3 * vy_new

            # Update track
            self.tracks[track_id]["bbox"] = new_bbox
            self.tracks[track_id]["lost_frames"] = 0
            self.tracks[track_id]["velocity"] = [vx, vy]

            updated_tracks.append({
                "id": track_id,
                "bbox": new_bbox,
                "class": self.tracks[track_id]["class"]
            })

        # --- STAGE 2: Match remaining unmatched tracks with low confidence detections (to handle occlusion) ---
        unmatched_tracks = set(self.tracks.keys()) - matched_tracks
        low_matches = []
        for track_id in unmatched_tracks:
            pred_bbox = predicted_tracks[track_id]
            track_data = self.tracks[track_id]
            for det_idx, det in enumerate(low_dets):
                if det["class"] != track_data["class"]:
                    continue
                iou = calculate_iou(pred_bbox, det["bbox"])
                if iou >= self.min_iou:
                    low_matches.append((iou, track_id, det_idx))

        # Sort matches by highest IoU
        low_matches.sort(key=lambda x: x[0], reverse=True)

        for iou, track_id, det_idx in low_matches:
            if track_id in matched_tracks or det_idx in matched_low_dets:
                continue
            matched_tracks.add(track_id)
            matched_low_dets.add(det_idx)

            # Update track info
            new_bbox = low_dets[det_idx]["bbox"]
            self.tracks[track_id]["bbox"] = new_bbox
            self.tracks[track_id]["lost_frames"] = 0
            # Keep the last velocity, don't update velocity on low confidence detections to avoid noise
            
            updated_tracks.append({
                "id": track_id,
                "bbox": new_bbox,
                "class": self.tracks[track_id]["class"]
            })

        # --- STAGE 3: Handle unmatched tracks (lost tracks) ---
        still_unmatched = set(self.tracks.keys()) - matched_tracks
        for track_id in list(still_unmatched):
            self.tracks[track_id]["lost_frames"] += 1
            if self.tracks[track_id]["lost_frames"] > self.max_lost_frames:
                del self.tracks[track_id]
            else:
                # Drift the box position using its predicted velocity so it moves in predicted direction
                pred_bbox = predicted_tracks[track_id]
                self.tracks[track_id]["bbox"] = pred_bbox
                
                # Still emit the track (marked as lost but estimated position)
                updated_tracks.append({
                    "id": track_id,
                    "bbox": pred_bbox,
                    "class": self.tracks[track_id]["class"]
                })

        # --- STAGE 4: Create new tracks for unmatched high confidence detections ---
        for det_idx, det in enumerate(high_dets):
            if det_idx not in matched_high_dets:
                track_id = self.next_track_id
                self.next_track_id += 1
                
                self.tracks[track_id] = {
                    "bbox": det["bbox"],
                    "lost_frames": 0,
                    "class": det["class"],
                    "velocity": [0.0, 0.0]
                }
                
                updated_tracks.append({
                    "id": track_id,
                    "bbox": det["bbox"],
                    "class": det["class"]
                })

        return updated_tracks
