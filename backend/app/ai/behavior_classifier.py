import os
import pickle
import numpy as np
from typing import List, Dict, Any
from sklearn.ensemble import RandomForestClassifier

MODEL_PATH = "static/models/behavior_classifier.pkl"
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

class ShopperBehaviorClassifier:
    def __init__(self):
        self.classes = ["Explorer", "Quick Buyer", "Impulse Buyer", "Comparison Shopper", "Brand Loyal"]
        self.model = None
        self._load_or_train()

    def _load_or_train(self):
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    self.model = pickle.load(f)
                print("Behavior classifier loaded from disk.")
                return
            except Exception as e:
                print(f"Failed to load behavior classifier: {e}. Re-training...")
        
        self.train_default_model()

    def train_default_model(self):
        """
        Trains a Random Forest classifier with default seed data representing retail patterns.
        Features vector: [dwell_time, zones_visited, gaze_focus_duration, products_picked, products_returned, products_purchased]
        """
        print("Training behavior classifier default model...")
        
        # Seed training dataset
        X = np.array([
            # Dwell, Zones, Gaze, Picked, Returned, Purchased
            [600,  5, 300, 4, 2, 2],  # Explorer (walks a lot, looks, picks, buys some)
            [120,  2, 45,  1, 0, 1],  # Quick Buyer (low dwell, low zones, picks and buys immediately)
            [180,  3, 90,  3, 1, 2],  # Impulse Buyer (low dwell, high picks, buy)
            [900,  4, 450, 6, 4, 1],  # Comparison Shopper (high dwell, high gaze, high return rate)
            [240,  2, 120, 2, 0, 2],  # Brand Loyal (knows what they want, medium dwell, buys)
            [720,  5, 350, 3, 2, 1],  # Explorer
            [90,   1, 30,  1, 0, 1],  # Quick Buyer
            [150,  2, 60,  2, 0, 2],  # Impulse Buyer
            [800,  4, 400, 5, 3, 2],  # Comparison Shopper
            [300,  2, 150, 1, 0, 1],  # Brand Loyal
        ])
        
        # 0: Explorer, 1: Quick Buyer, 2: Impulse Buyer, 3: Comparison Shopper, 4: Brand Loyal
        y = np.array([0, 1, 2, 3, 4, 0, 1, 2, 3, 4])
        
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.model.fit(X, y)
        
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.model, f)
        print("Behavior classifier trained and saved successfully.")

    def classify(self, features: List[float]) -> Dict[str, Any]:
        """
        Predicts behavioral class for a shopper.
        features: [dwell_time, zones_visited, gaze_focus_duration, products_picked, products_returned, products_purchased]
        """
        if self.model is None:
            return {"class": "Unknown", "probabilities": {}}
            
        x_in = np.array([features])
        class_idx = int(self.model.predict(x_in)[0])
        probabilities = self.model.predict_proba(x_in)[0]
        
        prob_dict = {self.classes[i]: float(probabilities[i]) for i in range(len(self.classes))}
        
        return {
            "class": self.classes[class_idx],
            "confidence": float(probabilities[class_idx]),
            "probabilities": prob_dict
        }
