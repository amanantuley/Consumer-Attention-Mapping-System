# Consumer Attention Mapping System (CAMS)

Consumer Attention Mapping System (CAMS) is a production-grade, AI-powered Retail Intelligence Platform. Using state-of-the-art Computer Vision, Deep Learning, and Behavioral Analytics, it tracks and analyzes shopper behavior, physical movement paths, head pose rotations, eye gaze focuses, and shelf product interactions in real-time.

---

## 1. System Architecture & Component Mapping

CAMS is structured as a scalable, containerized enterprise microservices application:

*   **Frontend**: Next.js 15 App Router interface styled with Tailwind CSS, using Zustand for global WebSocket telemetry buffering and Recharts for animated metrics.
*   **Backend**: FastAPI Python web server orchestrating JWT authorization, WebSocket stream forwarding, and model evaluation.
*   **Databases**: 
    *   **PostgreSQL (SQLAlchemy)**: Core relational data (stores, zones, shelves, products, camera metadata, shopper sessions, converted purchases, and layout recommendations).
    *   **MongoDB (Pymongo)**: High-frequency time-series coordinates (shopper movements, gaze vectors, grid occupancy counts).
    *   **Redis**: Celery async message broker, WebSocket state channel, and API cache.
*   **Streaming**: Apache Kafka topics distributing telemetry to offline consumers.

---

## 2. Deep Dive: AI Pipeline & Mathematical Intuition

```
[ CCTV Stream ] ──> [ Preprocessing ] ──> [ YOLOv11 Shoppers/Products ]
                                                    │
                                                    ▼
[ MediaPipe Gaze & FaceMesh ] ◄── [ SORT/ByteTrack Multi-Object Tracking ]
              │
              ▼
[ Gaze Ray-Shelf Intersect ] ──> [ Hand-Product Collisions ] ──> [ Persona Classifiers ]
```

### Module 1: Preprocessing & Buffer Management
*   **Operation**: Reads CCTV frames via OpenCV `VideoCapture`. Adjusts image resolutions, normalizes color matrices, and maintains frame buffering to match pipeline FPS constraints.
*   **Math**: Normalizes image pixels $I_{norm} = \frac{I}{255.0}$ to stabilize gradients during deep network backprop.

### Module 2: Person & SKU Detection (YOLOv11)
*   **Operation**: Employs YOLO model backbones to extract bounding box coordinates for shoppers (`person`) and shelf products (`bottle`, `cup`, etc.).
*   **Architecture**: CSPDarknet53 feature extraction with a Path Aggregation Network (PANet) neck and a decoupled anchor-free head.
*   **Loss Formulation**: Complete IoU (CIoU) Loss for box regression and Binary Cross-Entropy (BCE) for class mapping.
    $$\mathcal{L}_{CIoU} = 1 - IoU + \frac{\rho^2(b, b^{gt})}{c^2} + \alpha v$$
    where $\rho(\cdot)$ is Euclidean distance of centers, $c$ is diagonal of minimum enclosing box, and $v$ measures aspect ratio consistency.

### Module 3: Multi-Object Tracking (SORT / ByteTrack)
*   **Operation**: Binds shopper bounding boxes across consecutive frames using Kalman filter velocity estimators and Hungarian matching.
*   **Math**: State vector modeled as $x = [u, v, s, r, \dot{u}, \dot{v}, \dot{s}]^T$ representing bounding box horizontal/vertical centroids, area scale, aspect ratio, and linear velocities.

### Module 5 & 6: Head Pose & Eye Gaze Estimation (MediaPipe FaceMesh)
*   **Operation**: FaceMesh extracts 3d landmarks. Perspective-n-Point (solvePnP) projects 3D model points to 2D screen coordinates to determine Yaw, Pitch, and Roll. Gaze direction is computed from eye/iris landmark vectors.
*   **PnP Projection Math**:
    $$\mathbf{p} = \mathbf{K} [\mathbf{R} | \mathbf{t}] \mathbf{P}$$
    where $\mathbf{P}$ is the 3D landmark, $\mathbf{p}$ is the 2D projected pixel, $\mathbf{K}$ is camera intrinsics, and $\mathbf{R}$ is the head rotation matrix.

### Module 9: Behavioral Classifier (Random Forest)
*   **Operation**: Classifies shopping sessions into profiles: *Explorer, Quick Buyer, Impulse Buyer, Comparison Shopper, Brand Loyal*.
*   **Features**: `[dwell_time, zones_visited, gaze_focus_duration, products_picked, products_returned, products_purchased]`

### Module 11: Machine Learning Recommendation Engine
*   **Operation**: Scikit-Learn/Decision Tree regressor predicting layout optimization scores ($y_{score} \in [0, 1]$). Identifies dead shelves (high traffic, low purchase) and packaging bottlenecks (high gaze, low pickup).

---

## 3. Quick Start & Execution

### Prerequisites
*   Docker & Docker Compose
*   Python 3.12+ (if running bare-metal)

### Running with Docker Compose (Recommended)
Build and run the entire CAMS platform including PostgreSQL, MongoDB, Redis, Kafka, Nginx, the Next.js UI, and the FastAPI backend:

```bash
docker-compose up --build
```

### Running Backend Locally
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Initialize virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   .venv/Scripts/pip install -r requirements.txt
   ```
3. Run the FastAPI application:
   ```bash
   .venv/Scripts/uvicorn app.main:app --reload
   ```

### Running Frontend Locally
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the web interface at `http://localhost:3000` (or `http://localhost` if running through Nginx proxy).

### Running Unit and Integration Tests
Validate API routers, JWT logins, and behavioral predictions using `pytest` inside the backend directory:

```bash
.venv/Scripts/pytest
```