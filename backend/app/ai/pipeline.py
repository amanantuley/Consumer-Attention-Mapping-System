import time
import json
from datetime import datetime
import cv2
import numpy as np
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal, mongo_db, redis_client
from app.models.postgres import Camera, ShopperSession, ProductInteraction, StoreZone, Shelf, Product
from app.ai.detectors import YOLODetector
from app.ai.tracker import MultiObjectTracker
from app.ai.gaze import GazeEstimator
from app.ai.interaction import InteractionDetector

# Kafka Producer setup (lazy initialized)
_kafka_producer = None
def get_kafka_producer():
    global _kafka_producer
    if _kafka_producer is None:
        try:
            from kafka import KafkaProducer
            _kafka_producer = KafkaProducer(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            print("Kafka Producer initialized successfully.")
        except Exception as e:
            print(f"Could not initialize Kafka Producer: {e}. Running without Kafka streaming.")
    return _kafka_producer

def publish_to_kafka(topic: str, message: dict):
    producer = get_kafka_producer()
    if producer:
        try:
            producer.send(topic, message)
        except Exception as e:
            print(f"Failed to send message to Kafka: {e}")

def broadcast_telemetry(session_uuid: str, data: dict):
    try:
        # Publish telemetry through Redis channel for WebSocket consumers
        redis_client.publish(f"telemetry:store:{data.get('store_id')}", json.dumps({
            "session_uuid": session_uuid,
            **data
        }))
    except Exception as e:
        pass

def process_video_stream(camera_id: str, stream_source: str) -> dict:
    """
    Core pipeline processing loop.
    Reads frames from stream_source, runs CV models, updates tracking, 
    detects shopper gestures & gaze attention, and logs telemetry.
    """
    db = SessionLocal()
    try:
        # Fetch camera details and store layout reference
        camera = db.query(Camera).filter(Camera.id == camera_id).first()
        if not camera:
            return {"status": "error", "message": "Camera not found"}
        store_id = camera.store_id
        
        # Load shelves and products mapping in this store zone
        shelves = db.query(Shelf).join(StoreZone).filter(StoreZone.store_id == store_id).all()
        products = db.query(Product).all()
        
        # Initialize AI Modules
        person_detector = YOLODetector("person")
        product_detector = YOLODetector("product")
        tracker = MultiObjectTracker()
        gaze_estimator = GazeEstimator()
        interaction_detector = InteractionDetector()
        
        # Map DB shelves & products coordinates to simulate overlaps
        # In a real deployed calibration, we map 3D camera projections to 2D bounding boxes.
        mock_products_map = []
        for i, shelf in enumerate(shelves):
            # Create a 2D bounding box approximation for shelves and products
            for j, sp in enumerate(shelf.shelf_products):
                mock_products_map.append({
                    "product_id": sp.product_id,
                    "shelf_id": shelf.id,
                    "bbox": [100 * (j+1), 150 * (i+1), 100 * (j+1) + 80, 150 * (i+1) + 80]
                })
        interaction_detector.initialize_shelf_map(mock_products_map)
        
        # Open video source (RTSP or local file)
        cap = cv2.VideoCapture(stream_source)
        is_live = stream_source.startswith("rtsp://")
        
        # Fallback to simulated frames if source fails (ensures mock stream runs correctly)
        use_simulation = not cap.isOpened() or stream_source == "simulation"
        if use_simulation:
            print(f"Targeting simulation source {stream_source}. Simulating pipeline stream...")
            # If simulation is active, run for a long duration (about 1 hour at 30 FPS)
            try:
                active_val = redis_client.get("simulation_active")
            except Exception:
                active_val = "true"
            total_frames = 100000 if active_val == "true" else 100
            frame_width, frame_height = 1280, 720
        else:
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) if not is_live else 10000
            frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
        print(f"Starting pipeline processing. Resolution: {frame_width}x{frame_height}")
        
        frame_idx = 0
        active_sessions = {}  # track_id: session_uuid
        
        while frame_idx < total_frames:
            # Check if simulation was stopped
            if use_simulation and total_frames > 100:
                try:
                    if redis_client.get("simulation_active") != "true":
                        print("Simulation stopped by control key.")
                        break
                except Exception:
                    pass
            timestamp = datetime.utcnow()
            
            if use_simulation:
                # Create a blank frame
                frame = np.zeros((frame_height, frame_width, 3), dtype=np.uint8)
                cv2.putText(frame, f"Simulated Frame {frame_idx}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                time.sleep(0.03) # Simulate 30 fps
            else:
                ret, frame = cap.read()
                if not ret:
                    break
                    
            # 1. Person Detection & Tracking
            person_dets = person_detector.detect(frame, camera_name=camera.name)
            shopper_tracks = tracker.update(person_dets)
            
            # 2. Product and Hand gesture detection
            other_dets = product_detector.detect(frame)
            product_dets = [d for d in other_dets if d["class"] == "product"]
            hand_dets = [d for d in other_dets if d["class"] == "hand"]
            
            # 3. Process Shoppers
            for shopper in shopper_tracks:
                track_id = shopper["id"]
                bbox = shopper["bbox"]
                
                # Manage Shopper Session mapping
                if track_id not in active_sessions:
                    # Create new ShopperSession in PostgreSQL
                    session_uuid = f"shopper_{int(time.time())}_{track_id}"
                    db_session = ShopperSession(
                        tracking_uuid=session_uuid,
                        store_id=store_id,
                        start_time=timestamp,
                        segment="Regular"
                    )
                    db.add(db_session)
                    db.commit()
                    db.refresh(db_session)
                    active_sessions[track_id] = {
                        "uuid": session_uuid,
                        "db_id": db_session.id
                    }
                    
                    # Update live store occupancy in Redis
                    try:
                        redis_client.sadd(f"store:{store_id}:occupancy", session_uuid)
                        redis_client.set(f"store:{store_id}:occupancy_count", str(redis_client.scard(f"store:{store_id}:occupancy")))
                    except Exception:
                        pass
                    
                    publish_to_kafka(settings.KAFKA_ALERT_TOPIC, {
                        "event": "shopper_entry",
                        "session_uuid": session_uuid,
                        "timestamp": timestamp.isoformat(),
                        "store_id": store_id
                    })
                
                session_info = active_sessions[track_id]
                session_uuid = session_info["uuid"]
                
                # Calculate physical center coordinate relative to resolution
                cx = (bbox[0] + bbox[2]) / 2.0
                cy = (bbox[1] + bbox[3]) / 2.0
                
                # Log movements to Redis Stream instead of MongoDB
                try:
                    redis_client.xadd("stream:shopper_movements", {
                        "session_uuid": session_uuid,
                        "store_id": str(store_id),
                        "camera_id": str(camera_id),
                        "timestamp": timestamp.isoformat(),
                        "x": str(cx / frame_width),
                        "y": str(cy / frame_height),
                        "velocity": "1.2"
                    })
                except Exception as e:
                    print(f"Error writing to Redis Stream: {e}")

                
                # 4. Gaze Estimation
                # Crop face bounding box for head pose estimation
                face_x1 = max(0, int(bbox[0]))
                face_y1 = max(0, int(bbox[1]))
                face_x2 = min(frame_width, int(bbox[2]))
                face_y2 = min(frame_height, int(bbox[1] + (bbox[3]-bbox[1])*0.25)) # Top 25% represents face
                
                if (face_x2 - face_x1) > 10 and (face_y2 - face_y1) > 10:
                    face_img = frame[face_y1:face_y2, face_x1:face_x2]
                    head_pose, gaze_vector = gaze_estimator.estimate(face_img)
                    
                    # Calculate looked-at targets (simulate intersection with shelves)
                    gaze_target_shelf_id = None
                    gaze_target_product_id = None
                    
                    # Simulated intersection (e.g. check if gaze horizontal vector points towards products)
                    look_x = cx + gaze_vector[0] * 300
                    look_y = cy + gaze_vector[1] * 300
                    
                    # Match look coordinates with mock products bounding boxes
                    for p_item in mock_products_map:
                        p_bbox = p_item["bbox"]
                        if p_bbox[0] <= look_x <= p_bbox[2] and p_bbox[1] <= look_y <= p_bbox[3]:
                            gaze_target_shelf_id = p_item["shelf_id"]
                            gaze_target_product_id = p_item["product_id"]
                            break
                            
                    # Log gaze telemetry to MongoDB
                    mongo_db.gaze_telemetry.insert_one({
                        "session_uuid": session_uuid,
                        "camera_id": camera_id,
                        "timestamp": timestamp,
                        "gaze_vector": list(gaze_vector),
                        "head_pose": head_pose,
                        "focus_duration": 1.0, # increment in seconds
                        "target_type": "product" if gaze_target_product_id else "empty",
                        "target_id": gaze_target_product_id
                    })
                    
                    # Send telemetry event to Redis channel
                    broadcast_telemetry(session_uuid, {
                        "store_id": store_id,
                        "camera_id": camera_id,
                        "x": cx / frame_width,
                        "y": cy / frame_height,
                        "gaze_target_shelf_id": gaze_target_shelf_id,
                        "gaze_target_product_id": gaze_target_product_id,
                        "timestamp": timestamp.isoformat()
                    })

            # 5. Detect PICKUP/RETURN interactions
            interaction_events = interaction_detector.detect_interactions(
                shopper_tracks, product_dets, hand_dets
            )
            
            for event in interaction_events:
                session_track_id = event["session_id"]
                if session_track_id in active_sessions:
                    s_info = active_sessions[session_track_id]
                    db_session_id = s_info["db_id"]
                    
                    # Log interaction in PostgreSQL
                    db_interaction = ProductInteraction(
                        session_id=db_session_id,
                        product_id=event["product_id"],
                        shelf_id=event["shelf_id"],
                        timestamp=timestamp,
                        interaction_type=event["type"],
                        duration_seconds=2.0
                    )
                    db.add(db_interaction)
                    db.commit()
                    
                    # Publish event to Kafka
                    publish_to_kafka(settings.KAFKA_TELEMETRY_TOPIC, {
                        "event": "product_interaction",
                        "session_uuid": s_info["uuid"],
                        "product_id": event["product_id"],
                        "shelf_id": event["shelf_id"],
                        "type": event["type"].value,
                        "timestamp": timestamp.isoformat()
                    })
            
            # 6. Check for track exits
            current_track_ids = set(shopper["id"] for shopper in shopper_tracks)
            exited_track_ids = set(active_sessions.keys()) - current_track_ids
            
            for track_id in exited_track_ids:
                s_info = active_sessions[track_id]
                session_uuid = s_info["uuid"]
                db_session_id = s_info["db_id"]
                
                # Check for remaining held items -> PURCHASE
                purchase_events = interaction_detector.handle_session_exit(track_id)
                for pe in purchase_events:
                    db_interaction = ProductInteraction(
                        session_id=db_session_id,
                        product_id=pe["product_id"],
                        shelf_id=pe["shelf_id"],
                        timestamp=timestamp,
                        interaction_type=pe["type"],
                        duration_seconds=0.0
                    )
                    db.add(db_interaction)
                    db.commit()
                    
                    publish_to_kafka(settings.KAFKA_TELEMETRY_TOPIC, {
                        "event": "product_interaction",
                        "session_uuid": session_uuid,
                        "product_id": pe["product_id"],
                        "shelf_id": pe["shelf_id"],
                        "type": pe["type"].value,
                        "timestamp": timestamp.isoformat()
                    })
                
                # Update exit timestamp in PostgreSQL
                db_sess = db.query(ShopperSession).filter(ShopperSession.id == db_session_id).first()
                if db_sess:
                    db_sess.end_time = timestamp
                    db.commit()
                    
                    try:
                        from app.ai.feature_extractor import SessionFeatureExtractor
                        SessionFeatureExtractor.classify_and_update_session(db, session_uuid)
                    except Exception as e:
                        print(f"Error classifying session {session_uuid} on exit: {e}")
                
                publish_to_kafka(settings.KAFKA_ALERT_TOPIC, {
                    "event": "shopper_exit",
                    "session_uuid": session_uuid,
                    "timestamp": timestamp.isoformat(),
                    "store_id": store_id
                })
                
                # Remove session from Redis occupancy Set
                try:
                    redis_client.srem(f"store:{store_id}:occupancy", session_uuid)
                    redis_client.set(f"store:{store_id}:occupancy_count", str(redis_client.scard(f"store:{store_id}:occupancy")))
                except Exception:
                    pass
                
                del active_sessions[track_id]
                
            frame_idx += 1
            
        if not use_simulation:
            cap.release()
            
        return {
            "status": "success",
            "processed_frames": frame_idx,
            "detected_sessions": len(active_sessions)
        }
    finally:
        db.close()
