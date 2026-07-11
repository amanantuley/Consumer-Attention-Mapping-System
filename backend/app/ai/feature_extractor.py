import os
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import mongo_db
from app.models.postgres import ShopperSession, ProductInteraction, Shelf
from app.ai.models_loader import model_loader
from typing import Dict, Any, List

class SessionFeatureExtractor:
    @staticmethod
    def extract_features(db: Session, session_uuid: str) -> Dict[str, Any]:
        """
        Extracts structured behavior features from unstructured session telemetry
        stored across MongoDB (movements, gaze) and PostgreSQL (interactions).
        """
        # Fetch the session from PostgreSQL
        session = db.query(ShopperSession).filter(ShopperSession.tracking_uuid == session_uuid).first()
        if not session:
            raise ValueError(f"Session with uuid {session_uuid} not found")

        # Query raw MongoDB collections
        movement_records = list(mongo_db.shopper_movements.find({"session_uuid": session_uuid}))
        gaze_records = list(mongo_db.gaze_telemetry.find({"session_uuid": session_uuid}))

        # 1. Dwell time
        timestamps = []
        for r in movement_records:
            if "timestamp" in r:
                timestamps.append(r["timestamp"])
        for r in gaze_records:
            if "timestamp" in r:
                timestamps.append(r["timestamp"])

        if timestamps:
            # Ensure timestamps are datetime objects
            parsed_timestamps = []
            for ts in timestamps:
                if isinstance(ts, str):
                    try:
                        parsed_timestamps.append(datetime.fromisoformat(ts))
                    except ValueError:
                        pass
                elif isinstance(ts, datetime):
                    parsed_timestamps.append(ts)
            if parsed_timestamps:
                dwell_time = (max(parsed_timestamps) - min(parsed_timestamps)).total_seconds()
            else:
                dwell_time = 0.0
        else:
            # Fallback to postgres session duration
            if session.end_time:
                dwell_time = (session.end_time - session.start_time).total_seconds()
            else:
                dwell_time = (datetime.utcnow() - session.start_time).total_seconds()

        # Dwell time should not be negative
        dwell_time = max(0.0, dwell_time)

        # 2. Zones Visited
        visited_zones = set()
        
        # Query product interactions for shelf IDs
        interactions = db.query(ProductInteraction).filter(ProductInteraction.session_id == session.id).all()
        for inter in interactions:
            # In some schemas, shelf_id might be present on ProductInteraction
            shelf_id = getattr(inter, "shelf_id", None)
            if shelf_id:
                visited_zones.add(str(shelf_id))

        # Check movement coordinate intersections with shelves
        shelves = db.query(Shelf).filter(Shelf.store_id == session.store_id).all()
        for r in movement_records:
            x = r.get("x")
            y = r.get("y")
            if x is None or y is None:
                continue
            for shelf in shelves:
                coords = shelf.zone_coordinates
                # zone_coordinates is typically [[x1, y1], [[x2, y2]]] or similar
                if coords and isinstance(coords, list) and len(coords) >= 2:
                    try:
                        x1, y1 = coords[0]
                        x2, y2 = coords[1]
                        if min(x1, x2) <= x <= max(x1, x2) and min(y1, y2) <= y <= max(y1, y2):
                            visited_zones.add(str(shelf.id))
                    except (ValueError, TypeError, IndexError):
                        pass

        # At least 1 zone visited since they are in the store
        zones_visited = max(1, len(visited_zones))

        # 3. Gaze focus duration
        gaze_focus_duration = sum(float(r.get("focus_duration", 1.0)) for r in gaze_records)

        # 4. Product interactions (picked, returned, purchased)
        products_picked = sum(1 for i in interactions if getattr(i, "interaction_type", None) == "pickup")
        products_returned = sum(1 for i in interactions if getattr(i, "interaction_type", None) == "return")
        products_purchased = sum(1 for i in interactions if getattr(i, "interaction_type", None) == "purchase")

        feature_vector = [
            float(dwell_time),
            float(zones_visited),
            float(gaze_focus_duration),
            float(products_picked),
            float(products_returned),
            float(products_purchased)
        ]

        return {
            "session_uuid": session_uuid,
            "features_vector": feature_vector,
            "metrics": {
                "dwell_time": round(dwell_time, 2),
                "zones_visited": int(zones_visited),
                "gaze_focus_duration": round(gaze_focus_duration, 2),
                "products_picked": int(products_picked),
                "products_returned": int(products_returned),
                "products_purchased": int(products_purchased)
            }
        }

    @classmethod
    def classify_and_update_session(cls, db: Session, session_uuid: str) -> Dict[str, Any]:
        """
        Extracts features, runs classifier, updates PG database and returns the result.
        """
        extracted = cls.extract_features(db, session_uuid)
        
        clf = model_loader.get_behavior_classifier()
        classification_result = clf.classify(extracted["features_vector"])
        
        # Update PG database
        session = db.query(ShopperSession).filter(ShopperSession.tracking_uuid == session_uuid).first()
        if session:
            session.segment = classification_result["class"]
            db.commit()
            db.refresh(session)
            
        return {
            **extracted,
            "classification": classification_result
        }
