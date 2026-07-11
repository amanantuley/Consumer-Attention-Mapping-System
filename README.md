# 🛒 Consumer Attention Mapping System (CAMS)

> **AI-Powered Retail Intelligence Platform for Real-Time Consumer Behavior Analytics**

![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-NoSQL-green)
![Redis](https://img.shields.io/badge/Redis-Cache-red)
![Kafka](https://img.shields.io/badge/Kafka-Streaming-black)
![YOLOv11](https://img.shields.io/badge/YOLOv11-ComputerVision-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

# 🚀 Overview

**Consumer Attention Mapping System (CAMS)** is a production-grade AI-powered **Retail Intelligence Platform** that analyzes customer movement, gaze direction, shelf interaction, and purchasing behavior using **Computer Vision, Deep Learning, Behavioral Analytics, and Real-Time Data Streaming**.

The system transforms ordinary CCTV footage into actionable retail intelligence, enabling stores to optimize shelf layouts, improve customer engagement, and increase sales through AI-driven insights.

---

# 🎯 Key Features

- 👥 Real-Time Shopper Detection
- 📍 Multi-Object Tracking
- 👀 Head Pose & Eye Gaze Estimation
- 🛍️ Product Interaction Detection
- 📊 Customer Heatmaps
- 📈 Shopper Journey Analytics
- 🧠 Behavioral Persona Classification
- 📦 Shelf Performance Analytics
- 🤖 AI Layout Recommendation Engine
- 📡 Real-Time Dashboard
- 🔐 Secure JWT Authentication
- ⚡ Kafka Streaming Architecture

---

# 🏗️ System Architecture

```
                    CCTV Cameras
                          │
                          ▼
                Frame Preprocessing
                          │
                          ▼
             YOLOv11 Object Detection
                          │
                          ▼
          ByteTrack / SORT Tracking
                          │
                          ▼
        FaceMesh + Head Pose Estimation
                          │
                          ▼
            Eye Gaze Direction Mapping
                          │
                          ▼
          Product Interaction Detection
                          │
                          ▼
      Shopper Behavior Classification
                          │
                          ▼
        Recommendation & Analytics
                          │
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
    PostgreSQL        MongoDB          Kafka
          │               │                │
          └───────────────┼────────────────┘
                          ▼
                 FastAPI Backend API
                          │
                          ▼
               Next.js Dashboard UI
```

---

# 🧠 AI Pipeline

```
CCTV Video
      │
      ▼
Frame Preprocessing
      │
      ▼
YOLOv11 Detection
      │
      ▼
ByteTrack Tracking
      │
      ▼
MediaPipe FaceMesh
      │
      ▼
Head Pose Estimation
      │
      ▼
Eye Gaze Estimation
      │
      ▼
Shelf Mapping
      │
      ▼
Hand Detection
      │
      ▼
Product Interaction
      │
      ▼
Behavior Classification
      │
      ▼
Recommendation Engine
```

---

# 🧩 Core AI Modules

## 👤 Shopper Detection

- YOLOv11
- Real-time Person Detection
- Product Detection
- Bounding Box Regression
- Confidence Scoring

---

## 🎯 Multi Object Tracking

- ByteTrack
- SORT
- Kalman Filter
- Hungarian Matching

Tracks shoppers across multiple camera frames while maintaining unique identities.

---

## 👀 Head Pose Estimation

Uses

- MediaPipe FaceMesh
- solvePnP
- OpenCV

Outputs

- Yaw
- Pitch
- Roll

---

## 👁 Eye Gaze Estimation

Determines

- Looking Left
- Looking Right
- Looking Up
- Looking Down
- Shelf Focus

Maps gaze vectors onto retail shelves.

---

## ✋ Product Interaction Detection

Detects

- Pick-up
- Put-back
- Hold Time
- Shelf Touch
- Purchase Intent

---

## 🧠 Behavioral Analytics

Classifies customers into

- Explorer
- Quick Buyer
- Comparison Shopper
- Brand Loyal
- Impulse Buyer

Features Used

- Dwell Time
- Shelf Visits
- Gaze Duration
- Products Picked
- Products Returned
- Purchase Count

---

## 📈 Recommendation Engine

Automatically identifies

- Dead Shelves
- High Attention / Low Conversion Products
- Packaging Problems
- Shelf Rearrangement Suggestions

---

# 🛠 Technology Stack

## Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Zustand
- Recharts

---

## Backend

- FastAPI
- SQLAlchemy
- JWT Authentication
- Pydantic
- Celery

---

## AI & Machine Learning

- YOLOv11
- OpenCV
- MediaPipe
- Scikit-Learn
- NumPy
- Pandas
- PyTorch

---

## Databases

- PostgreSQL
- MongoDB
- Redis

---

## Streaming

- Apache Kafka
- WebSockets

---

## DevOps

- Docker
- Docker Compose
- Nginx
- GitHub Actions

---

# 📂 Project Structure

```
CAMS
│
├── frontend
│
├── backend
│   ├── api
│   ├── auth
│   ├── database
│   ├── services
│   ├── models
│   ├── routers
│   └── utils
│
├── ai
│   ├── detection
│   ├── tracking
│   ├── gaze
│   ├── hand_detection
│   ├── recommendation
│   ├── behavior
│   └── models
│
├── kafka
├── docker
├── nginx
├── datasets
├── docs
├── tests
└── scripts
```

---

# 🚀 Quick Start

## Clone Repository

```bash
git clone https://github.com/yourusername/CAMS.git

cd CAMS
```

---

## Run Entire Platform

```bash
docker-compose up --build
```

---

## Backend

```bash
cd backend

python -m venv .venv

.venv/Scripts/pip install -r requirements.txt

.venv/Scripts/uvicorn app.main:app --reload
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🧪 Testing

```bash
pytest
```

---

# 📊 Dashboard

The dashboard provides

- Live CCTV Streams
- Shopper Heatmaps
- Zone Occupancy
- Product Engagement
- Shelf Analytics
- Shopper Personas
- AI Recommendations
- Conversion Statistics

---

# 🔒 Security

- JWT Authentication
- Role-Based Access Control
- HTTPS
- Secure APIs
- Input Validation
- WebSocket Authentication

---

# 📈 Future Enhancements

- Multi-Camera Tracking
- Facial Age & Gender Estimation
- Emotion Recognition
- Queue Analytics
- Inventory Monitoring
- Retail Digital Twin
- LLM-powered Retail Insights
- Mobile Dashboard
- Cloud Deployment (AWS)

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

---

# 📜 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

**Aman Antuley**

Software Engineer • AI Engineer • Computer Vision Developer • Cloud & DevOps Enthusiast

- GitHub: https://github.com/amanantuley
- LinkedIn: https://www.linkedin.com/in/aman-antuley-8974ab26a/

---

⭐ If you found this project useful, please consider giving it a **Star**!

**Transforming Retail with Artificial Intelligence & Computer Vision.**
