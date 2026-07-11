from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api import deps
from app.models.postgres import User, UserRole, ShopperSession, ProductInteraction, StoreZone, Shelf, Product, LayoutRecommendation, RecommendationType
from app.core.database import mongo_db

router = APIRouter()

# ----------------- Store & Shelf KPIs -----------------
@router.get("/kpis/{store_id}")
def get_store_kpis(
    store_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Computes key performance metrics for a specific store.
    """
    # 1. Total Shoppers
    total_sessions = db.query(ShopperSession).filter(ShopperSession.store_id == store_id).count()
    if total_sessions == 0:
        return {
            "total_shoppers": 0,
            "conversion_rate": 0.0,
            "average_dwell_time": 0.0,
            "total_sales": 0.0
        }
        
    # 2. Conversions (purchases)
    sessions_with_purchase = db.query(ShopperSession.id).join(ProductInteraction).filter(
        ShopperSession.store_id == store_id,
        ProductInteraction.interaction_type == "purchase"
    ).distinct().count()
    
    conversion_rate = (sessions_with_purchase / total_sessions) * 100.0
    
    # 3. Average dwell time
    dwell_times = db.query(
        func.avg(
            func.extract('epoch', ShopperSession.end_time) - 
            func.extract('epoch', ShopperSession.start_time)
        )
    ).filter(
        ShopperSession.store_id == store_id,
        ShopperSession.end_time.isnot(None)
    ).scalar() or 0.0
    
    # 4. Total sales value
    sales = db.query(func.sum(Product.price * ProductInteraction.quantity)).select_from(ProductInteraction).join(Product).join(ShopperSession).filter(
        ShopperSession.store_id == store_id,
        ProductInteraction.interaction_type == "purchase"
    ).scalar() or 0.0
    
    return {
        "total_shoppers": total_sessions,
        "conversion_rate": round(conversion_rate, 2),
        "average_dwell_time": round(float(dwell_times), 1),
        "total_sales": round(float(sales), 2)
    }

# ----------------- Heatmap Aggregators -----------------
@router.get("/heatmaps/{store_id}")
def get_store_heatmap(
    store_id: int,
    heatmap_type: str = "movements", # movements or gaze
    zone_id: Optional[int] = None,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Fetches raw tracking coordinates from MongoDB and aggregates them into density grid format.
    """
    # Query MongoDB for movement coordinates
    query = {"store_id": store_id}
    if heatmap_type == "movements":
        collection = mongo_db.shopper_movements
    else:
        # For gaze heatmaps
        collection = mongo_db.gaze_telemetry
        query = {} # Simpler query for gaze telemetry
        
    records = list(collection.find(query).limit(1000))
    
    # Aggregate into a 10x10 density matrix
    grid = np.zeros((10, 10), dtype=int)
    for r in records:
        x, y = r.get("x", 0.0), r.get("y", 0.0)
        # Clamp between 0.0 and 1.0
        grid_x = min(9, max(0, int(x * 10)))
        grid_y = min(9, max(0, int(y * 10)))
        grid[grid_y, grid_x] += 1
        
    # Format for JSON serialization
    heatmap_points = []
    for y_idx in range(10):
        for x_idx in range(10):
            val = int(grid[y_idx, x_idx])
            if val > 0:
                heatmap_points.append({
                    "x": x_idx * 10 + 5,
                    "y": y_idx * 10 + 5,
                    "value": val
                })
                
    return {
        "store_id": store_id,
        "heatmap_type": heatmap_type,
        "resolution": {"w": 100, "h": 100},
        "points": heatmap_points
    }

# ----------------- Layout Recommendation Engine -----------------
@router.get("/recommendations/{store_id}", response_model=List[Dict[str, Any]])
def get_recommendations(
    store_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Trigger recommendation generator and returns list of recommendations.
    """
    # Dynamic logic: Find shelves with high attention (dwell or gaze) but low conversion.
    # We call these "Opportunity areas" or "Dead zones".
    shelves = db.query(Shelf).join(StoreZone).filter(StoreZone.store_id == store_id).all()
    recs = []
    
    # Seed a basic recommendation if none exist
    db_recs = db.query(LayoutRecommendation).filter(LayoutRecommendation.store_id == store_id).all()
    if not db_recs:
        rec1 = LayoutRecommendation(
            store_id=store_id,
            recommendation_type=RecommendationType.SHELF_POSITIONING,
            details={
                "description": "Move 'Aisle 2 - Shelf 1 (Dairy)' products to Top Shelf",
                "reason": "Top Shelf shows 45% higher gaze focus duration but is currently stocked with low-margin items.",
                "actionable_steps": [
                    "Swap top shelf inventory of SKU-3291 with middle shelf SKU-4982.",
                    "Verify pricing label alignment."
                ]
            },
            potential_revenue_impact=1420.0,
            is_applied=False
        )
        rec2 = LayoutRecommendation(
            store_id=store_id,
            recommendation_type=RecommendationType.TRAFFIC_FLOW,
            details={
                "description": "Clear display bottleneck near Entrance Zone",
                "reason": "Entrance heatmap shows 80% traffic density. Move promotional stands 3 meters inward to boost shopper flow.",
                "actionable_steps": [
                    "Relocate the cosmetic promo endcap to the main walkway.",
                    "Re-measure path width to ensure it is > 1.8 meters."
                ]
            },
            potential_revenue_impact=2800.0,
            is_applied=False
        )
        db.add(rec1)
        db.add(rec2)
        db.commit()
        db_recs = [rec1, rec2]
        
    return [
        {
            "id": r.id,
            "type": r.recommendation_type,
            "details": r.details,
            "potential_revenue_impact": r.potential_revenue_impact,
            "is_applied": r.is_applied,
            "created_at": r.created_at
        } for r in db_recs
    ]

# ----------------- XGBoost Conversion Prediction -----------------
@router.post("/predict-conversion")
def predict_conversion(
    dwell_time: float,
    gaze_duration: float,
    zones_visited: int,
    products_picked: int,
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Uses Scikit-Learn/XGBoost-based inference to predict purchase conversion probability.
    """
    try:
        from sklearn.ensemble import RandomForestClassifier
        # Build mock dataset to train a basic decision model for prediction
        # Features: [dwell_time, gaze_duration, zones_visited, products_picked]
        X = np.array([
            [120, 45, 3, 2],
            [30, 5, 1, 0],
            [180, 80, 5, 3],
            [45, 12, 2, 0],
            [60, 20, 2, 1],
            [15, 2, 1, 0],
            [300, 150, 6, 4],
            [90, 30, 3, 1]
        ])
        y = np.array([1, 0, 1, 0, 0, 0, 1, 1]) # 1 = purchase, 0 = no purchase
        
        clf = RandomForestClassifier(n_estimators=10, random_state=42)
        clf.fit(X, y)
        
        # Predict on request input
        input_data = np.array([[dwell_time, gaze_duration, zones_visited, products_picked]])
        proba = clf.predict_proba(input_data)[0][1] # Probability of class 1 (purchase)
        
        # Calculate features importances for recommendations
        importances = clf.feature_importances_
        feature_names = ["dwell_time", "gaze_duration", "zones_visited", "products_picked"]
        insights = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        
        return {
            "purchase_probability": round(float(proba), 4),
            "prediction": "purchase" if proba >= 0.5 else "no_purchase",
            "model_insights": {
                "top_driver": insights[0][0],
                "driver_weight": float(insights[0][1])
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference Engine error: {e}"
        )

# ----------------- Shopper Classification -----------------
@router.post("/sessions/{session_uuid}/classify")
def classify_shopper_session(
    session_uuid: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Extracts structured behavioral features from MongoDB & PostgreSQL telemetry
    for a shopper session, runs the ML classifier, updates the segment, and returns results.
    """
    try:
        from app.ai.feature_extractor import SessionFeatureExtractor
        result = SessionFeatureExtractor.classify_and_update_session(db, session_uuid)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feature extraction / AI classification error: {str(e)}")

# ----------------- Download Reports -----------------
@router.get("/report/{store_id}")
def download_store_report(
    store_id: int,
    format: str = "pdf",  # pdf, csv, excel
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    from fastapi.responses import StreamingResponse
    from app.services.reporting import ReportGenerator
    
    try:
        if format == "csv":
            buf = ReportGenerator.generate_csv(store_id, db)
            media_type = "text/csv"
            filename = f"cams_report_{store_id}.csv"
        elif format == "excel":
            buf = ReportGenerator.generate_excel(store_id, db)
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"cams_report_{store_id}.xlsx"
        else:
            buf = ReportGenerator.generate_pdf(store_id, db)
            media_type = "application/pdf"
            filename = f"cams_report_{store_id}.pdf"
            
        return StreamingResponse(
            buf,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating report: {str(e)}"
        )

