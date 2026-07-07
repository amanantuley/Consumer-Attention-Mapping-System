'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  Map, Plus, LayoutGrid, CheckCircle, Store as StoreIcon, 
  MapPin, Settings, HelpCircle, Layers, Maximize2 
} from 'lucide-react';

interface StoreLayout {
  layout_id: string;
  name: string;
  zones: {
    zone_id: string;
    name: string;
    coordinates: number[][]; // [[x1, y1], [x2, y2]]
  }[];
}

interface ShelfObject {
  id: string;
  store_id: string;
  shelf_name: string;
  zone_coordinates: number[][];
}

export default function StoreLayoutPlanner() {
  const { accessToken } = useAuthStore();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
  const [stores, setStores] = useState<StoreLayout[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreLayout | null>(null);
  const [shelves, setShelves] = useState<ShelfObject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Dialog / Form States
  const [showStoreModal, setShowStoreModal] = useState<boolean>(false);
  const [newStoreName, setNewStoreName] = useState<string>('');
  const [newStoreLocation, setNewStoreLocation] = useState<string>('');
  const [newStoreSize, setNewStoreSize] = useState<string>('5000');

  const [showShelfModal, setShowShelfModal] = useState<boolean>(false);
  const [newShelfName, setNewShelfName] = useState<string>('');
  const [newShelfX1, setNewShelfX1] = useState<number>(100);
  const [newShelfY1, setNewShelfY1] = useState<number>(100);
  const [newShelfX2, setNewShelfX2] = useState<number>(250);
  const [newShelfY2, setNewShelfY2] = useState<number>(150);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchShelves(selectedStore.layout_id);
    } else {
      setShelves([]);
    }
  }, [selectedStore]);

  // Redraw shelves on canvas whenever shelves or selected store changes
  useEffect(() => {
    drawCanvas();
  }, [shelves, selectedStore]);

  const fetchStores = async () => {
    setIsLoading(true);
    setErrorMsg('');
    console.log('[layout-planner] fetchStores - accessToken:', accessToken);
    try {
      const res = await fetch(`${API_BASE}/api/stores/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error('Failed to retrieve store layouts');
      const data = await res.json();
      setStores(data);
      if (data.length > 0 && !selectedStore) {
        setSelectedStore(data[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching layouts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShelves = async (storeId: string) => {
    console.log('[layout-planner] fetchShelves - accessToken:', accessToken, 'storeId:', storeId);
    try {
      const res = await fetch(`${API_BASE}/api/stores/${storeId}/shelves/`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShelves(data);
      }
    } catch (e) {
      console.error('Error fetching shelves list', e);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      console.log('[layout-planner] handleCreateStore - accessToken:', accessToken);
      const res = await fetch(`${API_BASE}/api/stores/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: newStoreName,
          location: newStoreLocation,
          metadata: { size_sqft: parseInt(newStoreSize) || 5000 }
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to create layout');
      }

      const newStore = await res.json();
      setSuccessMsg('Store layout registered successfully!');
      setNewStoreName('');
      setNewStoreLocation('');
      setShowStoreModal(false);
      
      // Reload stores and select the new one
      await fetchStores();
      setSelectedStore(newStore);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    setErrorMsg('');
    setSuccessMsg('');
    
    const coordinates = [
      [newShelfX1, newShelfY1],
      [newShelfX2, newShelfY2]
    ];

    try {
      console.log('[layout-planner] handleCreateShelf - accessToken:', accessToken, 'selectedStore:', selectedStore?.layout_id);
      const res = await fetch(`${API_BASE}/api/stores/${selectedStore.layout_id}/shelves/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          shelf_name: newShelfName,
          zone_coordinates: coordinates
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to register shelf');
      }

      setSuccessMsg(`Shelf "${newShelfName}" placed successfully!`);
      setNewShelfName('');
      setShowShelfModal(false);
      
      // Reload shelves
      fetchShelves(selectedStore.layout_id);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Canvas click listener to place prefilled coordinates
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    // Set coordinates for placing a default sized shelf at the clicked location
    setNewShelfX1(x - 60);
    setNewShelfY1(y - 25);
    setNewShelfX2(x + 60);
    setNewShelfY2(y + 25);

    // If modal is not open, open it
    if (!showShelfModal) {
      setNewShelfName(`Shelf ${shelves.length + 1}`);
      setShowShelfModal(true);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw grid background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    const gridSize = 30;
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

    // 2. Draw border
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // 3. Draw Layout title watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(selectedStore ? selectedStore.name.toUpperCase() : 'NO LAYOUT SELECTED', canvas.width / 2, canvas.height / 2);

    // Instruction subtitle watermark
    ctx.font = '10px monospace';
    ctx.fillText('CLICK CANVAS TO DEFINE SHELF BOUNDS', canvas.width / 2, (canvas.height / 2) + 24);

    // 4. Draw placed shelves
    shelves.forEach((sh, idx) => {
      const coords = sh.zone_coordinates;
      if (!coords || coords.length < 2) return;

      const x1 = coords[0][0];
      const y1 = coords[0][1];
      const x2 = coords[1][0];
      const y2 = coords[1][1];
      const w = x2 - x1;
      const h = y2 - y1;

      // Draw shelf bounding box glow
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.fillRect(x1, y1, w, h);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, w, h);

      // Draw tag box for label
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x1, y1 - 18, Math.max(90, ctx.measureText(sh.shelf_name).width + 12), 18);

      // Label text
      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(sh.shelf_name, x1 + 6, y1 - 5);

      // Small index circle indicator
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x1 + w/2, y1 + h/2, 10, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(idx + 1), x1 + w/2, y1 + h/2 + 3);
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Map className="w-6 h-6 text-emerald-400" /> Store Layout Planner
          </h1>
          <p className="text-zinc-400 text-sm">
            Configure store dimensions, place tracking zones/shelves on the floor plan canvas, and map telemetry coordinates.
          </p>
        </div>
        <button
          onClick={() => setShowStoreModal(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" /> Create Store Layout
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-450 text-xs">
          {errorMsg}
        </div>
      )}
      {accessToken && (
        <div className="p-2 rounded-xl bg-zinc-900/30 border border-zinc-800 text-zinc-400 text-xs">
          Debug token: {accessToken ? `${accessToken.slice(0,8)}...${accessToken.slice(-8)}` : 'none'}
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-450 text-xs">
          {successMsg}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sidebar Controls */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Store Selector Card */}
          <div className="glass-panel p-5 rounded-3xl border border-zinc-800/80">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <StoreIcon className="w-4 h-4 text-emerald-400" /> Select Store Layout
            </h3>
            
            {isLoading ? (
              <div className="py-4 text-center text-xs text-zinc-650">Loading store layouts...</div>
            ) : stores.length === 0 ? (
              <div className="py-4 text-center text-xs text-zinc-550 bg-zinc-950/50 rounded-2xl border border-zinc-900">
                No active store layouts found.
              </div>
            ) : (
              <div className="space-y-2">
                {stores.map((s) => (
                  <button
                    key={s.layout_id}
                    onClick={() => setSelectedStore(s)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all flex justify-between items-center cursor-pointer ${
                      selectedStore?.layout_id === s.layout_id
                        ? 'bg-emerald-950/20 border-emerald-500/50 text-white'
                        : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold truncate">{s.name}</h4>
                      <p className="text-[10px] text-zinc-550 flex items-center gap-1 mt-0.5 font-medium">
                        <MapPin className="w-3 h-3" /> Layout ID: {s.layout_id.slice(0, 8)}...
                      </p>
                    </div>
                    <span className="text-xs bg-zinc-950/60 border border-zinc-850 px-2 py-0.5 rounded text-emerald-450 font-bold font-mono">
                      {s.zones?.length || 0} zones
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shelves List Card */}
          {selectedStore && (
            <div className="glass-panel p-5 rounded-3xl border border-zinc-800/80">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4 text-emerald-400" /> Placed Shelves ({shelves.length})
                </h3>
                <button
                  onClick={() => setShowShelfModal(true)}
                  className="p-1.5 bg-emerald-950/40 border border-emerald-550/30 text-emerald-400 hover:text-white rounded-lg transition-all cursor-pointer"
                  title="Add Shelf"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {shelves.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-550 bg-zinc-950/50 rounded-2xl border border-zinc-900">
                  No shelves configured yet.<br />
                  <span className="text-[10px] text-zinc-650 mt-1 block">Click the canvas to place your first shelf.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {shelves.map((sh, idx) => (
                    <div
                      key={sh.id}
                      className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl flex justify-between items-center text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span className="w-4 h-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] rounded-full flex items-center justify-center font-mono font-bold">
                            {idx + 1}
                          </span>
                          {sh.shelf_name}
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500 mt-1">
                          Bound: [{sh.zone_coordinates?.[0]?.join(',')}] to [{sh.zone_coordinates?.[1]?.join(',')}]
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Visual Canvas layout planner */}
        {selectedStore ? (
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel p-5 rounded-3xl border border-zinc-800/80 flex flex-col">
              <div className="flex justify-between items-center mb-4 text-xs text-zinc-400">
                <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-400" /> Interactive Floor Plan Matrix
                </span>
                <span className="text-zinc-500 font-mono">
                  Viewport: 640x360
                </span>
              </div>

              <div className="relative border border-zinc-800/60 rounded-2xl overflow-hidden shadow-2xl flex justify-center bg-zinc-950 cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  onClick={handleCanvasClick}
                  className="w-full aspect-video object-cover"
                />
              </div>

              <div className="mt-4 flex items-start gap-2.5 text-zinc-550 text-[10px] leading-relaxed">
                <HelpCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-zinc-400 font-semibold">How to draw shelves:</span> Click anywhere on the grid canvas above. An overlay form will prompt you to enter the shelf label. The coordinates will automatically be calculated based on your click target.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 glass-panel p-12 rounded-3xl border border-zinc-800/80 flex flex-col items-center justify-center text-center text-zinc-550 min-h-[300px]">
            <StoreIcon className="w-12 h-12 text-zinc-700 mb-3 animate-pulse" />
            <h3 className="font-bold text-white mb-1">No Store Selected</h3>
            <p className="text-xs max-w-sm">
              Please select an active store layout from the sidebar, or create a new floor plan design to begin plotting shelves.
            </p>
          </div>
        )}

      </div>

      {/* CREATE STORE DIALOG / MODAL */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-[#000000]/80 z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
            
            <h3 className="text-lg font-bold text-white mb-4">Register Store Layout</h3>
            
            <form onSubmit={handleCreateStore} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Floor Plan Name</label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Main Floor Plan"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Store Location</label>
                <input
                  type="text"
                  required
                  value={newStoreLocation}
                  onChange={(e) => setNewStoreLocation(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="New York, NY"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Floor Area (Sq Ft)</label>
                <input
                  type="number"
                  required
                  value={newStoreSize}
                  onChange={(e) => setNewStoreSize(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="5000"
                />
              </div>

              <div className="flex gap-3.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStoreModal(false)}
                  className="flex-1 py-2.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Save Layout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SHELF DIALOG / MODAL */}
      {showShelfModal && (
        <div className="fixed inset-0 bg-[#000000]/80 z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
            
            <h3 className="text-lg font-bold text-white mb-4">Place Shelf on Layout</h3>
            
            <form onSubmit={handleCreateShelf} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Shelf Label / Name</label>
                <input
                  type="text"
                  required
                  value={newShelfName}
                  onChange={(e) => setNewShelfName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Aisle 3 Soda Shelf"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Bound X1 (px)</label>
                  <input
                    type="number"
                    required
                    value={newShelfX1}
                    onChange={(e) => setNewShelfX1(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Bound Y1 (px)</label>
                  <input
                    type="number"
                    required
                    value={newShelfY1}
                    onChange={(e) => setNewShelfY1(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Bound X2 (px)</label>
                  <input
                    type="number"
                    required
                    value={newShelfX2}
                    onChange={(e) => setNewShelfX2(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Bound Y2 (px)</label>
                  <input
                    type="number"
                    required
                    value={newShelfY2}
                    onChange={(e) => setNewShelfY2(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-3.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowShelfModal(false)}
                  className="flex-1 py-2.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Place Shelf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
