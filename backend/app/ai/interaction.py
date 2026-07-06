from typing import List, Dict, Any, Tuple
from app.models.postgres import InteractionType

class InteractionDetector:
    def __init__(self):
        # Dictionary keeping track of product status on shelves
        # product_id: {"shelf_id": int, "bbox": [x1,y1,x2,y2], "present": bool}
        self.shelf_products: Dict[int, Dict[str, Any]] = {}
        # session_id: {product_id: {"held": bool, "pickup_time": float}}
        self.shopper_held_items: Dict[int, Dict[int, Dict[str, Any]]] = {}

    def initialize_shelf_map(self, products: List[Dict[str, Any]]):
        """
        Initializes initial map of products and their shelf locations.
        products: [{"product_id": int, "shelf_id": int, "bbox": [x1,y1,x2,y2]}]
        """
        for p in products:
            self.shelf_products[p["product_id"]] = {
                "shelf_id": p["shelf_id"],
                "bbox": p["bbox"],
                "present": True
            }

    def detect_interactions(
        self,
        shopper_tracks: List[Dict[str, Any]],
        product_detections: List[Dict[str, Any]],
        hand_detections: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Runs collision logic to detect PICKUP, RETURN, and PURCHASE interactions.
        Returns:
            List[{"session_id": int, "product_id": int, "shelf_id": int, "type": InteractionType}]
        """
        events = []
        
        # In a real environment, we'd cross-reference hand bounding boxes
        # and see which products they overlap, checking if the product disappears (PICKUP)
        # or reappears (RETURN).
        
        # Here we implement this exact spatial overlap logic:
        for hand in hand_detections:
            hand_bbox = hand["bbox"]
            
            # Find closest shopper ID to associate hand to session
            associated_session_id = None
            min_dist = float('inf')
            for shopper in shopper_tracks:
                if shopper["class"] != "person":
                    continue
                s_bbox = shopper["bbox"]
                # Calculate distance between hand center and shopper center
                hand_center = ((hand_bbox[0] + hand_bbox[2])/2, (hand_bbox[1] + hand_bbox[3])/2)
                shopper_center = ((s_bbox[0] + s_bbox[2])/2, (s_bbox[1] + s_bbox[3])/2)
                dist = (hand_center[0] - shopper_center[0])**2 + (hand_center[1] - shopper_center[1])**2
                if dist < min_dist:
                    min_dist = dist
                    associated_session_id = shopper["id"]
            
            if not associated_session_id:
                continue
                
            # Check overlap between hand and product bboxes
            for product_id, p_info in self.shelf_products.items():
                p_bbox = p_info["bbox"]
                
                # Check for intersection between hand and product
                overlap_x = max(0, min(hand_bbox[2], p_bbox[2]) - max(hand_bbox[0], p_bbox[0]))
                overlap_y = max(0, min(hand_bbox[3], p_bbox[3]) - max(hand_bbox[1], p_bbox[1]))
                overlap_area = overlap_x * overlap_y
                
                if overlap_area > 0:
                    # Check if product is present in current detections list
                    product_present = False
                    for det in product_detections:
                        if det["class"] == "product":
                            det_bbox = det["bbox"]
                            # Calculate IoU with shelf product standard location
                            det_overlap_x = max(0, min(det_bbox[2], p_bbox[2]) - max(det_bbox[0], p_bbox[0]))
                            det_overlap_y = max(0, min(det_bbox[3], p_bbox[3]) - max(det_bbox[1], p_bbox[1]))
                            if (det_overlap_x * det_overlap_y) > 0.5 * ((p_bbox[2]-p_bbox[0]) * (p_bbox[3]-p_bbox[1])):
                                product_present = True
                                break
                    
                    # If product was present, but now is gone -> PICKUP
                    if p_info["present"] and not product_present:
                        self.shelf_products[product_id]["present"] = False
                        
                        # Mark shopper as holding item
                        if associated_session_id not in self.shopper_held_items:
                            self.shopper_held_items[associated_session_id] = {}
                        self.shopper_held_items[associated_session_id][product_id] = {"held": True}
                        
                        events.append({
                            "session_id": associated_session_id,
                            "product_id": product_id,
                            "shelf_id": p_info["shelf_id"],
                            "type": InteractionType.PICKUP
                        })
                        
                    # If product was missing, and now is present again -> RETURN
                    elif not p_info["present"] and product_present:
                        self.shelf_products[product_id]["present"] = True
                        
                        # Mark item as returned
                        if associated_session_id in self.shopper_held_items and product_id in self.shopper_held_items[associated_session_id]:
                            self.shopper_held_items[associated_session_id][product_id]["held"] = False
                            
                        events.append({
                            "session_id": associated_session_id,
                            "product_id": product_id,
                            "shelf_id": p_info["shelf_id"],
                            "type": InteractionType.RETURN
                        })
                        
        return events
        
    def handle_session_exit(self, session_id: int) -> List[Dict[str, Any]]:
        """
        Triggers PURCHASE events for any items still held when shopper exits the scene.
        """
        purchase_events = []
        if session_id in self.shopper_held_items:
            for product_id, info in self.shopper_held_items[session_id].items():
                if info["held"]:
                    # Convert to PURCHASE
                    shelf_id = self.shelf_products[product_id]["shelf_id"]
                    purchase_events.append({
                        "session_id": session_id,
                        "product_id": product_id,
                        "shelf_id": shelf_id,
                        "type": InteractionType.PURCHASE
                    })
            del self.shopper_held_items[session_id]
        return purchase_events
