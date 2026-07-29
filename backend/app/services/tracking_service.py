import time
import random
import logging
from typing import Dict, Any, List
from ..core.redis import get_redis

logger = logging.getLogger(__name__)

# flag to enable/disable the simulation runner
_simulation_active = False


class ShopperSim:
    """
    Simulates an individual shopper's trajectory and state machine
    moving through a multi-zone store.
    """
    def __init__(self, shopper_id: int):
        self.shopper_id = f"Shopper #{shopper_id}"
        self.state = "SPAWNED"  # SPAWNED, SHOPPING, CHECKOUT, EXITED
        
        # Start at foyer (Zone 1)
        self.x = random.uniform(0.1, 0.9)
        self.y = 0.0
        self.zone = "Entrance Foyer"
        self.camera_id = 1
        
        # Movement physics
        self.speed = random.uniform(0.015, 0.03)
        self.target_x = self.x
        self.target_y = random.uniform(0.15, 0.22)
        self.dwell_time = 0.0
        self.dwell_timer_start = 0.0
        
        # Interactions
        self.last_interaction_time = time.time()
        self.interaction_cooldown = random.uniform(5.0, 10.0)

    def update(self) -> Dict[str, Any]:
        """Update physics and return log dictionary if active"""
        now = time.time()
        
        # State: SPAWNED (Entrance Foyer, Camera 1)
        if self.state == "SPAWNED":
            self.zone = "Entrance Foyer"
            self.camera_id = 1
            self._move_towards_target()
            if self._reached_target():
                # Transition to shopping
                self.state = "SHOPPING"
                self.camera_id = random.choice([2, 3])
                self.x = random.uniform(0.1, 0.9)
                self.y = 0.25
                self._choose_shopping_target()
                
        # State: SHOPPING (Product Aisle, Camera 2 / 3)
        elif self.state == "SHOPPING":
            self.zone = "Main Product Aisle"
            # Decide camera based on location
            self.camera_id = 2 if self.x < 0.5 else 3
            
            if self.dwell_time > 0:
                if now - self.dwell_timer_start >= self.dwell_time:
                    self.dwell_time = 0.0
                    self._choose_shopping_target()
            else:
                self._move_towards_target()
                if self._reached_target():
                    # Check if ready to checkout or keep shopping
                    if random.random() < 0.25:
                        self.state = "CHECKOUT"
                        self.camera_id = 4
                        self.target_x = random.choice([0.3, 0.7])  # Checkout lanes
                        self.target_y = 0.85
                    else:
                        # Dwell at shelf
                        self.dwell_time = random.uniform(2.0, 5.0)
                        self.dwell_timer_start = now
                        
        # State: CHECKOUT (Checkout Lanes, Camera 4)
        elif self.state == "CHECKOUT":
            self.zone = "Checkout Lanes"
            self.camera_id = 4
            self._move_towards_target()
            if self._reached_target():
                # Dwell at checkout counter
                self.state = "EXITING"
                self.dwell_time = random.uniform(4.0, 8.0)
                self.dwell_timer_start = now
                
        # State: EXITING
        elif self.state == "EXITING":
            self.zone = "Checkout Lanes"
            self.camera_id = 4
            if now - self.dwell_timer_start >= self.dwell_time:
                self.state = "EXITED"
                self.y = 1.0
                
        # Check for interaction event (Gaze/Product Pick)
        alert_event = None
        if self.state == "SHOPPING" and self.dwell_time > 0:
            if now - self.last_interaction_time > self.interaction_cooldown:
                self.last_interaction_time = now
                self.interaction_cooldown = random.uniform(10.0, 18.0)
                # 35% chance of picking product, 65% gaze interaction
                event_type = "product_interaction" if random.random() < 0.35 else "gaze_shelf"
                alert_event = {
                    "event_type": event_type,
                    "shopper_id": self.shopper_id,
                    "camera_id": self.camera_id,
                    "zone": self.zone,
                    "x": round(self.x, 3),
                    "y": round(self.y, 3),
                    "timestamp": now
                }
                
        return {
            "shopper_id": self.shopper_id,
            "state": self.state,
            "camera_id": self.camera_id,
            "zone": self.zone,
            "x": round(self.x, 3),
            "y": round(self.y, 3),
            "alert": alert_event
        }

    def _move_towards_target(self):
        dx = self.target_x - self.x
        dy = self.target_y - self.y
        dist = (dx**2 + dy**2)**0.5
        if dist > 0.02:
            self.x += (dx / dist) * self.speed
            self.y += (dy / dist) * self.speed
        else:
            self.x = self.target_x
            self.y = self.target_y

    def _reached_target(self) -> bool:
        return abs(self.x - self.target_x) < 0.03 and abs(self.y - self.target_y) < 0.03

    def _choose_shopping_target(self):
        self.target_x = random.uniform(0.1, 0.9)
        self.target_y = random.uniform(0.28, 0.70)
        self.speed = random.uniform(0.01, 0.02)


