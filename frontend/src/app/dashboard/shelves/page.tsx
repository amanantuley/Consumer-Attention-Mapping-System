'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  LayoutGrid, Plus, Trash, ArrowRight, MapPin, Video, 
  Layers, Settings, RefreshCw, AlertCircle
} from 'lucide-react';

interface ShelfItem {
  id: string;
  store_id: string;
  shelf_name: string;
  camera_id: number | null;
  zone_coordinates: number[][] | null;
}

interface StoreItem {
  layout_id: string;
  name: string;
}

interface CameraItem {
  id: string;
  name: string;
}

export default function ShelvesManagement() {
  const router = useRouter();
  const { user, accessToken, initialize } = useAuthStore();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user && user.role !== 'administrator' && user.role !== 'store_manager') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const [shelves, setShelves] = useState<ShelfItem[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Form states
  const [showShelfModal, setShowShelfModal] = useState<boolean>(false);
  const [newShelfName, setNewShelfName] = useState<string>('');
  const [newShelfX1, setNewShelfX1] = useState<number>(100);
  const [newShelfY1, setNewShelfY1] = useState<number>(100);
  const [newShelfX2, setNewShelfX2] = useState<number>(250);
  const [newShelfY2, setNewShelfY2] = useState<number>(150);

  useEffect(() => {
    if (accessToken) {
      fetchStores();
      fetchCameras();
    }
  }, [accessToken]);

  useEffect(() => {
    if (selectedStoreId) {
      fetchShelves(selectedStoreId);
    } else {
      setShelves([]);
    }
  }, [selectedStoreId]);

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
          setSelectedStoreId(data[0].layout_id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCameras = async () => {
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/cameras/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCameras(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchShelves = async (storeId: string) => {
    setIsLoading(true);
    setErrorMsg('');
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/stores/${storeId}/shelves/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShelves(data);
      } else {
        throw new Error('Failed to retrieve shelves list');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching shelves');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) return;
    setErrorMsg('');
    setSuccessMsg('');
    const coordinates = [
      [newShelfX1, newShelfY1],
      [newShelfX2, newShelfY2]
    ];

    const token = accessToken || localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE}/api/stores/${selectedStoreId}/shelves/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shelf_name: newShelfName,
          zone_coordinates: coordinates
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to place shelf');
      }

      setSuccessMsg(`Shelf "${newShelfName}" successfully registered!`);
      setNewShelfName('');
      setShowShelfModal(false);
      fetchShelves(selectedStoreId);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-emerald-400" /> Shelves Management
          </h1>
          <p className="text-zinc-400 text-sm">
            Allocate and list physical shelving zones, associate CCTV camera models, and direct coordinates via the layout planner.
          </p>
        </div>

        <button
          onClick={() => setShowShelfModal(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-lg shadow-emerald-500/10 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Shelf Node
        </button>
      </div>

      {/* Selector and notification */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-450 text-xs">
          {successMsg}
        </div>
      )}

      {/* Main Shelves Config Table Panel */}
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" /> Shelf Nodes Map
          </h3>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs text-zinc-500 font-semibold uppercase tracking-wider whitespace-nowrap">Filter Store:</label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 w-full sm:w-56"
            >
              {stores.map((st) => (
                <option key={st.layout_id} value={st.layout_id}>{st.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-semibold">
                <th className="py-4 px-4">Shelf Name</th>
                <th className="py-4 px-4">Coordinates (Canvas Bounds)</th>
                <th className="py-4 px-4">Associated CCTV Camera</th>
                <th className="py-4 px-4 text-right">Layout Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-300">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500">
                    Loading shelves...
                  </td>
                </tr>
              ) : shelves.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-550">
                    No shelves configured for this store location. Click "Add Shelf Node" or click on the layout planner.
                  </td>
                </tr>
              ) : (
                shelves.map((sh) => (
                  <tr key={sh.id} className="hover:bg-zinc-900/30 transition-all">
                    <td className="py-4 px-4 font-semibold text-white">{sh.shelf_name}</td>
                    <td className="py-4 px-4 font-mono text-[10px] text-zinc-500">
                      {sh.zone_coordinates 
                        ? `[${sh.zone_coordinates[0].join(', ')}] to [${sh.zone_coordinates[1].join(', ')}]`
                        : 'Not set (draw on canvas)'}
                    </td>
                    <td className="py-4 px-4 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-zinc-550" />
                      <span>{sh.camera_id ? `Ingestion ID: ${sh.camera_id}` : 'Entrance Camera (Simulation)'}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => router.push('/dashboard/layout-planner')}
                        className="py-1.5 px-3 border border-zinc-800 hover:bg-zinc-900 hover:text-white text-emerald-450 rounded-lg font-bold transition-all text-[10px] cursor-pointer inline-flex items-center gap-1"
                      >
                        Map Canvas <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Shelf Modal */}
      {showShelfModal && (
        <div className="fixed inset-0 bg-[#000000]/80 z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
            
            <h3 className="text-lg font-bold text-white mb-4">Add Shelf Node</h3>
            
            <form onSubmit={handleCreateShelf} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Shelf Label / Name</label>
                <input
                  type="text"
                  required
                  value={newShelfName}
                  onChange={(e) => setNewShelfName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Aisle 1 Soda Shelf"
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
