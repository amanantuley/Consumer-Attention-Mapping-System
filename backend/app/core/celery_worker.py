from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "cams_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Optional configurations
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="app.core.celery_worker.process_video_task")
def process_video_task(camera_id: int, file_path: str):
    """
    Background worker task to process uploaded videos using the AI Computer Vision pipeline.
    """
    # Import inside task to prevent circular imports during start up
    from app.ai.pipeline import process_video_stream
    
    print(f"Starting async processing for camera {camera_id} with video {file_path}")
    result = process_video_stream(camera_id, file_path)
    print(f"Finished processing camera {camera_id}: {result}")
    return result
