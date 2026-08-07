from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.coordinate_log import CoordinateLog
from ..models.zone import Zone


def _normalize_time_window(start: Optional[datetime], end: Optional[datetime]) -> (datetime, datetime):
    if end is None:
        end = datetime.now(timezone.utc)
    if start is None:
        start = end - timedelta(hours=6)
    return start, end


class AnalyticsService:
    @staticmethod
    def _get_store_logs(db: Session, store_id: int, start: Optional[datetime], end: Optional[datetime]):
        start, end = _normalize_time_window(start, end)
        return (
            db.query(CoordinateLog)
            .filter(CoordinateLog.store_id == store_id)
            .filter(CoordinateLog.timestamp >= start)
            .filter(CoordinateLog.timestamp <= end)
            .order_by(CoordinateLog.shopper_id, CoordinateLog.timestamp)
        )

    @staticmethod
    def get_summary(db: Session, store_id: int, start: Optional[datetime], end: Optional[datetime]) -> Dict[str, object]:
        logs = AnalyticsService._get_store_logs(db, store_id, start, end).all()
        total_records = len(logs)
        unique_shop_ids = set(log.shopper_id for log in logs)
        total_shoppers = len(unique_shop_ids)

        dwell_data = AnalyticsService.get_dwell_by_zone(db, store_id, start, end)
        average_dwell_seconds = 0.0
        if dwell_data:
            average_dwell_seconds = sum(entry["average_dwell_seconds"] for entry in dwell_data) / len(dwell_data)

        zone_counts = {}
        for log in logs:
            zone_counts[log.zone] = zone_counts.get(log.zone, 0) + 1

        top_zone = max(zone_counts, key=zone_counts.get) if zone_counts else "N/A"
        recommendations = AnalyticsService.get_recommendations(db, store_id, start, end)

        return {
            "store_id": store_id,
            "total_shoppers": total_shoppers,
            "total_records": total_records,
            "total_zones": len(zone_counts),
            "average_dwell_seconds": round(average_dwell_seconds, 1),
            "top_zone": top_zone,
            "recommendations_count": len(recommendations),
        }

    @staticmethod
    def get_dwell_by_zone(db: Session, store_id: int, start: Optional[datetime], end: Optional[datetime]) -> List[Dict[str, object]]:
        logs = AnalyticsService._get_store_logs(db, store_id, start, end).all()
        zone_stats: Dict[str, Dict[str, object]] = {}
        prev_key = None
        segment_start = None
        prev_ts = None

        for log in logs:
            current_key = (log.shopper_id, log.zone)
            if prev_key == current_key and prev_ts is not None:
                gap = (log.timestamp - prev_ts).total_seconds()
                if gap <= 10:
                    segment_duration = gap
                else:
                    segment_duration = 0.0
            else:
                segment_duration = 0.0
                segment_start = log.timestamp

            if prev_key == current_key and segment_start is not None and segment_duration > 0:
                zone_record = zone_stats.setdefault(log.zone, {
                    "zone": log.zone,
                    "total_dwell_seconds": 0.0,
                    "session_count": 0,
                    "shopper_set": set(),
                })
                zone_record["total_dwell_seconds"] += segment_duration
                zone_record["session_count"] += 1
                zone_record["shopper_set"].add(log.shopper_id)

            prev_key = current_key
            prev_ts = log.timestamp

        results = []
        for zone, data in zone_stats.items():
            shopper_count = len(data["shopper_set"])
            average_dwell_seconds = data["total_dwell_seconds"] / shopper_count if shopper_count > 0 else 0.0
            results.append({
                "zone": zone,
                "total_dwell_seconds": round(data["total_dwell_seconds"], 1),
                "average_dwell_seconds": round(average_dwell_seconds, 1),
                "unique_shoppers": shopper_count,
            })

        return results

    @staticmethod
    def build_trajectories(db: Session, store_id: int, start: Optional[datetime], end: Optional[datetime]) -> List[Dict[str, object]]:
        logs = AnalyticsService._get_store_logs(db, store_id, start, end).all()
        trajectories: Dict[str, List[Dict[str, object]]] = {}
        for log in logs:
            trajectories.setdefault(log.shopper_id, []).append({
                "x": log.x_coord,
                "y": log.y_coord,
                "timestamp": log.timestamp.isoformat(),
            })

        return [{"shopper_id": shopper_id, "path": path} for shopper_id, path in trajectories.items()]

    @staticmethod
    def get_attractiveness_scores(db: Session, store_id: int, start: Optional[datetime], end: Optional[datetime]) -> List[Dict[str, object]]:
        dwell_data = AnalyticsService.get_dwell_by_zone(db, store_id, start, end)
        zone_counts = {}
        logs = AnalyticsService._get_store_logs(db, store_id, start, end).all()

        for log in logs:
            zone_counts[log.zone] = zone_counts.get(log.zone, 0) + 1

        scores = []
        for entry in dwell_data:
            zone = entry["zone"]
            traffic = zone_counts.get(zone, 0)
            dwell = entry["average_dwell_seconds"]
            interaction_count = min(entry["unique_shoppers"], int(dwell // 2 + 1))
            stockout_penalty = 0
            score = round(0.45 * traffic + 0.35 * dwell + 0.2 * interaction_count - stockout_penalty, 1)
            scores.append({
                "zone": zone,
                "traffic_score": traffic,
                "dwell_score": dwell,
                "interaction_count": interaction_count,
                "attractiveness_score": score,
            })

        return sorted(scores, key=lambda item: item["attractiveness_score"], reverse=True)

    @staticmethod
    def get_recommendations(db: Session, store_id: int, start: Optional[datetime], end: Optional[datetime]) -> List[Dict[str, object]]:
        attractiveness = AnalyticsService.get_attractiveness_scores(db, store_id, start, end)
        recommendations = []
        if not attractiveness:
            return recommendations

        average_score = sum(item["attractiveness_score"] for item in attractiveness) / len(attractiveness)
        for item in attractiveness:
            zone = item["zone"]
            score = item["attractiveness_score"]
            traffic = item["traffic_score"]
            dwell = item["dwell_score"]
            if traffic >= 30 and dwell <= 8:
                recommendations.append({
                    "zone": zone,
                    "issue": "High traffic but low dwell.",
                    "action": "Improve visual merchandising or pricing signs to encourage shoppers to stop.",
                    "confidence": 0.88,
                })
            elif traffic <= 12 and dwell <= 6:
                recommendations.append({
                    "zone": zone,
                    "issue": "Dead zone detected.",
                    "action": "Consider moving anchor products or promotional displays here.",
                    "confidence": 0.82,
                })
            elif dwell >= 15 and score < average_score:
                recommendations.append({
                    "zone": zone,
                    "issue": "High dwell but weak attractiveness.",
                    "action": "Review pricing, product messaging, or shelf stock for this zone.",
                    "confidence": 0.91,
                })

        if not recommendations:
            recommendations.append({
                "zone": "Store-wide",
                "issue": "Overall attention indicators are balanced.",
                "action": "Continue optimizing product placement and monitor next time window.",
                "confidence": 0.68,
            })

        return recommendations

    @staticmethod
    def get_heatmap_points(db: Session, store_id: int, start: Optional[datetime], end: Optional[datetime], grid_size: int = 32) -> List[Dict[str, object]]:
        logs = AnalyticsService._get_store_logs(db, store_id, start, end).all()
        if not logs:
            return []

        x_values = [log.x_coord for log in logs]
        y_values = [log.y_coord for log in logs]
        x_min, x_max = min(x_values), max(x_values)
        y_min, y_max = min(y_values), max(y_values)
        x_range = x_max - x_min or 1.0
        y_range = y_max - y_min or 1.0

        grid: Dict[str, int] = {}
        for log in logs:
            x_index = int(((log.x_coord - x_min) / x_range) * (grid_size - 1))
            y_index = int(((log.y_coord - y_min) / y_range) * (grid_size - 1))
            key = f"{x_index}:{y_index}"
            grid[key] = grid.get(key, 0) + 1

        return [
            {"x": int(key.split(":")[0]), "y": int(key.split(":")[1]), "count": count}
            for key, count in grid.items()
        ]
