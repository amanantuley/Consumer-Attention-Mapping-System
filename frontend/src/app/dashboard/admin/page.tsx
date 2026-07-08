'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  Users, Video, Shield, Activity, Plus, Search, Trash, 
  Play, Pause, Camera, Check, X, RefreshCw, AlertCircle
} from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface CameraItem {
  id: string;
  store_id: string;
  name: string;
  rtsp_url: string;
  is_active: boolean;
}

interface ShopperTelemetry {
  track_id: number;
  bbox: number[];
  gaze_vector: number[];
  head_pose: {
    yaw: number;
    pitch: number;
    roll: number;
  };
  dwell_time: number;
  profile: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, accessToken, initialize } = useAuthStore();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user && user.role !== 'administrator') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // State Variables
  const [users, setUsers] = useState<UserItem[]>([]);
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraItem | null>(null);
  
  // CCTV Capture telemetries
  const [capturedData, setCapturedData] = useState<{
    shoppers: ShopperTelemetry[];
    timestamp: string;
    resolution: string;
  } | null>(null);
  
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'users' | 'cctv'>('cctv');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // Forms state
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('Analyst');
  
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [newCameraName, setNewCameraName] = useState('');
  const [newCameraUrl, setNewCameraUrl] = useState('0');
  const [newCameraStoreId, setNewCameraStoreId] = useState('');
  const [stores, setStores] = useState<{ layout_id: string; name: string }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchUsers();
      fetchCameras();
      fetchStores();
    }
  }, [accessToken]);

  useEffect(() => {
    if (activeTab === 'cctv') {
      drawLivestream();
    } else {
      stopLivestream();
    }
    return () => stopLivestream();
  }, [activeTab, selectedCamera, capturedData, isCapturing]);

  const fetchUsers = async () => {
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCameras = async () => {
    setIsLoading(true);
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/cameras/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCameras(data);
        if (data.length > 0 && !selectedCamera) {
          setSelectedCamera(data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStores = async () => {
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/stores/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStores(data);
        if (data.length > 0) {
          setNewCameraStoreId(data[0].layout_id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Register user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const token = accessToken || localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newUserEmail,
          full_name: newUserFullName,
          password: newUserPassword,
          role: newUserRole
        })
      });

      if (!res.ok) throw new Error('Registration failed');
      
      setShowUserModal(false);
      setNewUserEmail('');
      setNewUserFullName('');
      setNewUserPassword('');
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error registering user');
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (user: UserItem) => {
    const token = accessToken || localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_active: !user.is_active
        })
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Camera
  const handleCreateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const token = accessToken || localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE}/api/cameras/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          store_id: newCameraStoreId,
          name: newCameraName,
          rtsp_url: newCameraUrl
        })
      });

      if (!res.ok) throw new Error('Failed to create camera');
      
      setShowCameraModal(false);
      setNewCameraName('');
      setNewCameraUrl('0');
      fetchCameras();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adding camera');
    }
  };

  // Delete Camera
  const handleDeleteCamera = async (camId: string) => {
    if (!confirm('Are you sure you want to remove this camera?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/cameras/${camId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        fetchCameras();
        if (selectedCamera?.id === camId) {
          setSelectedCamera(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger Live Capturing Data via API
  const handleCaptureTelemetry = async () => {
    if (!selectedCamera) return;
    setIsCapturing(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/cameras/${selectedCamera.id}/capture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error('Live capture evaluation failed');
      const data = await res.json();
      setCapturedData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'AI pipeline evaluation failed');
    } finally {
      setIsCapturing(false);
    }
  };

  // Simulated live feed loops on canvas
  const stopLivestream = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const drawLivestream = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    stopLivestream();

    let frameCount = 0;
    
    // Simple motion simulation variables
    let shopperSim = [
      { id: 101, x: 200, y: 160, dx: 0.5, dy: 0.2, trail: [] as {x: number, y: number}[] },
      { id: 102, x: 450, y: 180, dx: -0.4, dy: 0.1, trail: [] as {x: number, y: number}[] }
    ];

    const drawStoreBlueprint = (c: CanvasRenderingContext2D, w: number, h: number) => {
      c.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      c.lineWidth = 1;
      // Border walls
      c.strokeRect(8, 8, w - 16, h - 16);
      
      // Aisle Blocks
      c.fillStyle = 'rgba(255, 255, 255, 0.005)';
      // Aisle 1
      c.strokeRect(40, 50, 80, 160);
      c.fillRect(40, 50, 80, 160);
      // Aisle 2
      c.strokeRect(160, 50, 80, 160);
      c.fillRect(160, 50, 80, 160);
      // Aisle 3
      c.strokeRect(280, 50, 80, 160);
      c.fillRect(280, 50, 80, 160);
      // Checkout
      c.strokeRect(400, 80, 70, 100);
      c.fillRect(400, 80, 70, 100);

      // Labels
      c.fillStyle = 'rgba(255, 255, 255, 0.12)';
      c.font = 'bold 7px monospace';
      c.textAlign = 'center';
      c.fillText('AISLE 1 (SODA/WATER)', 80, 42);
      c.fillText('AISLE 2 (SNACKS/CHIPS)', 200, 42);
      c.fillText('AISLE 3 (DAIRY/MILK)', 320, 42);
      c.fillText('CHECKOUT 1', 435, 72);
      c.fillText('ENTRANCE A', 80, h - 20);
    };

    const render = () => {
      if (!ctx || !canvas) return;
      
      // 1. Draw Simulated CCTV image
      ctx.fillStyle = '#09090c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw camera static scanning grid lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.015)';
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 15) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
      for (let x = 0; x < canvas.width; x += 15) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }

      // Draw Store Layout Blueprint
      drawStoreBlueprint(ctx, canvas.width, canvas.height);

      // Blinking Red Recording Indicator
      frameCount++;
      if (Math.floor(frameCount / 25) % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(35, 30, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('REC LIVE', 48, 33);
      }

      // Draw camera name and timestamp
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`CCTV_NODE: ${selectedCamera ? selectedCamera.name.toUpperCase() : 'NONE'}`, canvas.width - 20, 30);
      ctx.fillText(new Date().toISOString().replace('T', ' ').slice(0, 19), canvas.width - 20, 42);

      // Draw futuristic y-scanning laser sweep line
      const laserY = (frameCount * 1.5) % (canvas.height + 40) - 20;
      if (laserY >= 0 && laserY <= canvas.height) {
        const grad = ctx.createLinearGradient(0, laserY - 12, 0, laserY + 1);
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.0)');
        grad.addColorStop(0.8, 'rgba(16, 185, 129, 0.15)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.7)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, laserY - 12, canvas.width, 12);
        
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, laserY);
        ctx.lineTo(canvas.width, laserY);
        ctx.stroke();
      }

      // If we have manual capture telemetry results, overlay them instead of simulation
      if (capturedData && capturedData.shoppers.length > 0) {
        capturedData.shoppers.forEach((sh) => {
          const [x1, y1, x2, y2] = sh.bbox;
          // Scale coords to fits canvas (640x360) from simulation's 1280x720 coordinates
          const scaleX = canvas.width / 1280.0;
          const scaleY = canvas.height / 720.0;
          const rx1 = x1 * scaleX;
          const ry1 = y1 * scaleY;
          const rw = (x2 - x1) * scaleX;
          const rh = (y2 - y1) * scaleY;

          // Draw Shopper Bounding Box corners (Advanced styling)
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          const cornerLen = 12;
          
          // Top-left
          ctx.beginPath();
          ctx.moveTo(rx1 + cornerLen, ry1); ctx.lineTo(rx1, ry1); ctx.lineTo(rx1, ry1 + cornerLen);
          ctx.stroke();
          // Top-right
          ctx.beginPath();
          ctx.moveTo(rx1 + rw - cornerLen, ry1); ctx.lineTo(rx1 + rw, ry1); ctx.lineTo(rx1 + rw, ry1 + cornerLen);
          ctx.stroke();
          // Bottom-left
          ctx.beginPath();
          ctx.moveTo(rx1 + cornerLen, ry1 + rh); ctx.lineTo(rx1, ry1 + rh); ctx.lineTo(rx1, ry1 + rh - cornerLen);
          ctx.stroke();
          // Bottom-right
          ctx.beginPath();
          ctx.moveTo(rx1 + rw - cornerLen, ry1 + rh); ctx.lineTo(rx1 + rw, ry1 + rh); ctx.lineTo(rx1 + rw, ry1 + rh - cornerLen);
          ctx.stroke();

          // Semi-transparent box fill on detected shopper
          ctx.fillStyle = 'rgba(16, 185, 129, 0.02)';
          ctx.fillRect(rx1, ry1, rw, rh);

          // Draw Shopper head pose circle indicator with Dial
          const hx = rx1 + rw / 2;
          const hy = ry1 + rh * 0.15;
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(hx, hy, 7, 0, 2 * Math.PI);
          ctx.fill();

          // Dial ring
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(hx, hy, 12, 0, 2 * Math.PI);
          ctx.stroke();

          // Gaze direction vector line (glowing laser vector)
          const vx = sh.gaze_vector[0] * 50;
          const vy = sh.gaze_vector[1] * 50;
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(hx + vx, hy + vy);
          ctx.stroke();

          // Gaze target highlight circle
          ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
          ctx.beginPath();
          ctx.arc(hx + vx, hy + vy, 4, 0, 2 * Math.PI);
          ctx.fill();

          // Label Banner
          ctx.fillStyle = '#10b981';
          ctx.fillRect(rx1, ry1 - 16, Math.max(105, ctx.measureText(`ID ${sh.track_id}`).width + 50), 16);
          
          ctx.fillStyle = '#09090b';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`ID ${sh.track_id} | ${sh.profile.toUpperCase()}`, rx1 + 5, ry1 - 5);
        });

        // Add Watermark to indicate Freeze evaluation
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`--- TELEMETRY EVALUATION FRAME CAPTURED (${capturedData.timestamp}) ---`, canvas.width / 2, canvas.height - 9);

      } else {
        // Otherwise draw live tracking simulation with corner brackets
        shopperSim.forEach((sh) => {
          sh.x += sh.dx;
          sh.y += sh.dy;
          
          // Boundaries bounce
          if (sh.x < 50 || sh.x > canvas.width - 50) sh.dx *= -1;
          if (sh.y < 80 || sh.y > canvas.height - 80) sh.dy *= -1;

          // Draw simulated shoppers corner brackets
          const rx1 = sh.x - 30;
          const ry1 = sh.y - 70;
          const rw = 60;
          const rh = 140;

          // Update trail position history
          sh.trail = sh.trail || [];
          sh.trail.push({ x: sh.x, y: sh.y });
          if (sh.trail.length > 25) sh.trail.shift();

          // Draw dotted path tracer trail
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);
          sh.trail.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
          ctx.setLineDash([]); // Reset line dash

          ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
          ctx.lineWidth = 1.5;
          const len = 8;
          // TL
          ctx.beginPath(); ctx.moveTo(rx1 + len, ry1); ctx.lineTo(rx1, ry1); ctx.lineTo(rx1, ry1 + len); ctx.stroke();
          // TR
          ctx.beginPath(); ctx.moveTo(rx1 + rw - len, ry1); ctx.lineTo(rx1 + rw, ry1); ctx.lineTo(rx1 + rw, ry1 + len); ctx.stroke();
          // BL
          ctx.beginPath(); ctx.moveTo(rx1 + len, ry1 + rh); ctx.lineTo(rx1, ry1 + rh); ctx.lineTo(rx1, ry1 + rh - len); ctx.stroke();
          // BR
          ctx.beginPath(); ctx.moveTo(rx1 + rw - len, ry1 + rh); ctx.lineTo(rx1 + rw, ry1 + rh); ctx.lineTo(rx1 + rw, ry1 + rh - len); ctx.stroke();

          ctx.fillStyle = 'rgba(16, 185, 129, 0.02)';
          ctx.fillRect(rx1, ry1, rw, rh);

          // Simulated Head point
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(sh.x, sh.y - 50, 5, 0, 2 * Math.PI);
          ctx.fill();

          // Simulated Gaze line
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(sh.x, sh.y - 50);
          ctx.lineTo(sh.x + (sh.dx * 60), sh.y - 50 + (sh.dy * 60));
          ctx.stroke();

          // Text overlay
          ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
          ctx.font = '8px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`TRACK_ID ${sh.id}`, sh.x - 28, sh.y - 75);
        });
      }

      // Draw camera hardware diagnostics on bottom left
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SHUTTER: 1/120s | ISO: 200 | APERTURE: f/2.2 | RES: 1280x720 | CODEC: H.265 | STREAM: RTSP/UDP', 20, canvas.height - (capturedData ? 32 : 12));

      animationRef.current = requestAnimationFrame(render);
    };

    render();
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" /> Admin Command Gateway
          </h1>
          <p className="text-zinc-400 text-sm">
            Manage system roles, configure CCTV live hardware connections, and trigger real-time AI computer vision evaluations.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('cctv')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cctv' 
                ? 'bg-emerald-500 text-[#09090b]' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            CCTV & Capturing
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users' 
                ? 'bg-emerald-500 text-[#09090b]' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            User Accounts ({users.length})
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* CCTV TAB VIEW */}
      {activeTab === 'cctv' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Camera List */}
          <div className="space-y-6 lg:col-span-1">
            <div className="glass-panel p-5 rounded-3xl border border-zinc-800/80">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-emerald-400" /> CCTV Ingestion Nodes
                </h3>
                <button
                  onClick={() => setShowCameraModal(true)}
                  className="p-1.5 bg-emerald-950/40 border border-emerald-550/30 text-emerald-400 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-xs text-zinc-550 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" /> Loading feed nodes...
                </div>
              ) : cameras.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500 bg-zinc-950/50 rounded-2xl border border-zinc-900">
                  No active CCTV cameras configured.
                </div>
              ) : (
                <div className="space-y-2">
                  {cameras.map((cam) => (
                    <div
                      key={cam.id}
                      onClick={() => {
                        setSelectedCamera(cam);
                        setCapturedData(null);
                      }}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center cursor-pointer ${
                        selectedCamera?.id === cam.id
                          ? 'bg-emerald-950/20 border-emerald-500/50 text-white'
                          : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold truncate">{cam.name}</h4>
                        <p className="text-[10px] text-zinc-550 font-mono mt-0.5 truncate">
                          Source: {cam.rtsp_url === '0' ? 'Local Video/Simulation' : cam.rtsp_url}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${cam.is_active ? 'bg-emerald-500' : 'bg-zinc-650'}`} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCamera(cam.id);
                          }}
                          className="p-1 hover:text-red-400 text-zinc-600 transition-all"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Livestream Viewer & allowance */}
          {selectedCamera ? (
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-panel p-5 rounded-3xl border border-zinc-800/80 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-zinc-350 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Live Telemetry Capture Viewport
                  </h3>
                  {capturedData && (
                    <button
                      onClick={() => setCapturedData(null)}
                      className="text-[10px] text-emerald-450 hover:text-white flex items-center gap-1 font-bold transition-all"
                    >
                      Resume Stream
                    </button>
                  )}
                </div>

                {/* CCTV Monitor View screen */}
                <div className="relative border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 flex justify-center aspect-video">
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={360}
                    className="w-full object-cover"
                  />
                </div>

                {/* Live Capturing Controls */}
                <div className="mt-5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">CCTV AI Stream Ingestion Controller</h4>
                    <p className="text-[10px] text-zinc-500">Capture current webcam or RTSP feed coordinates to process shopper face landmarks and body contours.</p>
                  </div>
                  
                  <button
                    onClick={handleCaptureTelemetry}
                    disabled={isCapturing}
                    className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-850 text-[#09090b] font-extrabold rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isCapturing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" /> Capture Live Telemetry
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Detections display list */}
              {capturedData && (
                <div className="glass-panel p-5 rounded-3xl border border-zinc-800/80">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Captured Frame Shopper Telemetry</h4>
                  
                  {capturedData.shoppers.length === 0 ? (
                    <div className="text-xs text-zinc-500 py-4 text-center">No shoppers detected in the captured frame.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {capturedData.shoppers.map((sh) => (
                        <div key={sh.track_id} className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-2xl text-xs space-y-2">
                          <div className="flex justify-between items-center border-b border-zinc-850 pb-2 mb-2">
                            <span className="font-bold text-emerald-450 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                              Shopper ID #{sh.track_id}
                            </span>
                            <span className="bg-zinc-950 px-2 py-0.5 border border-zinc-800 rounded font-mono text-[9px] text-blue-450">
                              {sh.profile}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-450 font-mono">
                            <div>
                              <span className="text-zinc-600 block">Dwell Duration:</span> {sh.dwell_time}s
                            </div>
                            <div>
                              <span className="text-zinc-600 block">Head Rotation:</span> Y: {Math.round(sh.head_pose.yaw)}°, P: {Math.round(sh.head_pose.pitch)}°
                            </div>
                            <div className="col-span-2">
                              <span className="text-zinc-600 block">Eye Gaze Direction:</span> [{sh.gaze_vector.map(v => v.toFixed(3)).join(', ')}]
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-2 glass-panel p-12 rounded-3xl border border-zinc-800/80 flex flex-col items-center justify-center text-center text-zinc-550 min-h-[300px]">
              <Video className="w-12 h-12 text-zinc-700 mb-3 animate-pulse" />
              <h3 className="font-bold text-white mb-1">No CCTV Node Selected</h3>
              <p className="text-xs max-w-sm">
                Please select an active CCTV ingestion camera node from the list to display real-time live streams and frame capture telemetries.
              </p>
            </div>
          )}
        </div>
      )}

      {/* USER TAB VIEW */}
      {activeTab === 'users' && (
        <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" /> Corporate Users
            </h3>
            <button
              onClick={() => setShowUserModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold">
                  <th className="py-4 px-4">Full Name</th>
                  <th className="py-4 px-4">Email</th>
                  <th className="py-4 px-4">Access Level (Role)</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900/30 transition-all">
                    <td className="py-4 px-4 font-semibold text-white">{u.full_name}</td>
                    <td className="py-4 px-4 text-zinc-400 font-mono">{u.email}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-emerald-450 rounded font-semibold font-mono text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.is_active 
                          ? 'bg-emerald-950 border border-emerald-900 text-emerald-450' 
                          : 'bg-zinc-950 border border-zinc-900 text-zinc-600'
                      }`}>
                        {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => toggleUserStatus(u)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                          u.is_active 
                            ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-900' 
                            : 'border-emerald-900/40 text-emerald-400 hover:bg-emerald-950/20'
                        }`}
                      >
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE CAMERA MODAL */}
      {showCameraModal && (
        <div className="fixed inset-0 bg-[#000000]/80 z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
            
            <h3 className="text-lg font-bold text-white mb-4">Register Ingestion Camera Node</h3>
            
            <form onSubmit={handleCreateCamera} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Camera Name</label>
                <input
                  type="text"
                  required
                  value={newCameraName}
                  onChange={(e) => setNewCameraName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Entrance Aisle Gaze"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Ingestion Source URL / ID</label>
                <input
                  type="text"
                  required
                  value={newCameraUrl}
                  onChange={(e) => setNewCameraUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="0 (Webcam) or rtsp://..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Associate Layout Store</label>
                <select
                  value={newCameraStoreId}
                  onChange={(e) => setNewCameraStoreId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  {stores.map((st) => (
                    <option key={st.layout_id} value={st.layout_id}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCameraModal(false)}
                  className="flex-1 py-2.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Register Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-[#000000]/80 z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
            
            <h3 className="text-lg font-bold text-white mb-4">Register User Account</h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Aman Antuley"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="aman@cams.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Security Password</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Corporate Access Level</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="SuperAdmin">System Administrator</option>
                  <option value="StoreManager">Store Manager</option>
                  <option value="Analyst">Product Manager / Analyst</option>
                </select>
              </div>

              <div className="flex gap-3.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-2.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
