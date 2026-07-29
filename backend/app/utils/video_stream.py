import cv2
import logging
import time
from typing import Generator, Optional, Tuple, Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VideoStream:
    def __init__(self, source: str, resize_width: Optional[int] = None, resize_height: Optional[int] = None):
        """
        Initialize video stream
        :param source: 0 for webcam, RTSP URL, or MP4 file path
        :param resize_width: Optional width to resize frames
        :param resize_height: Optional height to resize frames
        """
        self.source = source
        self.resize_width = resize_width
        self.resize_height = resize_height
        self.cap = None
        self.start_time = None
        self.frame_count = 0

    def open(self) -> bool:
        """Open the video stream"""
        try:
            if self.source.isdigit():
                self.cap = cv2.VideoCapture(int(self.source))
            else:
                self.cap = cv2.VideoCapture(self.source)

            if not self.cap.isOpened():
                logger.error(f"Failed to open video stream: {self.source}")
                return False

            self.start_time = time.time()
            self.frame_count = 0
            logger.info(f"Opened video stream: {self.source}")
            return True
        except Exception as e:
            logger.error(f"Error opening video stream: {e}")
            return False

    def read_frame(self) -> Tuple[bool, Optional[bytes], Optional[int], Dict[str, any]]:
        """
        Read a single frame with metadata
        :return: (success, frame_bytes, frame_id, metadata)
        """
        if not self.cap or not self.cap.isOpened():
            return False, None, None, {}

        ret, frame = self.cap.read()
        if not ret:
            return False, None, None, {}

        frame_id = int(self.cap.get(cv2.CAP_PROP_POS_FRAMES))
        timestamp = time.time()
        self.frame_count += 1

        # Calculate FPS
        fps = 0.0
        if self.start_time:
            elapsed = timestamp - self.start_time
            if elapsed > 0:
                fps = self.frame_count / elapsed

        # Resize frame if needed
        original_height, original_width = frame.shape[:2]
        if self.resize_width and self.resize_height:
            frame = cv2.resize(frame, (self.resize_width, self.resize_height))
        elif self.resize_width:
            height = int(frame.shape[0] * (self.resize_width / frame.shape[1]))
            frame = cv2.resize(frame, (self.resize_width, height))
        elif self.resize_height:
            width = int(frame.shape[1] * (self.resize_height / frame.shape[0]))
            frame = cv2.resize(frame, (width, self.resize_height))

        # Get final frame dimensions
        final_height, final_width = frame.shape[:2]

        # Encode frame to JPEG
        _, buffer = cv2.imencode('.jpg', frame)

        # Metadata
        metadata = {
            "frame_id": frame_id,
            "timestamp": timestamp,
            "fps": round(fps, 2),
            "source": self.source,
            "original_resolution": {
                "width": original_width,
                "height": original_height
            },
            "output_resolution": {
                "width": final_width,
                "height": final_height
            }
        }

        # Log frame metadata periodically (every 30 frames to avoid spam)
        if frame_id % 30 == 0:
            logger.info(f"Frame metadata: {metadata}")

        return True, buffer.tobytes(), frame_id, metadata

    def gen_frames(self) -> Generator[bytes, None, None]:
        """Generate frames for streaming"""
        if not self.open():
            return

        try:
            while True:
                success, frame_bytes, _, _ = self.read_frame()
                if not success:
                    break

                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        finally:
            self.release()

    def release(self):
        """Release the video stream"""
        if self.cap:
            self.cap.release()
            logger.info(f"Released video stream: {self.source}. Total frames processed: {self.frame_count}")


def verify_stream(source: str) -> bool:
    """
    Verify that a video stream can be opened
    :param source: 0 for webcam, RTSP URL, or MP4 file path
    :return: True if stream can be opened
    """
    stream = VideoStream(source)
    success = stream.open()
    if success:
        stream.release()
    return success

