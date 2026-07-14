'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  Activity, Users, ShoppingBag, Eye, ArrowRight, Video, 
  Bell, Settings, TrendingUp, Cpu, Server, Play, Square, AlertTriangle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';

interface AlertItem {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

interface ShelfObject {
  id: string;
  shelf_name: string;
  zone_coordinates: number[][]; // [[x1, y1], [x2, y2]]
}

interface ShopperPosition {
  x: number;
  y: number;
  lastSeen: number;
}

export default function UnifiedDashboard() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, initialize } = useAuthStore();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

  // State parameters
  const [activeStoreId, setActiveStoreId] = useState<string>('');
  const [activeStoreName, setActiveStoreName] = useState<string>('Flagship Virtual Store');
  const [shelves, setShelves] = useState<ShelfObject[]>([]);
  const [simulationActive, setSimulationActive] = useState<boolean>(false);
  const [simulatingCameras, setSimulatingCameras] = useState<string[]>([]);
  
  // KPI states
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [conversionRate, setConversionRate] = useState<number>(0.0);
  const [dwellTime, setDwellTime] = useState<number>(0.0);
  const [totalSales, setTotalSales] = useState<number>(0.0);
  
  // Real-time tracking states
  const [liveOccupancy, setLiveOccupancy] = useState<number>(0);
  const [liveShoppers, setLiveShoppers] = useState<Record<string, ShopperPosition>>({});
  const [heatmapPoints, setHeatmapPoints] = useState<{x: number, y: number, value: number}[]>([]);
  const [occupancyHistory, setOccupancyHistory] = useState<{time: string, shoppers: number}[]>([]);
  
  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: '1', time: 'Just now', message: 'CAMS telemetry engine listening for camera streams.', type: 'info' }
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize Auth
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auth Redirect
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // 1. Fetch Flagship Store layout and seed shelves
  useEffect(() => {
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;

    const fetchInitialData = async () => {
      try {
        // Fetch stores layout
        const storesRes = await fetch(`${API_BASE}/api/stores/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!storesRes.ok) throw new Error();
        const storesData = await storesRes.json();
        
        // Find Flagship Store or default to first store
        const flagship = storesData.find((s: any) => s.name === "Flagship Virtual Store") || storesData[0];
        if (flagship) {
          setActiveStoreId(flagship.layout_id);
          setActiveStoreName(flagship.name);
          
          // Fetch shelves list
          const shelvesRes = await fetch(`${API_BASE}/api/stores/${flagship.layout_id}/shelves/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (shelvesRes.ok) {
            const shelvesData = await shelvesRes.json();
            setShelves(shelvesData);
          }

          // Fetch KPIs
          fetchKPIs(flagship.layout_id);
          
          // Fetch initial heatmap coordinates
          fetchInitialHeatmap(flagship.layout_id);
        }
        
        // Fetch simulation status
        const simRes = await fetch(`${API_BASE}/api/cameras/simulation/status`);
        if (simRes.ok) {
          const simData = await simRes.json();
          setSimulationActive(simData.active);
        }

      } catch (e) {
        console.error("Failed to load layout or store configurations.", e);
      }
    };

    fetchInitialData();
  }, [accessToken]);

  // Fetch KPIs
  const fetchKPIs = async (storeId: string) => {
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/analytics/kpis/${storeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVisitorCount(data.total_shoppers);
        setConversionRate(data.conversion_rate);
        setDwellTime(data.average_dwell_time);
        setTotalSales(data.total_sales);
      }
    } catch (e) {
      console.error("Failed to fetch store KPIs", e);
    }
  };

  // Fetch initial heatmap coordinates from CoordinateLog database
  const fetchInitialHeatmap = async (storeId: string) => {
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/analytics/heatmaps/${storeId}?heatmap_type=movements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Map grid coordinates to absolute pixel canvas coordinates (600x400)
        // In backend, coordinates are scaled [0, 100]. Let's convert them to relative [0, 1] then multiply by 600x400
        const points = data.points.map((p: any) => ({
          x: (p.x / 100) * 600,
          y: (p.y / 100) * 400,
          value: p.value
        }));
        setHeatmapPoints(points);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Simulation Controls
  const toggleSimulation = async () => {
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;

    if (simulationActive) {
      // Stop Simulation
      try {
        const res = await fetch(`${API_BASE}/api/cameras/simulation/stop`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setSimulationActive(false);
          setSimulatingCameras([]);
          setAlerts(prev => [
            { id: Math.random().toString(), time: 'Just now', message: 'Simulated video stream cameras stopped.', type: 'warning' },
            ...prev
          ]);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      // Start Simulation
      try {
        const res = await fetch(`${API_BASE}/api/cameras/simulation/start`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSimulationActive(true);
          setSimulatingCameras(data.active_cameras);
          setAlerts(prev => [
            { id: Math.random().toString(), time: 'Just now', message: `Simulation started for: ${data.active_cameras.join(', ')}`, type: 'success' },
            ...prev
          ]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 2. WebSocket listener for live coordinates
  useEffect(() => {
    if (!activeStoreId) return;

    const wsBase = API_BASE.replace('http://', 'ws://').replace('https://', 'wss://');
    const wsUrl = `${wsBase}/api/ws/store/${activeStoreId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`Connected to store telemetry WebSocket: ${wsUrl}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { session_uuid, x, y, gaze_target_shelf_id, gaze_target_product_id, timestamp } = data;

        // Convert relative coordinates [0, 1] to canvas scale [600, 400]
        const px = x * 600;
        const py = y * 400;

        // Add to heatmap points trace (keep last 300 points)
        setHeatmapPoints(prev => [...prev.slice(-300), { x: px, y: py, value: 1 }]);

        // Update shopper live position
        setLiveShoppers(prev => ({
          ...prev,
          [session_uuid]: { x: px, y: py, lastSeen: Date.now() }
        }));

        // Log alerts for gazes or actions occasionally
        if (gaze_target_product_id) {
          const productLabel = gaze_target_product_id.split('_').pop() || 'Product';
          setAlerts(prev => [
            { id: Math.random().toString(), time: 'Just now', message: `Attention detected: Shopper stared at product [${productLabel.toUpperCase()}]`, type: 'info' },
            ...prev.slice(0, 8)
          ]);
        }

      } catch (e) {
        console.error("Error parsing WebSocket coordinate payload", e);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket Telemetry error", err);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    return () => {
      ws.close();
    };
  }, [activeStoreId]);

  // Periodic cleanup of active shoppers (if not seen for 6 seconds, treat as exited)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setLiveShoppers(prev => {
        const cleaned = { ...prev };
        let modified = false;
        Object.keys(cleaned).forEach(uuid => {
          if (now - cleaned[uuid].lastSeen > 6000) {
            delete cleaned[uuid];
            modified = true;
          }
        });
        return modified ? cleaned : prev;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  // Update live occupancy counts & history
  useEffect(() => {
    const occupancy = Object.keys(liveShoppers).length;
    setLiveOccupancy(occupancy);

    // Trigger overcrowding alerts if live occupancy is high (e.g., > 5 shopper tracks)
    if (occupancy >= 5) {
      const isAlreadyAlerted = alerts.some(a => a.type === 'danger' && a.message.includes('Overcrowding alert'));
      if (!isAlreadyAlerted) {
        setAlerts(prev => [
          { id: Math.random().toString(), time: 'Just now', message: `🚨 Overcrowding alert: Checkout lanes exceed safety limit (Active tracks: ${occupancy})!`, type: 'danger' },
          ...prev.slice(0, 8)
        ]);
      }
    }

    // Add to occupancy history timeline (keep last 12 points)
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setOccupancyHistory(prev => [
      ...prev.slice(-11),
      { time: timeLabel, shoppers: occupancy }
    ]);

  }, [liveShoppers]);

  // Periodic store statistics polling
  useEffect(() => {
    if (!activeStoreId) return;
    const interval = setInterval(() => {
      fetchKPIs(activeStoreId);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeStoreId]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Clear Canvas & Draw grid background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.lineWidth = 1;
    const gridSize = 25;
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

    // 2. Draw Heatmap (Radial shadow method)
    if (heatmapPoints.length > 0) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        const radius = 25;
        const blur = 15;
        const brushCanvas = document.createElement('canvas');
        brushCanvas.width = (radius + blur) * 2;
        brushCanvas.height = (radius + blur) * 2;
        const brushCtx = brushCanvas.getContext('2d');
        if (brushCtx) {
          const gradient = brushCtx.createRadialGradient(
            radius + blur, radius + blur, radius,
            radius + blur, radius + blur, radius + blur
          );
          gradient.addColorStop(0, 'rgba(0,0,0,1)');
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          brushCtx.fillStyle = gradient;
          brushCtx.beginPath();
          brushCtx.arc(radius + blur, radius + blur, radius + blur, 0, Math.PI * 2);
          brushCtx.fill();
        }

        heatmapPoints.forEach(p => {
          const intensity = Math.min(1.0, p.value / 6.0);
          tempCtx.globalAlpha = intensity;
          tempCtx.drawImage(brushCanvas, p.x - (radius + blur), p.y - (radius + blur));
        });

        // Colorize canvas
        const imgData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Gradient color palette: Blue -> Cyan -> Green -> Yellow -> Red
        const gradCanvas = document.createElement('canvas');
        gradCanvas.width = 1;
        gradCanvas.height = 256;
        const gradCtx = gradCanvas.getContext('2d');
        if (gradCtx) {
          const g = gradCtx.createLinearGradient(0, 0, 0, 256);
          g.addColorStop(0.0, '#3b82f6'); // Blue
          g.addColorStop(0.3, '#06b6d4'); // Cyan
          g.addColorStop(0.55, '#10b981'); // Green
          g.addColorStop(0.8, '#eab308'); // Yellow
          g.addColorStop(1.0, '#ef4444'); // Red
          gradCtx.fillStyle = g;
          gradCtx.fillRect(0, 0, 1, 256);
        }
        const gradData = gradCtx ? gradCtx.getImageData(0, 0, 1, 256).data : null;

        if (gradData) {
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha > 0) {
              const offset = alpha * 4;
              data[i] = gradData[offset];     // R
              data[i + 1] = gradData[offset + 1]; // G
              data[i + 2] = gradData[offset + 2]; // B
              data[i + 3] = alpha * 0.75; // Translucent
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }
      }
    }

    // 3. Draw Shelves / Zones
    shelves.forEach((sh) => {
      const coords = sh.zone_coordinates;
      if (!coords || coords.length < 2) return;

      const x1 = coords[0][0];
      const y1 = coords[0][1];
      const x2 = coords[1][0];
      const y2 = coords[1][1];
      const w = x2 - x1;
      const h = y2 - y1;

      // Draw shelf bounding box translucent overlay
      ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
      ctx.fillRect(x1, y1, w, h);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x1, y1, w, h);

      // Label text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(sh.shelf_name, x1 + w / 2, y1 + h / 2 + 3);
    });

    // 4. Draw Active Shoppers
    Object.entries(liveShoppers).forEach(([uuid, pos]) => {
      const shopperNum = uuid.split('_').pop() || '0';
      
      // Outer pulse rings
      const pulseRadius = 14 + 4 * Math.sin(Date.now() / 150.0);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pulseRadius, 0, 2 * Math.PI);
      ctx.stroke();

      // Inner solid dot
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Shopper ID Label tag
      ctx.fillStyle = '#09090b';
      const labelText = `Shopper #${shopperNum}`;
      ctx.font = 'bold 9px sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      ctx.fillRect(pos.x - (textWidth + 8) / 2, pos.y - 25, textWidth + 8, 14);
      
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.strokeRect(pos.x - (textWidth + 8) / 2, pos.y - 25, textWidth + 8, 14);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, pos.x, pos.y - 15);
    });

  }, [heatmapPoints, shelves, liveShoppers]);

  // Mock static product attention details
  const attentionData = [
    { name: 'Coca-Cola 500ml', gazeSeconds: 240, pickups: 85, purchases: 62 },
    { name: 'Doritos Nacho 150g', gazeSeconds: 410, pickups: 130, purchases: 95 },
    { name: 'Whole Milk 1L', gazeSeconds: 150, pickups: 60, purchases: 54 },
    { name: 'Tide Detergent 2L', gazeSeconds: 310, pickups: 45, purchases: 38 },
  ];

  const roleLabel = user?.role ? user.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Analyst';

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[20rem] h-[20rem] rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none" />
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">
            Welcome back, {user?.full_name || 'System Administrator'}
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Access gateway profile level: <span className="text-emerald-400 font-bold">{roleLabel}</span>. CAMS AI engine online.
          </p>
        </div>
        
        {/* Planner and Simulation controls */}
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={toggleSimulation}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-lg ${
              simulationActive 
                ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' 
                : 'bg-emerald-500 text-[#09090b] hover:bg-emerald-400 shadow-emerald-500/10'
            }`}
          >
            {simulationActive ? (
              <>
                <Square className="w-4 h-4" /> Stop Simulation
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Run Live Simulation
              </>
            )}
          </button>
          
          <button
            onClick={() => router.push('/dashboard/layout-planner')}
            className="px-4 py-2.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-100 font-bold rounded-xl border border-zinc-700/80 flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-lg shadow-zinc-950/10"
          >
            Planner Canvas <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overcrowding Banner Alert */}
      {liveOccupancy >= 5 && (
        <div className="p-4 bg-red-950/30 border border-red-900/65 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-semibold animate-pulse shadow-md">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
          <span>SAFETY WARNING: High shopper density detected in Checkout Lanes! (Current occupancy threshold exceeded)</span>
        </div>
      )}

      {/* KPI Panel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-450 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Visitors</h4>
            <p className="text-2xl font-bold text-white mt-0.5">{visitorCount}</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-450 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Conversion Rate</h4>
            <p className="text-2xl font-bold text-white mt-0.5">{conversionRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-450 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Attention Index</h4>
            <p className="text-2xl font-bold text-white mt-0.5">{dwellTime.toFixed(1)}s avg</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 flex items-center gap-4 font-mono">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Live Occupants</h4>
            <p className="text-2xl font-bold text-cyan-400 mt-0.5">{liveOccupancy} Shoppers</p>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Live Heatmap and Floor Plan Canvas */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-3xl border border-zinc-800/80 flex flex-col items-center justify-center relative bg-zinc-950/20 overflow-hidden min-h-[460px]">
          <div className="absolute top-4 left-4 z-10">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" /> Real-time Store Layout Traffic Heatmap
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">Live coordinate telemetry feed from Active Cameras</p>
          </div>
          
          {simulationActive && (
            <div className="absolute top-4 right-4 z-10 px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
              FEED SIMULATING: {simulatingCameras.length} CAMERAS
            </div>
          )}

          {/* 2D Digital Floor Canvas */}
          <div className="relative mt-8 border border-zinc-850 rounded-2xl overflow-hidden shadow-2xl">
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={400} 
              className="bg-[#09090b] block" 
            />
          </div>

          <div className="w-full border-t border-zinc-900/60 pt-4 mt-6 flex justify-between items-center text-[10px] text-zinc-500 font-medium">
            <span>Heat trail duration: Last 300 coordinate logs. Scale: 1:1 Virtual Store calibration.</span>
            <span className="text-cyan-400 font-bold font-mono">Telemetry active</span>
          </div>
        </div>

        {/* Right Side: Real-time Ingestion Alerts / logs */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-3xl border border-zinc-800/80 flex flex-col justify-between max-h-[500px] overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-emerald-400" /> Live Ingestion Alerts
            </h3>
            
            <div className="space-y-3 pr-1 max-h-[360px] overflow-y-auto">
              {alerts.map((al) => (
                <div key={al.id} className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-xl flex flex-col gap-1 text-[11px] leading-relaxed">
                  <div className="flex justify-between items-center text-zinc-500 text-[9px] font-mono">
                    <span>{al.time}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      al.type === 'success' ? 'bg-emerald-500' :
                      al.type === 'warning' ? 'bg-yellow-500' : 
                      al.type === 'danger' ? 'bg-red-500 animate-ping' : 'bg-blue-500'
                    }`} />
                  </div>
                  <p className="text-zinc-300 font-medium">{al.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="border-t border-zinc-900 pt-4 mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold">
            <button
              onClick={() => router.push('/dashboard/analyst')}
              className="py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 text-center transition-all cursor-pointer"
            >
              Catalog SKUs
            </button>
            <button
              onClick={() => router.push('/dashboard/manager')}
              className="py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 text-center transition-all cursor-pointer"
            >
              Stores Setup
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Row: Recharts Graphs & Active Ingest Nodes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Recharts Analytics */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-3xl border border-zinc-800/80 space-y-6">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" /> Real-time Analytics Timeline
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Live Occupancy History */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Live Store Occupancy Timeline</h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={occupancyHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={8} />
                    <YAxis stroke="#71717a" fontSize={8} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', fontSize: 10 }} />
                    <Line type="monotone" dataKey="shoppers" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Product Shelf Attention */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">Product Shelf Attention & Pickups</h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attentionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={7} />
                    <YAxis stroke="#71717a" fontSize={8} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', fontSize: 10 }} />
                    <Legend wrapperStyle={{ fontSize: 8 }} />
                    <Bar dataKey="pickups" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="purchases" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>

        {/* Video stream nodes */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-3xl border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-400" /> Active Video Stream Ingestion Nodes
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-2xl flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Entrance Camera (Cam 1)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    simulationActive 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse' 
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                  }`}>
                    {simulationActive ? 'SIMULATING' : 'ONLINE'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>FPS: {simulationActive ? '29.8' : '0.0'}</span>
                  <span>Zone: Entrance/Exit Foyer</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-2xl flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Main Product Aisle (Cam 2)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    simulationActive 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse' 
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                  }`}>
                    {simulationActive ? 'SIMULATING' : 'ONLINE'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>FPS: {simulationActive ? '30.0' : '0.0'}</span>
                  <span>Zone: Main Product Aisle</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-2xl flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Shelf Zoom (Cam 3)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    simulationActive 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse' 
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                  }`}>
                    {simulationActive ? 'SIMULATING' : 'ONLINE'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>FPS: {simulationActive ? '29.5' : '0.0'}</span>
                  <span>Zone: Main Product Aisle</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-900/35 border border-zinc-850 rounded-2xl flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Checkout Lanes (Cam 4)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    simulationActive 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse' 
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                  }`}>
                    {simulationActive ? 'SIMULATING' : 'ONLINE'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>FPS: {simulationActive ? '30.0' : '0.0'}</span>
                  <span>Zone: Checkout Lanes</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-zinc-900/80 pt-4 mt-6 flex justify-between items-center text-[9px] text-zinc-600 font-mono">
            <span>Hardware Status: Active.</span>
            <span>Total FPS: {simulationActive ? '119.3' : '0.0'}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
