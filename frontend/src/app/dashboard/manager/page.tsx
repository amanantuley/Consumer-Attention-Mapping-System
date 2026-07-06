'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTelemetryStore } from '@/store/telemetryStore';
import { 
  Camera, Play, Pause, UploadCloud, RefreshCw, 
  Activity, Users, User, ShieldAlert, CheckCircle, Flame
} from 'lucide-react';

interface CameraState {
  id: number;
  name: string;
  rtsp_url: string;
  status: 'online' | 'offline' | 'error';
  camera_type: 'overhead' | 'shelf_facing';
}

const defaultCameras: CameraState[] = [
  { id: 1, name: 'Main Aisle overhead CCTV', rtsp_url: 'rtsp://192.168.1.100:8554/live', status: 'online', camera_type: 'overhead' },
  { id: 2, name: 'Shelf 3 Dairy face cam', rtsp_url: 'rtsp://192.168.1.101:8554/live', status: 'offline', camera_type: 'shelf_facing' }
];

export default function ManagerPage() {
  const { accessToken } = useAuthStore();
  const { points, connect, disconnect, isConnected } = useTelemetryStore();
  const [cameras, setCameras] = useState<CameraState[]>(defaultCameras);
  const [selectedCam, setSelectedCam] = useState<CameraState | null>(defaultCameras[0]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetchCameras();
    // Connect to WebSocket telemetry for Store #1 (by default)
    connect(1);
    return () => disconnect();
  }, []);

  const fetchCameras = async () => {
    try {
      const res = await fetch('/api/v1/cameras/', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setCameras(data);
          setSelectedCam(data[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load camera devices list", e);
    }
  };

  // Draw simulated frames and tracking coordinates dynamically on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Simulated CCTV Grid Background
      ctx.fillStyle = '#0f0f13';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw camera name tag overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(10, 10, 200, 30);
      ctx.fillStyle = '#10b981';
      ctx.font = '11px monospace';
      ctx.fillText(`CAM ID: ${selectedCam?.id || 1} | LIVE FEED`, 20, 28);

      // 2. Render Shopper Coordinates Trails & Attention bounding boxes
      points.forEach((pt) => {
        // Project coordinates (0.0 - 1.0) onto canvas dimensions
        const px = pt.x * canvas.width;
        const py = pt.y * canvas.height;

        // Draw shopper tracker bounding box
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.strokeRect(px - 35, py - 80, 70, 160);

        // Draw track index label
        ctx.fillStyle = '#10b981';
        ctx.font = '10px sans-serif';
        ctx.fillText(`ID: ${pt.session_uuid.slice(-4)}`, px - 35, py - 85);

        // Highlight gaze attention vector line
        if (pt.gaze_target_shelf_id) {
          ctx.strokeStyle = '#3b82f6';
          ctx.beginPath();
          ctx.moveTo(px, py - 60); // Start near head
          ctx.lineTo(px + 40, py - 40); // Point coordinate offset
          ctx.stroke();

          // Gaze target highlight circle
          ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.beginPath();
          ctx.arc(px + 40, py - 40, 8, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [points, selectedCam]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedCam) return;

    setIsUploading(true);
    setUploadStatus('Uploading file to AI pipeline...');
    
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const res = await fetch(`/api/v1/cameras/${selectedCam.id}/upload-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('File upload failed');

      const data = await res.json();
      setUploadStatus(`Video queued. Celery Job ID: ${data.task_id.slice(0, 8)}...`);
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Camera className="w-6 h-6 text-emerald-400" /> Manager Live CCTV
        </h1>
        <p className="text-zinc-400 text-sm">
          Monitor camera stream feeds, view real-time shopper tracking boxes, and queue offline retail video analysis.
        </p>
      </div>

      {/* Main CCTV Grid & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live CCTV Video Monitor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
            <canvas 
              ref={canvasRef} 
              width={640} 
              height={360} 
              className="w-full h-full object-cover"
            />
            {/* Telemetry connection status indicator overlay */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-full text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-zinc-300 font-medium">
                {isConnected ? 'Telemetry WSS Active' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Camera Selection Grid */}
          <div className="grid grid-cols-2 gap-4">
            {cameras.map((cam) => (
              <button
                key={cam.id}
                onClick={() => setSelectedCam(cam)}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  selectedCam?.id === cam.id 
                    ? 'bg-emerald-950/20 border-emerald-500/50 text-white' 
                    : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs uppercase tracking-wider font-semibold text-zinc-500">Camera #{cam.id}</span>
                  <span className={`w-2 h-2 rounded-full ${cam.status === 'online' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                </div>
                <h4 className="text-sm font-bold truncate">{cam.name}</h4>
              </button>
            ))}
          </div>
        </div>

        {/* Offline Upload & Camera Registry Panel */}
        <div className="space-y-6">
          
          {/* File Upload Console */}
          <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <UploadCloud className="w-5 h-5 text-emerald-400" /> Queue Video Processing
            </h3>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="border border-dashed border-zinc-800 rounded-2xl p-6 text-center hover:border-zinc-700 transition-all">
                <input 
                  type="file" 
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden" 
                  id="video-uploader"
                  accept="video/*"
                />
                <label htmlFor="video-uploader" className="cursor-pointer space-y-2 block">
                  <UploadCloud className="w-8 h-8 text-zinc-500 mx-auto" />
                  <span className="text-xs font-semibold text-zinc-300 block">
                    {uploadFile ? uploadFile.name : 'Select recorded MP4 / AVI clip'}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">Max file size: 50MB</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!uploadFile || isUploading}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-[#09090b] font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-[#09090b] border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Trigger AI Pipeline'
                )}
              </button>
            </form>

            {uploadStatus && (
              <div className="mt-4 p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-xl font-mono text-[10px] text-zinc-400">
                {uploadStatus}
              </div>
            )}
          </div>

          {/* AI Edge Inference statistics */}
          <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edge Inference stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">Detector Backbone</span>
                <span className="text-white font-semibold">YOLOv11n (ONNX)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">Tracking Frame Latency</span>
                <span className="text-emerald-400 font-bold">12.4ms (CPU Fallback)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium">Active Shopper Nodes</span>
                <span className="text-white font-semibold">{points.length} tracked</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
