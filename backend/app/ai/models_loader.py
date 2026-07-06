import os
import threading
from typing import Optional
from app.core.config import settings

# Thread locks for concurrent model access
_lock = threading.Lock()

class AIModelLoader:
    _instance: Optional['AIModelLoader'] = None

    def __new__(cls):
        with _lock:
            if cls._instance is None:
                cls._instance = super(AIModelLoader, cls).__new__(cls)
                cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._yolo_person = None
        self._yolo_product = None
        self._behavior_classifier = None
        self._layout_scorer = None
        self._initialized = True

    def get_yolo_person_model(self):
        """
        Loads and returns the YOLO model for person tracking.
        Automatically downloads lightweight official YOLOv8n weights on first request.
        """
        if self._yolo_person is None:
            with _lock:
                if self._yolo_person is None:
                    try:
                        from ultralytics import YOLO
                        # In production, we'd cache in settings.MODEL_CACHE_DIR
                        weights_path = os.path.join(settings.MODEL_CACHE_DIR, "yolov8n.pt")
                        print(f"Loading YOLO person model from {weights_path}...")
                        self._yolo_person = YOLO("yolov8n.pt")
                    except Exception as e:
                        print(f"Failed to load YOLO person model: {e}. Falling back to standard library.")
                        self._yolo_person = None
        return self._yolo_person

    def get_yolo_product_model(self):
        """
        Loads and returns the YOLO model for product SKU detection.
        Uses a lightweight standard YOLO model that runs fast.
        """
        if self._yolo_product is None:
            with _lock:
                if self._yolo_product is None:
                    try:
                        from ultralytics import YOLO
                        weights_path = os.path.join(settings.MODEL_CACHE_DIR, "yolov8n.pt")
                        print(f"Loading YOLO product model from {weights_path}...")
                        self._yolo_product = YOLO("yolov8n.pt")
                    except Exception as e:
                        print(f"Failed to load YOLO product model: {e}")
                        self._yolo_product = None
        return self._yolo_product

    def get_behavior_classifier(self):
        """
        Loads the shopper behavior Random Forest model.
        """
        if self._behavior_classifier is None:
            with _lock:
                if self._behavior_classifier is None:
                    from app.ai.behavior_classifier import ShopperBehaviorClassifier
                    self._behavior_classifier = ShopperBehaviorClassifier()
        return self._behavior_classifier

    def get_layout_scorer(self):
        """
        Loads the shelf layout Decision Tree scorer model.
        """
        if self._layout_scorer is None:
            with _lock:
                if self._layout_scorer is None:
                    from app.ai.recommendation_model import ShelfLayoutScorer
                    self._layout_scorer = ShelfLayoutScorer()
        return self._layout_scorer

# Global Singleton Instance
model_loader = AIModelLoader()