class TrackingService:
    """
    Simulation coordinator that tracks active virtual shoppers, updates
    positions, logs tracking streams, and publishes updates via Redis.
    """
    def __init__(self):
        self.shoppers: List[ShopperSim] = []
        self.next_shopper_id = 101
        self.redis = get_redis()
        
    def step(self, store_id: int) -> Dict[str, Any]:
        """Perform one simulation step, update shoppers, stream data to Redis"""
        # Spawning mechanism: keep around 3 to 7 active shoppers
        active_shoppers = [s for s in self.shoppers if s.state != "EXITED"]
        if len(active_shoppers) < 5 and random.random() < 0.3:
            # Spawn a new shopper
            new_shopper = ShopperSim(self.next_shopper_id)
            self.shoppers.append(new_shopper)
            self.next_shopper_id += 1
            active_shoppers.append(new_shopper)
            
        logs = []
        alerts = []
        
        # Update shoppers
        for shopper in self.shoppers:
            if shopper.state == "EXITED":
                continue
                
            sh_data = shopper.update()
            
            # If shopper just exited, we skip logging them
            if sh_data["state"] == "EXITED":
                continue
                
            # Log coordinate stream to Redis Streams
            log_fields = {
                "store_id": str(store_id),
                "camera_id": str(sh_data["camera_id"]),
                "shopper_id": sh_data["shopper_id"],
                "x_coord": str(sh_data["x"]),
                "y_coord": str(sh_data["y"]),
                "zone": sh_data["zone"],
                "timestamp": str(time.time())
            }
            
            # Send to Redis stream queue
            self.redis.xadd("coordinate_stream", log_fields)
            
            logs.append(sh_data)
            
            # Capture shelf alerts
            if sh_data["alert"]:
                alerts.append(sh_data["alert"])
                
        # Filter exited shoppers out from memory
        self.shoppers = [s for s in self.shoppers if s.state != "EXITED"]
        
        # Check for Checkout congestion anomaly (bottleneck alert)
        checkout_shoppers = sum(1 for s in self.shoppers if s.state in ["CHECKOUT", "EXITING"])
        if checkout_shoppers >= 3:
            alerts.append({
                "event_type": "checkout_congestion",
                "shopper_id": "System Alert",
                "camera_id": 4,
                "zone": "Checkout Lanes",
                "message": f"Checkout lane queue bottleneck: {checkout_shoppers} shoppers waiting.",
                "x": 0.5,
                "y": 0.9,
                "timestamp": time.time()
            })
            
        # Update current active store occupancy
        occupancy = len(self.shoppers)
        self.redis.hset("store_occupancy", str(store_id), str(occupancy))
        
        return {
            "store_id": store_id,
            "shoppers": logs,
            "alerts": alerts,
            "occupancy": occupancy
        }
