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
    def __init__(self, max_lost_frames: int = 30, min_iou: float = 0.3):
        self.max_lost_frames = max_lost_frames
        self.min_iou = min_iou
        self.next_track_id = 1
        # Track representation: {track_id: {"bbox": [...], "lost_frames": 0, "class": "..."}}
        self.tracks: Dict[int, Dict[str, Any]] = {}

    def update(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Updates tracks with new frame detections.
        """
        matched_detections = set()
        matched_tracks = set()
        updated_tracks = []
        
        # 1. Compute IoU between existing tracks and new detections
        matches = []
        for track_id, track_data in self.tracks.items():
            for det_idx, det in enumerate(detections):
                if det["class"] != track_data["class"]:
                    continue
                iou = calculate_iou(track_data["bbox"], det["bbox"])
                if iou >= self.min_iou:
                    matches.append((iou, track_id, det_idx))
                    
        # Sort matches by highest IoU first
        matches.sort(key=lambda x: x[0], reverse=True)
        
        # 2. Assign detections to tracks
        for iou, track_id, det_idx in matches:
            if track_id in matched_tracks or det_idx in matched_detections:
                continue
            matched_tracks.add(track_id)
            matched_detections.add(det_idx)
            
            # Update track info
            self.tracks[track_id]["bbox"] = detections[det_idx]["bbox"]
            self.tracks[track_id]["lost_frames"] = 0
            
            updated_tracks.append({
                "id": track_id,
                "bbox": self.tracks[track_id]["bbox"],
                "class": self.tracks[track_id]["class"]
            })
            
        # 3. Handle unmatched tracks (increment lost frame count, remove if too old)
        unmatched_tracks = set(self.tracks.keys()) - matched_tracks
        for track_id in list(unmatched_tracks):
            self.tracks[track_id]["lost_frames"] += 1
            if self.tracks[track_id]["lost_frames"] > self.max_lost_frames:
                del self.tracks[track_id]
            else:
                # Still output the last known position, marked as lost or just continue tracking
                updated_tracks.append({
                    "id": track_id,
                    "bbox": self.tracks[track_id]["bbox"],
                    "class": self.tracks[track_id]["class"]
                })
                
        # 4. Create new tracks for unmatched detections
        for det_idx, det in enumerate(detections):
            if det_idx not in matched_detections:
                track_id = self.next_track_id
                self.next_track_id += 1
                
                self.tracks[track_id] = {
                    "bbox": det["bbox"],
                    "lost_frames": 0,
                    "class": det["class"]
                }
                
                updated_tracks.append({
                    "id": track_id,
                    "bbox": det["bbox"],
                    "class": det["class"]
                })
                
        return updated_tracks
