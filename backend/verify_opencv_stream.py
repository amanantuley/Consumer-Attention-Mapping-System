import cv2
import time
import numpy as np
import argparse
import sys
import os

# Add parent directory to path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.video_stream import VideoStream

def generate_synthetic_frame(width=640, height=480, frame_id=0):
    """Generate a synthetic test frame with a bouncing ball and text to simulate a retail camera"""
    # Create black frame
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Draw background grid
    for y in range(0, height, 40):
        cv2.line(frame, (0, y), (width, y), (40, 40, 40), 1)
    for x in range(0, width, 40):
        cv2.line(frame, (x, 0), (x, height), (40, 40, 40), 1)
        
    # Draw a simulated "shelf zone"
    cv2.rectangle(frame, (100, 100), (540, 380), (0, 255, 0), 2)
    cv2.putText(frame, "SHELF ZONE A", (110, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    
    # Calculate bouncing ball coordinates
    speed_x, speed_y = 15, 10
    ball_x = (100 + (frame_id * speed_x)) % 440
    ball_y = (100 + (frame_id * speed_y)) % 280
    
    # Draw bouncing ball (simulating a customer)
    cv2.circle(frame, (100 + ball_x, 100 + ball_y), 15, (0, 0, 255), -1)
    cv2.putText(frame, "Customer #1", (100 + ball_x - 40, 100 + ball_y - 25), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
    
    # Draw timestamps and info
    timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S")
    cv2.putText(frame, f"Time: {timestamp_str}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(frame, f"Frame: {frame_id}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    cv2.putText(frame, "Synthetic Retail Stream", (10, height - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 165, 0), 2)
    
    return frame

class SyntheticVideoStream(VideoStream):
    """VideoStream subclass that generates frames dynamically if no hardware camera is present"""
    def __init__(self, width=640, height=480):
        super().__init__(source="synthetic")
        self.width = width
        self.height = height
        self.is_opened = False
        
    def open(self) -> bool:
        self.start_time = time.time()
        self.frame_count = 0
        self.is_opened = True
        print("Opened synthetic retail video stream.")
        return True
        
    def read_frame(self):
        if not self.is_opened:
            return False, None, None, {}
            
        self.frame_count += 1
        frame = generate_synthetic_frame(self.width, self.height, self.frame_count)
        
        # Calculate FPS
        timestamp = time.time()
        elapsed = timestamp - self.start_time
        fps = self.frame_count / elapsed if elapsed > 0 else 0.0
        
        _, buffer = cv2.imencode('.jpg', frame)
        metadata = {
            "frame_id": self.frame_count,
            "timestamp": timestamp,
            "fps": round(fps, 2),
            "source": "synthetic_generator",
            "original_resolution": {"width": self.width, "height": self.height},
            "output_resolution": {"width": self.width, "height": self.height}
        }
        
        # We also need the raw numpy frame to display/write
        return True, buffer.tobytes(), self.frame_count, metadata, frame
        
    def release(self):
        self.is_opened = False
        print(f"Released synthetic stream. Total frames: {self.frame_count}")

def main():
    parser = argparse.ArgumentParser(description="OpenCV Video Stream Verification")
    parser.add_argument("--source", type=str, default="synthetic", 
                        help="Video source: 'synthetic', a video file path, RTSP URL, or webcam ID (e.g. 0)")
    parser.add_argument("--max-frames", type=int, default=150, 
                        help="Maximum frames to process (default: 150)")
    parser.add_argument("--headless", action="store_true", 
                        help="Force headless mode (no GUI window displayed)")
    args = parser.parse_args()
    
    print("=" * 60)
    print("       CONSUMER ATTENTION MAPPING SYSTEM - OPENCV STREAM DEMO")
    print("=" * 60)
    print(f"Source: {args.source}")
    print(f"Max Frames: {args.max_frames}")
    
    # Initialize stream
    if args.source == "synthetic":
        stream = SyntheticVideoStream()
    else:
        stream = VideoStream(args.source)
        
    if not stream.open():
        print(f"ERROR: Failed to open video source '{args.source}'. Falling back to synthetic stream.")
        stream = SyntheticVideoStream()
        stream.open()
        
    print("\nStarting frame ingestion loop...")
    print("Press Ctrl+C or 'q' in the window to stop.")
    
    frame_count = 0
    start_run_time = time.time()
    
    # Output directory for saving verified frames in headless mode
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stream_output")
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        while frame_count < args.max_frames:
            # Read frame
            if isinstance(stream, SyntheticVideoStream):
                ret, frame_bytes, frame_id, metadata, frame = stream.read_frame()
            else:
                ret, frame_bytes, frame_id, metadata = stream.read_frame()
                # Reconstruct raw frame for window display/file saving
                if ret and frame_bytes:
                    nparr = np.frombuffer(frame_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
            if not ret:
                print("\nEnd of stream or failed to read frame.")
                break
                
            frame_count += 1
            
            # Print frame metadata
            print(f"\r[Frame {frame_id:04d}] FPS: {metadata['fps']:.2f} | Size: {metadata['output_resolution']['width']}x{metadata['output_resolution']['height']}", end="")
            sys.stdout.flush()
            
            # GUI window display
            if not args.headless:
                try:
                    cv2.imshow("OpenCV Stream Verification", frame)
                    key = cv2.waitKey(10) & 0xFF
                    if key == ord('q'):
                        print("\nUser quit stream window.")
                        break
                except Exception:
                    # Occurs in headless environments without X server/GUI
                    args.headless = True
                    print("\nWARNING: GUI environment not detected. Running in headless mode.")
            
            # Headless visual verification (save a frame every 30 frames)
            if args.headless and frame_id % 30 == 0:
                verify_path = os.path.join(output_dir, f"verified_frame_{frame_id:04d}.jpg")
                cv2.imwrite(verify_path, frame)
                print(f"\n[Verification] Saved processed frame to {verify_path}")
                
            # Simulate real-time delay (e.g. 30 FPS) for synthetic stream
            if isinstance(stream, SyntheticVideoStream):
                time.sleep(1.0 / 30.0)
                
    except KeyboardInterrupt:
        print("\nStream ingestion interrupted by user.")
    finally:
        stream.release()
        cv2.destroyAllWindows()
        
        elapsed = time.time() - start_run_time
        print("\n" + "=" * 60)
        print(f"Ingestion process completed in {elapsed:.2f} seconds.")
        print(f"Total frames processed: {frame_count}")
        print(f"Average processing speed: {frame_count / elapsed:.2f} FPS" if elapsed > 0 else "")
        if args.headless:
            print(f"Headless verified frame captures saved to: {output_dir}")
        print("=" * 60)

if __name__ == "__main__":
    main()
