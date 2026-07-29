import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { storeAPI } from "@/lib/api";
import type { Camera, Store as StoreType, Shelf } from "@/types";
import { 
  Store, Users, Video, AlertTriangle, Play, RefreshCw, Plus, Trash2, Edit2, 
  Settings, Layers, Box, FileText, Info, X, LogOut
} from "lucide-react";
import { toast } from "react-toastify";

// Import custom SVG charts
import {
  LineChart,
  AreaChart,
  BarChart,
  HorizontalBarChart,
  DonutChart,
  PieChart
} from "@/components/ui/charts";

interface SimulatedShopper {
  shopper_id: string;
  state: string;
  camera_id: number;
  zone: string;
  x: number;
  y: number;
}

interface AlertEvent {
  event_type: string;
  shopper_id: string;
  camera_id: number;
  zone: string;
  message?: string;
  x: number;
  y: number;
  timestamp: number;
}

const StoreManagerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Store, Cameras, Shelves lists
  const [stores, setStores] = useState<StoreType[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<string>("overview");

  // CRUD state variables
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [cameraForm, setCameraForm] = useState({ name: "", stream_url: "", description: "" });

  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [shelfForm, setShelfForm] = useState({ name: "", description: "", camera_id: "" });

  // Real-time simulated tracking streams
  const [activeShoppers, setActiveShoppers] = useState<SimulatedShopper[]>([]);
  const [occupancy, setOccupancy] = useState<number>(0);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  
  // Canvas & WebSockets references
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heatmapDataRef = useRef<{ x: number; y: number; val: number }[]>([]);
  const [hoveredCameraId, setHoveredCameraId] = useState<number | null>(null);

  // Simulation Layout coordinates (600x400 canvas mapping)
  const layoutZones = {
    foyer: { name: "Entrance Foyer", x: 10, y: 10, w: 580, h: 80, color: "rgba(59, 130, 246, 0.08)", stroke: "#3b82f6" },
    aisleLeft: { name: "Main Aisle (Left)", x: 10, y: 110, w: 280, h: 180, color: "rgba(168, 85, 247, 0.08)", stroke: "#a855f7" },
    aisleRight: { name: "Main Aisle (Right)", x: 310, y: 110, w: 280, h: 180, color: "rgba(168, 85, 247, 0.08)", stroke: "#a855f7" },
    checkout: { name: "Checkout Lanes", x: 10, y: 310, w: 580, h: 80, color: "rgba(16, 185, 129, 0.08)", stroke: "#10b981" }
  };

  useEffect(() => {
    fetchStores();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchCameras(selectedStore.id);
      fetchShelves(selectedStore.id);
      connectWebSocket(selectedStore.id);
    }
  }, [selectedStore]);

  const fetchStores = async () => {
    try {
      const res = await storeAPI.getStores();
      setStores(res.data);
      if (res.data.length > 0) {
        setSelectedStore(res.data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    }
  };

  const fetchCameras = async (storeId: number) => {
    try {
      const res = await storeAPI.getCameras(storeId);
      setCameras(res.data);
    } catch (error) {
      console.error("Failed to fetch cameras:", error);
    }
  };

  const fetchShelves = async (storeId: number) => {
    try {
      const res = await storeAPI.getShelves(storeId);
      setShelves(res.data);
    } catch (error) {
      console.error("Failed to fetch shelves:", error);
    }
  };

  const connectWebSocket = (storeId: number) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    const loc = window.location;
    const protocol = loc.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${loc.hostname}:8000/api/v1/video/ws/${storeId}`;
    
    console.log(`Connecting store manager websocket: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.shoppers) {
          setActiveShoppers(data.shoppers);
          setOccupancy(data.occupancy);
          
          data.shoppers.forEach((sh: SimulatedShopper) => {
            heatmapDataRef.current.push({ x: sh.x * 600, y: sh.y * 400, val: 1 });
          });
          if (heatmapDataRef.current.length > 1500) {
            heatmapDataRef.current.shift();
          }
        }
        
        if (data.alerts && data.alerts.length > 0) {
          setAlerts(prev => {
            const combined = [...data.alerts, ...prev];
            return combined.slice(0, 20);
          });
          data.alerts.forEach((alert: AlertEvent) => {
            if (alert.event_type === "product_interaction") {
              toast.info(`${alert.shopper_id} picked a product in ${alert.zone}!`);
            } else if (alert.event_type === "checkout_congestion") {
              toast.warn(alert.message);
            }
          });
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };
  };

  const handleAutoProvisionStore = async () => {
    try {
      const storeRes = await storeAPI.createStore({
        name: "Store 01 - City Mall",
        location: "Silicon Valley Foyer"
      });
      const newStore = storeRes.data;
      
      const camerasList = [
        { name: "Camera 1 (Entrance)", url: "synthetic", desc: "Monitors foyer & entry door." },
        { name: "Camera 2 (Aisle A)", url: "synthetic", desc: "Monitors left-side snack racks." },
        { name: "Camera 3 (Aisle B)", url: "synthetic", desc: "Monitors beverage stands." },
        { name: "Camera 4 (Aisle C)", url: "synthetic", desc: "Monitors cosmetics shelves." },
        { name: "Camera 5 (Aisle D)", url: "synthetic", desc: "Monitors bakery aisle." },
        { name: "Camera 6 (Promotion Area)", url: "synthetic", desc: "Monitors central discounted promotions." },
        { name: "Camera 7 (Checkout)", url: "synthetic", desc: "Monitors billing registries." },
        { name: "Camera 8 (Exit)", url: "synthetic", desc: "Monitors store exit gate." }
      ];

      const createdCams: Camera[] = [];
      for (const cam of camerasList) {
        const camRes = await storeAPI.createCamera(newStore.id, {
          name: cam.name,
          stream_url: cam.url,
          description: cam.desc
        });
        createdCams.push(camRes.data);
      }

      // Automatically map shelves to newly created cameras
      const shelvesList = [
        { name: "Shelf A (Beverages)", desc: "Beverages section monitored by Cam 3", camIdx: 2 },
        { name: "Shelf B (Snacks)", desc: "Snacks display monitored by Cam 2", camIdx: 1 },
        { name: "Shelf C (Cosmetics)", desc: "Beauty counter monitored by Cam 4", camIdx: 3 },
        { name: "Shelf D (Bakery)", desc: "Bakery table monitored by Cam 5", camIdx: 4 },
        { name: "Shelf E (Pharmacy)", desc: "Pharmacy cabinet monitored by Cam 6", camIdx: 5 }
      ];

      for (const sh of shelvesList) {
        const boundCam = createdCams[sh.camIdx] || null;
        await storeAPI.createShelf(newStore.id, {
          name: sh.name,
          description: sh.desc,
          camera_id: boundCam ? boundCam.id : null
        });
      }

      toast.success("Flagship virtual store, 8 cameras, and 5 shelves mapped in database!");
      fetchStores();
    } catch (err) {
      toast.error("Auto provision failed.");
    }
  };

  // CRUD actions for Cameras
  const handleSaveCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    try {
      if (editingCamera) {
        await storeAPI.updateCamera(selectedStore.id, editingCamera.id, cameraForm);
        toast.success("Camera details updated successfully!");
      } else {
        await storeAPI.createCamera(selectedStore.id, cameraForm);
        toast.success("New camera registered successfully!");
      }
      setIsCameraModalOpen(false);
      setEditingCamera(null);
      setCameraForm({ name: "", stream_url: "", description: "" });
      fetchCameras(selectedStore.id);
    } catch (err) {
      toast.error("Failed to save camera.");
    }
  };

  const handleDeleteCamera = async (cameraId: number) => {
    if (!selectedStore) return;
    if (!confirm("Are you sure you want to delete this camera?")) return;
    try {
      await storeAPI.deleteCamera(selectedStore.id, cameraId);
      toast.success("Camera deleted successfully.");
      fetchCameras(selectedStore.id);
    } catch (err) {
      toast.error("Failed to delete camera.");
    }
  };

  // CRUD actions for Shelves
  const handleSaveShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    try {
      const parsedCamId = shelfForm.camera_id ? parseInt(shelfForm.camera_id) : null;
      const dataToSave = {
        name: shelfForm.name,
        description: shelfForm.description,
        camera_id: parsedCamId
      };
      
      if (editingShelf) {
        await storeAPI.updateShelf(selectedStore.id, editingShelf.id, dataToSave);
        toast.success("Shelf mapped successfully!");
      } else {
        await storeAPI.createShelf(selectedStore.id, dataToSave);
        toast.success("New shelf created successfully!");
      }
      setIsShelfModalOpen(false);
      setEditingShelf(null);
      setShelfForm({ name: "", description: "", camera_id: "" });
      fetchShelves(selectedStore.id);
    } catch (err) {
      toast.error("Failed to save shelf.");
    }
  };

  const handleDeleteShelf = async (shelfId: number) => {
    if (!selectedStore) return;
    if (!confirm("Are you sure you want to delete this shelf?")) return;
    try {
      await storeAPI.deleteShelf(selectedStore.id, shelfId);
      toast.success("Shelf deleted.");
      fetchShelves(selectedStore.id);
    } catch (err) {
      toast.error("Failed to delete shelf.");
    }
  };

  // Canvas drawing effect for Heatmaps & Coverage Cones mapping
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 600, 400);

    // Floor Grid lines
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let x = 0; x < 600; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 400); ctx.stroke();
    }
    for (let y = 0; y < 400; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(600, y); ctx.stroke();
    }

    // Zone outlines
    Object.values(layoutZones).forEach((zone) => {
      ctx.fillStyle = zone.color;
      ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
      ctx.strokeStyle = zone.stroke;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
      
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(zone.name, zone.x + 8, zone.y + 16);
    });

    // Draw shelves mapped visually
    shelves.forEach((shelf, idx) => {
      // position shelves dynamically based on index in Aisle zones
      const isLeft = idx % 2 === 0;
      const xOffset = isLeft ? 40 : 340;
      const yOffset = 130 + Math.floor(idx / 2) * 50;

      ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
      ctx.fillRect(xOffset, yOffset, 200, 30);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(xOffset, yOffset, 200, 30);

      ctx.fillStyle = "#f59e0b";
      ctx.font = "9px sans-serif";
      ctx.fillText(shelf.name, xOffset + 8, yOffset + 18);

      // Draw camera monitoring line if assigned
      if (shelf.camera_id) {
        const associatedCamIdx = cameras.findIndex(c => c.id === shelf.camera_id);
        const camX = associatedCamIdx !== -1 ? 50 + (associatedCamIdx * 65) % 500 : 300;
        const camY = 15;

        // Draw dotted camera monitoring line
        ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(camX, camY);
        ctx.lineTo(xOffset + 100, yOffset + 15);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Draw camera nodes at top row
    cameras.forEach((camera, index) => {
      const x = 50 + (index * 65) % 500;
      const y = 15;

      // Draw camera cone if hovered
      if (hoveredCameraId === camera.id) {
        ctx.fillStyle = "rgba(59, 130, 246, 0.12)";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 50, y + 150);
        ctx.lineTo(x + 50, y + 150);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = hoveredCameraId === camera.id ? "#3b82f6" : "#64748b";
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8px sans-serif";
      ctx.fillText(`C${index + 1}`, x - 5, y - 10);
    });

    // Real-time shopper trajectory paths draw
    activeShoppers.forEach((shopper) => {
      const xPix = shopper.x * 600;
      const yPix = shopper.y * 400;

      ctx.fillStyle = "#60a5fa";
      ctx.beginPath(); ctx.arc(xPix, yPix, 5, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [activeShoppers, cameras, shelves, hoveredCameraId]);

  // Static metric mockups matching John Manager mock designs
  const visitorsHour = [
    { label: "9 AM", value: 45 },
    { label: "11 AM", value: 110 },
    { label: "1 PM", value: 175 },
    { label: "3 PM", value: 245 },
    { label: "5 PM", value: 165 },
    { label: "7 PM", value: 130 },
    { label: "9 PM", value: 48 }
  ];

  const zoneTraffic = [
    { label: "Entrance", value: 120 },
    { label: "Aisle A", value: 86 },
    { label: "Aisle B", value: 132 },
    { label: "Aisle C", value: 94 },
    { label: "Aisle D", value: 74 },
    { label: "Checkout", value: 42 }
  ];

  const shelfStats = [
    { label: "Shelf A (Snacks)", value: 92 },
    { label: "Shelf B (Beverages)", value: 74 },
    { label: "Shelf C (Cosmetics)", value: 38 },
    { label: "Shelf D (Bakery)", value: 28 }
  ];

  const productStats = [
    { label: "Picked", value: 362 },
    { label: "Viewed", value: 428 },
    { label: "Returned", value: 96 },
    { label: "Compared", value: 114 }
  ];

  const topPicked = [
    { rank: 1, name: "Coca Cola 500ml", category: "Beverages", count: 48, change: "+12%" },
    { rank: 2, name: "Lays Classic 52g", category: "Snacks", count: 43, change: "+7%" },
    { rank: 3, name: "Parle-G 120g", category: "Biscuits", count: 37, change: "+3%" },
    { rank: 4, name: "Amazon Water 1L", category: "Beverages", count: 32, change: "+8%" },
    { rank: 5, name: "Maggi 2-Minute", category: "Noodles", count: 28, change: "+5%" }
  ];

  const sidebarLinks = [
    { id: "overview", label: "Overview", icon: Store },
    { id: "cameras", label: "Cameras", icon: Video },
    { id: "visitors", label: "Visitors", icon: Users },
    { id: "shelves", label: "Shelves", icon: Layers },
    { id: "products", label: "Products", icon: Box },
    { id: "alerts", label: "Alerts", icon: AlertTriangle },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex bg-[#070e17] text-slate-100 min-h-screen">
      
      {/* Sub Sidebar inside Store Manager Dashboard */}
      <div className="w-56 bg-[#0c1524] border-r border-slate-800 p-4 flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2 py-3 border-b border-slate-800/60">
            <Layers className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-xs tracking-wider uppercase text-slate-200">Store Manager Dashboard</span>
          </div>
          <nav className="space-y-1.5">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                      : "text-slate-400 hover:bg-[#121f35] hover:text-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </nav>
          
          <div className="pt-4 px-2">
            <button
              onClick={handleAutoProvisionStore}
              className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold tracking-wider uppercase border border-slate-700 transition-colors"
            >
              <Play className="w-3 h-3 text-emerald-500" />
              Provision Store
            </button>
          </div>
        </div>

        <div className="p-2 border-t border-slate-800/60">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#070e17]">
        <div className="max-w-[1400px] mx-auto w-full space-y-6">
        
        {/* Dashboard Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Store Operations Manager</span>
            <h1 className="text-2xl font-extrabold text-slate-100 mt-1">
              Welcome back, {user?.full_name || user?.username || "Store Manager"}!
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Store Location:</span>
            <Select
              value={selectedStore?.id.toString()}
              onValueChange={(val) => {
                const store = stores.find(s => s.id === parseInt(val));
                if (store) setSelectedStore(store);
              }}
            >
              <SelectTrigger className="w-48 bg-[#0c1524] border-slate-850 text-white text-xs">
                <SelectValue placeholder="Select Store" />
              </SelectTrigger>
              <SelectContent className="bg-[#0c1524] text-white text-xs border-slate-800">
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button 
              onClick={() => {
                fetchStores();
                if (selectedStore) {
                  fetchCameras(selectedStore.id);
                  fetchShelves(selectedStore.id);
                }
              }} 
              className="p-2 bg-[#0c1524] border border-slate-800 rounded hover:bg-[#121f35]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* VIEW 1: OVERVIEW */}
        {/* ---------------------------------------------------- */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardContent className="pt-4 pb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Visitors</p>
                  <h3 className="text-xl font-extrabold text-blue-400 mt-1">1,248</h3>
                  <span className="text-[9px] text-emerald-400 flex items-center mt-1">↑ 12.5% vs yesterday</span>
                </CardContent>
              </Card>

              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardContent className="pt-4 pb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Customers</p>
                  <h3 className="text-xl font-extrabold text-emerald-400 mt-1">{occupancy || 78}</h3>
                  <span className="text-[9px] text-slate-400 flex items-center mt-1">Live inside store</span>
                </CardContent>
              </Card>

              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardContent className="pt-4 pb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg. Dwell Time</p>
                  <h3 className="text-xl font-extrabold text-purple-400 mt-1">3m 42s</h3>
                  <span className="text-[9px] text-emerald-400 flex items-center mt-1">↑ 8.3% vs yesterday</span>
                </CardContent>
              </Card>

              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardContent className="pt-4 pb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Products Picked</p>
                  <h3 className="text-xl font-extrabold text-amber-400 mt-1">362</h3>
                  <span className="text-[9px] text-emerald-400 flex items-center mt-1">↑ 15.7% vs yesterday</span>
                </CardContent>
              </Card>

              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardContent className="pt-4 pb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conversion Rate</p>
                  <h3 className="text-xl font-extrabold text-pink-400 mt-1">24.6%</h3>
                  <span className="text-[9px] text-emerald-400 flex items-center mt-1">↑ 5.6% vs yesterday</span>
                </CardContent>
              </Card>

              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardContent className="pt-4 pb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cameras Online</p>
                  <h3 className="text-xl font-extrabold text-indigo-400 mt-1">{cameras.length || "8/8"}</h3>
                  <span className="text-[9px] text-slate-400 flex items-center mt-1">All cameras broadcasting</span>
                </CardContent>
              </Card>
            </div>

            {/* Live Cameras & Floor Plan Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Live Camera registers feed block */}
              <div className="lg:col-span-1 bg-[#0c1524] border border-slate-800 rounded-xl p-4 flex flex-col h-[400px]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Camera Feeds</h3>
                  <button onClick={() => setActiveTab("cameras")} className="text-[10px] text-blue-400 hover:underline">Manage</button>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {cameras.length === 0 ? (
                    <div className="text-slate-500 text-xs text-center py-10">No cameras registered. Please provision store.</div>
                  ) : (
                    cameras.map((camera) => (
                      <div 
                        key={camera.id}
                        onMouseEnter={() => setHoveredCameraId(camera.id)}
                        onMouseLeave={() => setHoveredCameraId(null)}
                        className={`p-2.5 rounded-lg border flex justify-between items-center cursor-pointer transition-all ${
                          hoveredCameraId === camera.id ? "bg-[#162740] border-blue-500" : "bg-[#0f1c2d] border-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Video className="w-4.5 h-4.5 text-blue-400" />
                          <div>
                            <p className="text-[11px] font-bold text-slate-200 truncate max-w-[120px]">{camera.name}</p>
                            <p className="text-[9px] text-slate-450 mt-0.5">Stream: {camera.stream_url}</p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1.5 text-[9px] font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-900/50">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                          Online
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Floor Plan Layout Canvas */}
              <div className="lg:col-span-2 bg-[#0c1524] border border-slate-800 rounded-xl p-4 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Section 7: Store Traffic Heatmap Overlay</h3>
                  <span className="text-[9px] text-red-500 bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded font-bold uppercase">Simulated Real-Time</span>
                </div>
                <div className="border border-slate-800/80 rounded-lg bg-[#070e17] overflow-hidden w-full flex justify-center">
                  <canvas ref={canvasRef} width={600} height={400} className="block max-w-full" />
                </div>
              </div>

            </div>

            {/* Traffic and Analytics Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader className="py-3 border-b border-slate-800/60"><CardTitle className="text-xs font-bold uppercase">Visitors by Hour</CardTitle></CardHeader>
                <CardContent className="pt-4"><LineChart data={visitorsHour} color="#3b82f6" height={130} /></CardContent>
              </Card>

              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader className="py-3 border-b border-slate-800/60"><CardTitle className="text-xs font-bold uppercase">Customers by Zone</CardTitle></CardHeader>
                <CardContent className="pt-4"><BarChart data={zoneTraffic} color="#6366f1" height={130} /></CardContent>
              </Card>

              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader className="py-3 border-b border-slate-800/60"><CardTitle className="text-xs font-bold uppercase">Top Shelf Performance</CardTitle></CardHeader>
                <CardContent className="pt-4"><HorizontalBarChart data={shelfStats} color="#a855f7" height={130} /></CardContent>
              </Card>

              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader className="py-3 border-b border-slate-800/60"><CardTitle className="text-xs font-bold uppercase">Product Interaction</CardTitle></CardHeader>
                <CardContent className="pt-4"><DonutChart data={productStats} height={130} /></CardContent>
              </Card>
            </div>

            {/* Bottom Row: Top Picked Products, Recent Activities, Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Top Picked Products Table */}
              <Card className="lg:col-span-1 bg-[#0c1524] border-slate-800 text-white">
                <CardHeader className="py-3 border-b border-slate-800/60"><CardTitle className="text-xs font-bold uppercase">Top Picked Products</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="bg-[#0a0f18] text-slate-500 border-b border-slate-800">
                        <th className="p-2.5 pl-4">Rank</th>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5 text-right pr-4">Picked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {topPicked.map((prod) => (
                        <tr key={prod.rank} className="hover:bg-slate-800/20">
                          <td className="p-2.5 pl-4 font-bold text-slate-400">{prod.rank}</td>
                          <td className="p-2.5 text-slate-200">
                            {prod.name}
                            <div className="text-[9px] text-slate-500">{prod.category}</div>
                          </td>
                          <td className="p-2.5 text-right font-semibold text-emerald-400 pr-4">{prod.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Recent Activities Log */}
              <Card className="lg:col-span-1 bg-[#0c1524] border-slate-800 text-white flex flex-col h-[280px]">
                <CardHeader className="py-3 border-b border-slate-800/60"><CardTitle className="text-xs font-bold uppercase">Recent Activities</CardTitle></CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  <div className="divide-y divide-slate-850 text-[10px]">
                    {[
                      { time: "10:24 AM", desc: "High crowd detected in Aisle B", status: "warn" },
                      { time: "10:18 AM", desc: "Shelf C attention dropped below threshold", status: "info" },
                      { time: "10:15 AM", desc: "Camera 6 (Promotion Area) went offline", status: "error" },
                      { time: "10:10 AM", desc: "Long queue detected at Checkout", status: "warn" },
                      { time: "10:08 AM", desc: "Product Rice Bag 5kg is out of stock", status: "info" }
                    ].map((act, i) => (
                      <div key={i} className="p-3 flex items-start gap-2 hover:bg-slate-800/10">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                          act.status === "error" ? "bg-red-500" : act.status === "warn" ? "bg-amber-500" : "bg-blue-500"
                        }`} />
                        <div>
                          <p className="font-semibold text-slate-200">{act.desc}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{act.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Buttons */}
              <Card className="lg:col-span-1 bg-[#0c1524] border-slate-800 text-white">
                <CardHeader className="py-3 border-b border-slate-800/60"><CardTitle className="text-xs font-bold uppercase">Quick Actions</CardTitle></CardHeader>
                <CardContent className="pt-4 grid grid-cols-2 gap-3 h-52">
                  <button onClick={() => setActiveTab("reports")} className="p-3 bg-[#111c2c] hover:bg-[#16273f] border border-slate-800 rounded-lg flex flex-col justify-between text-left transition-colors">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-bold mt-2">View Reports</span>
                  </button>
                  <button onClick={() => setActiveTab("cameras")} className="p-3 bg-[#111c2c] hover:bg-[#16273f] border border-slate-800 rounded-lg flex flex-col justify-between text-left transition-colors">
                    <Video className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold mt-2">Manage Cameras</span>
                  </button>
                  <button onClick={() => setActiveTab("alerts")} className="p-3 bg-[#111c2c] hover:bg-[#16273f] border border-slate-800 rounded-lg flex flex-col justify-between text-left transition-colors">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-bold mt-2">Add Alert</span>
                  </button>
                  <button onClick={() => setActiveTab("settings")} className="p-3 bg-[#111c2c] hover:bg-[#16273f] border border-slate-800 rounded-lg flex flex-col justify-between text-left transition-colors">
                    <Settings className="w-5 h-5 text-purple-400" />
                    <span className="text-xs font-bold mt-2">Store Settings</span>
                  </button>
                </CardContent>
              </Card>

            </div>

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 2: CAMERAS (CRUD PANEL) */}
        {/* ---------------------------------------------------- */}
        {activeTab === "cameras" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Live Camera Ingestion Network</h2>
                <p className="text-xs text-slate-400">Add, edit, or delete store camera streams and view live status indicators.</p>
              </div>
              <button
                onClick={() => {
                  setEditingCamera(null);
                  setCameraForm({ name: "", stream_url: "", description: "" });
                  setIsCameraModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-md shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Register Camera
              </button>
            </div>

            {/* Cameras Table */}
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#0a0f18] text-slate-400 border-b border-slate-800 font-bold">
                      <th className="p-4">Name</th>
                      <th className="p-4">Stream URL</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {cameras.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500 font-medium">No cameras registered for this store. Click "Register Camera" or "Provision Store".</td>
                      </tr>
                    ) : (
                      cameras.map((camera) => (
                        <tr key={camera.id} className="hover:bg-slate-800/10 transition-colors">
                          <td className="p-4 font-bold text-slate-200">{camera.name}</td>
                          <td className="p-4 font-mono text-[11px] text-slate-400">{camera.stream_url}</td>
                          <td className="p-4 text-slate-400 truncate max-w-[200px]">{camera.description || "—"}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-900/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Active
                            </span>
                          </td>
                          <td className="p-4 text-right pr-6">
                            <div className="inline-flex gap-2.5">
                              <button 
                                onClick={() => {
                                  setEditingCamera(camera);
                                  setCameraForm({ 
                                    name: camera.name, 
                                    stream_url: camera.stream_url, 
                                    description: camera.description || "" 
                                  });
                                  setIsCameraModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteCamera(camera.id)}
                                className="p-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-400 rounded border border-red-900/50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Camera CRUD modal overlay */}
            {isCameraModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
                <div className="bg-[#0c1524] border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
                  <button 
                    onClick={() => setIsCameraModalOpen(false)}
                    className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <h3 className="text-base font-bold text-slate-100 mb-4">
                    {editingCamera ? "Edit Camera Settings" : "Register Camera Ingestion Stream"}
                  </h3>
                  <form onSubmit={handleSaveCamera} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="camName" className="text-xs text-slate-300">Camera Name</Label>
                      <input 
                        id="camName" 
                        required
                        type="text" 
                        placeholder="e.g. Aisle 3 Entrance"
                        value={cameraForm.name} 
                        onChange={(e) => setCameraForm({ ...cameraForm, name: e.target.value })}
                        className="w-full bg-[#070e17] border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="camStream" className="text-xs text-slate-300">Stream URL (or synthetic)</Label>
                      <input 
                        id="camStream" 
                        required
                        type="text" 
                        placeholder="e.g. rtsp://192.168.1.100/live"
                        value={cameraForm.stream_url} 
                        onChange={(e) => setCameraForm({ ...cameraForm, stream_url: e.target.value })}
                        className="w-full bg-[#070e17] border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="camDesc" className="text-xs text-slate-300">Description</Label>
                      <textarea 
                        id="camDesc" 
                        placeholder="Description of target zone coverage"
                        value={cameraForm.description} 
                        onChange={(e) => setCameraForm({ ...cameraForm, description: e.target.value })}
                        className="w-full bg-[#070e17] border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 h-20 resize-none focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-md shadow-blue-500/10"
                    >
                      Save Configuration
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 3: VISITORS */}
        {/* ---------------------------------------------------- */}
        {activeTab === "visitors" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-100">Visitor Demographics & Footfall</h2>
            <p className="text-xs text-slate-400">Detailed analytics on unique shopper walk-ins, retention ratios, and peak traffic hours.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">New vs Returning Visitors</CardTitle></CardHeader>
                <CardContent className="pt-2">
                  <PieChart data={[
                    { label: "New Visitors", value: 896 },
                    { label: "Returning", value: 352 }
                  ]} height={200} />
                </CardContent>
              </Card>

              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Visitor Retention Dwell Range</CardTitle></CardHeader>
                <CardContent className="pt-2">
                  <DonutChart data={[
                    { label: "0-2 mins", value: 45 },
                    { label: "2-5 mins", value: 120 },
                    { label: "5-10 mins", value: 210 },
                    { label: "10+ mins", value: 85 }
                  ]} height={200} />
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader><CardTitle className="text-xs font-bold uppercase">Weekly Visitors Footfall Trend</CardTitle></CardHeader>
              <CardContent className="pt-4">
                <AreaChart data={[
                  { label: "Mon", value: 320 },
                  { label: "Tue", value: 390 },
                  { label: "Wed", value: 410 },
                  { label: "Thu", value: 380 },
                  { label: "Fri", value: 540 },
                  { label: "Sat", value: 780 },
                  { label: "Sun", value: 710 }
                ]} color="#3b82f6" height={180} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 4: SHELVES (CRUD PANEL WITH CAMERA MAPS) */}
        {/* ---------------------------------------------------- */}
        {activeTab === "shelves" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Retail Shelves & Camera Coverage</h2>
                <p className="text-xs text-slate-400">Configure shelf zones, map them to specific cameras, and track engagement scores.</p>
              </div>
              <button
                onClick={() => {
                  setEditingShelf(null);
                  setShelfForm({ name: "", description: "", camera_id: "" });
                  setIsShelfModalOpen(true);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-md shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Map Shelf Area
              </button>
            </div>

            {/* Shelves list Table */}
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#0a0f18] text-slate-400 border-b border-slate-800 font-bold">
                      <th className="p-4">Shelf Area</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Monitored By Camera</th>
                      <th className="p-4">Dwell Attention Score</th>
                      <th className="p-4 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {shelves.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500 font-medium">No shelf mapping configured yet. Please configure shelves.</td>
                      </tr>
                    ) : (
                      shelves.map((shelf) => {
                        const assignedCam = cameras.find(c => c.id === shelf.camera_id);
                        return (
                          <tr key={shelf.id} className="hover:bg-slate-800/10 transition-colors">
                            <td className="p-4 font-bold text-slate-200">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-amber-500" />
                                {shelf.name}
                              </div>
                            </td>
                            <td className="p-4 text-slate-400">{shelf.description || "—"}</td>
                            <td className="p-4">
                              {assignedCam ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-900/40">
                                  <Video className="w-3 h-3 text-blue-400" />
                                  {assignedCam.name} (ID: {assignedCam.id})
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-semibold italic">Unmonitored (No Camera assigned)</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-200 font-bold">78%</span>
                                <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full" style={{ width: "78%" }} />
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-right pr-6">
                              <div className="inline-flex gap-2.5">
                                <button 
                                  onClick={() => {
                                    setEditingShelf(shelf);
                                    setShelfForm({ 
                                      name: shelf.name, 
                                      description: shelf.description || "", 
                                      camera_id: shelf.camera_id ? shelf.camera_id.toString() : ""
                                    });
                                    setIsShelfModalOpen(true);
                                  }}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteShelf(shelf.id)}
                                  className="p-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-400 rounded border border-red-900/50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Shelf CRUD modal overlay */}
            {isShelfModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
                <div className="bg-[#0c1524] border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
                  <button 
                    onClick={() => setIsShelfModalOpen(false)}
                    className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <h3 className="text-base font-bold text-slate-100 mb-4">
                    {editingShelf ? "Modify Shelf Mapping" : "Provision Shelf Layout Area"}
                  </h3>
                  <form onSubmit={handleSaveShelf} className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="shelfName" className="text-xs text-slate-300">Shelf Name / Zone</Label>
                      <input 
                        id="shelfName" 
                        required
                        type="text" 
                        placeholder="e.g. Shelf A - Snacks"
                        value={shelfForm.name} 
                        onChange={(e) => setShelfForm({ ...shelfForm, name: e.target.value })}
                        className="w-full bg-[#070e17] border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="shelfCam" className="text-xs text-slate-300">Assign Monitoring Camera</Label>
                      <select 
                        id="shelfCam"
                        value={shelfForm.camera_id}
                        onChange={(e) => setShelfForm({ ...shelfForm, camera_id: e.target.value })}
                        className="w-full bg-[#070e17] border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">No Camera Assigned</option>
                        {cameras.map((camera) => (
                          <option key={camera.id} value={camera.id.toString()}>
                            {camera.name} (Stream: {camera.stream_url})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="shelfDesc" className="text-xs text-slate-300">Description</Label>
                      <textarea 
                        id="shelfDesc" 
                        placeholder="e.g. Snack shelves containing potato chips."
                        value={shelfForm.description} 
                        onChange={(e) => setShelfForm({ ...shelfForm, description: e.target.value })}
                        className="w-full bg-[#070e17] border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 h-20 resize-none focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-md shadow-blue-500/10"
                    >
                      Save Shelf Area
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 5: PRODUCTS */}
        {/* ---------------------------------------------------- */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-100">Product Attraction Logs</h2>
            <p className="text-xs text-slate-400">Analyze shelf items picked, returned, or compared by shoppers in real time.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Attraction Rank</CardTitle></CardHeader>
                <CardContent className="pt-2">
                  <HorizontalBarChart data={[
                    { label: "Coca Cola 500ml", value: 92 },
                    { label: "Lays Classic 52g", value: 84 },
                    { label: "Organic Herb Tea", value: 67 },
                    { label: "Citrus Punch", value: 53 }
                  ]} color="#ec4899" />
                </CardContent>
              </Card>

              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Product Pickups Trend (Hourly)</CardTitle></CardHeader>
                <CardContent className="pt-4">
                  <LineChart data={[
                    { label: "10 AM", value: 8 },
                    { label: "12 PM", value: 25 },
                    { label: "2 PM", value: 48 },
                    { label: "4 PM", value: 36 },
                    { label: "6 PM", value: 65 }
                  ]} color="#10b981" />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 6: ALERTS */}
        {/* ---------------------------------------------------- */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-100">Store Alerts Timeline</h2>
            <p className="text-xs text-slate-400">Rolling register of layout anomalies, queue bottleneck warnings, and low-attention shelf notifications.</p>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <Card className="p-8 text-center text-slate-500 font-medium bg-[#0c1524] border-slate-800">No active alerts. Store is running smoothly.</Card>
              ) : (
                alerts.map((alert, i) => (
                  <Card key={i} className="bg-[#0c1524] border-slate-800 text-slate-200">
                    <CardContent className="pt-4 flex items-start gap-4">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-sm">
                          {alert.event_type === "checkout_congestion" ? "Queue Bottleneck warning" : "Product interaction Alert"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {alert.message || `${alert.shopper_id} interacted with items in ${alert.zone}`}
                        </p>
                        <span className="text-[10px] text-slate-500 mt-2 block">Timestamp: {new Date(alert.timestamp * 1000).toLocaleTimeString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 7: REPORTS */}
        {/* ---------------------------------------------------- */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-100">Performance Reports Download Portal</h2>
            <p className="text-xs text-slate-400">Generate and download store reports containing dwell times, conversion rates, and camera metrics.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white p-4 space-y-4 hover:border-slate-700 transition-all">
                <FileText className="w-8 h-8 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold">Daily Store Report</h3>
                  <p className="text-xs text-slate-500 mt-1">Overview of today's customer traffic, peaks, and alert counts.</p>
                </div>
                <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold">Generate PDF</button>
              </Card>

              <Card className="bg-[#0c1524] border-slate-800 text-white p-4 space-y-4 hover:border-slate-700 transition-all">
                <FileText className="w-8 h-8 text-purple-400" />
                <div>
                  <h3 className="text-sm font-bold">Weekly Performance Report</h3>
                  <p className="text-xs text-slate-500 mt-1">Sankey diagram traffic flow and shelf dwell duration comparisons.</p>
                </div>
                <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold">Generate PDF</button>
              </Card>

              <Card className="bg-[#0c1524] border-slate-800 text-white p-4 space-y-4 hover:border-slate-700 transition-all">
                <FileText className="w-8 h-8 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">Monthly Store Audit</h3>
                  <p className="text-xs text-slate-500 mt-1">Long-term product attraction score and campaign conversion ratios.</p>
                </div>
                <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold">Generate PDF</button>
              </Card>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 8: SETTINGS */}
        {/* ---------------------------------------------------- */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-100">Store Settings & Preferences</h2>
            <p className="text-xs text-slate-400">Configure retail store preferences, alerts settings, and general preferences.</p>

            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader><CardTitle className="text-xs font-bold uppercase">Virtual Store Profile Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Store Name</Label>
                    <input 
                      disabled
                      type="text" 
                      value={selectedStore?.name || ""} 
                      className="w-full bg-[#070e17] border border-slate-800 rounded px-3 py-2 text-xs text-slate-350 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Location</Label>
                    <input 
                      disabled
                      type="text" 
                      value={selectedStore?.location || ""} 
                      className="w-full bg-[#070e17] border border-slate-800 rounded px-3 py-2 text-xs text-slate-350 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-[10px]">
                  <Info className="w-3.5 h-3.5" />
                  <span>These configurations are globally managed by system Administrators.</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader><CardTitle className="text-xs font-bold uppercase">Alert Thresholds</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold">Overcrowding Alert Threshold</p>
                    <p className="text-[10px] text-slate-400">Trigger warnings when shoppers count in a zone exceeds limit.</p>
                  </div>
                  <select className="bg-[#070e17] border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200">
                    <option>5 Shoppers</option>
                    <option>8 Shoppers</option>
                    <option>10 Shoppers</option>
                  </select>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-850">
                  <div>
                    <p className="text-xs font-bold">Queue Bottleneck Detection</p>
                    <p className="text-[10px] text-slate-400">Trigger warnings when checkout waiting queue exceeds limit.</p>
                  </div>
                  <select className="bg-[#070e17] border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200">
                    <option>3 Customers</option>
                    <option>5 Customers</option>
                    <option>8 Customers</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        </div>
      </div>

    </div>
  );
};

export default StoreManagerDashboard;
