import os
import pickle
import numpy as np
from typing import List, Dict, Any
from sklearn.tree import DecisionTreeRegressor

MODEL_PATH = "static/models/recommendation_model.pkl"
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

class ShelfLayoutScorer:
    def __init__(self):
        self.model = None
        self._load_or_train()

    def _load_or_train(self):
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    self.model = pickle.load(f)
                print("Shelf layout scorer loaded from disk.")
                return
            except Exception as e:
                print(f"Failed to load layout scorer model: {e}. Re-training...")
        
        self.train_default_model()

    def train_default_model(self):
        """
        Trains a Decision Tree Regressor with default shelf statistics data.
        Features vector: [traffic_density, attention_duration, pickup_rate, conversion_rate, price_margin]
        Target: shelf_score (0.0 to 1.0, representing layout effectiveness)
        """
        print("Training shelf layout scorer default model...")
        
        # Seed training dataset
        X = np.array([
            # Traffic, Attention(s), Pickup%, Conversion%, PriceMargin%
            [0.9, 1200, 0.45, 0.30, 0.25],  # High traffic, high attention, high conversion -> High Score
            [0.8, 1500, 0.10, 0.02, 0.40],  # High traffic, high attention, low conversion -> Medium/Low Score (bottleneck/poor placement)
            [0.2, 100,  0.05, 0.01, 0.15],  # Low traffic, low attention, low conversion -> Low Score (Dead zone)
            [0.5, 600,  0.35, 0.20, 0.30],  # Balanced -> Medium Score
            [0.4, 800,  0.60, 0.50, 0.10],  # Medium traffic, high conversion, low margin -> Medium/High Score
            [0.95, 1800, 0.50, 0.35, 0.22], # High-performing layout -> High Score
            [0.15, 80,   0.02, 0.00, 0.50], # Extreme dead zone -> Low Score
            [0.6, 900,   0.25, 0.15, 0.35], # Average shelf -> Medium Score
        ])
        
        y = np.array([0.92, 0.45, 0.12, 0.65, 0.78, 0.95, 0.08, 0.58])
        
        self.model = DecisionTreeRegressor(max_depth=3, random_state=42)
        self.model.fit(X, y)
        
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.model, f)
        print("Shelf layout scorer model trained and saved successfully.")

    def score_shelf(self, features: List[float]) -> float:
        """
        Calculates effectiveness score for a shelf based on performance metrics.
        """
        if self.model is None:
            return 0.5
        x_in = np.array([features])
        return float(self.model.predict(x_in)[0])

    def generate_recommendations(
        self,
        shelf_name: str,
        features: List[float]
    ) -> Dict[str, Any]:
        """
        Analyzes features and returns structured recommendations.
        features: [traffic_density, attention_duration, pickup_rate, conversion_rate, price_margin]
        """
        score = self.score_shelf(features)
        traffic, attention, pickup, conversion, margin = features
        
        recommendations = []
        reason = ""
        potential_revenue = 0.0
        
        if traffic > 0.7 and conversion < 0.05:
            # High Traffic, Low Conversion (Dead Shelf Bottleneck)
            reason = f"Shelf '{shelf_name}' experiences high foot traffic but very low sales conversion."
            recommendations.append("Swap items with high-converting impulse buying products.")
            recommendations.append("Apply a promotional discount to attract attention to this area.")
            potential_revenue = 1500.0
        elif traffic < 0.3 and conversion < 0.05:
            # Low Traffic, Low Conversion (Dead Zone)
            reason = f"Shelf '{shelf_name}' lies in a retail dead zone with minimal shopper presence."
            recommendations.append("Relocate promotional display stands closer to the main entrance walkway.")
            recommendations.append("Adjust lighting or add eye-catching brand signage.")
            potential_revenue = 800.0
        elif attention > 1000 and pickup < 0.2:
            # High Attention, Low Pickup (Pricing/Packaging bottleneck)
            reason = f"Shoppers look at shelf '{shelf_name}' for extended periods but rarely pick up items."
            recommendations.append("Evaluate price competitiveness of products on this shelf.")
            recommendations.append("Verify product face alignment and check packaging cleanliness.")
            potential_revenue = 1200.0
        else:
            # High/Healthy Conversion
            reason = f"Shelf '{shelf_name}' exhibits strong shopping conversions and dwell metrics."
            recommendations.append("Maintain layout current arrangement.")
            recommendations.append("Consider introducing higher-margin auxiliary items adjacent to this category.")
            potential_revenue = 500.0

        return {
            "shelf_name": shelf_name,
            "performance_score": round(score, 3),
            "reason": reason,
            "actionable_steps": recommendations,
            "potential_revenue_impact": potential_revenue
        }
    
# Global Instance
shelf_scorer = ShelfLayoutScorer()
behavior_classifier = None  # Lazy load in code if needed
