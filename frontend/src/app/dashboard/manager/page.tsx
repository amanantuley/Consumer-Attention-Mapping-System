'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  Store as StoreIcon, Plus, Trash, ArrowRight, LayoutGrid, 
  MapPin, Activity, Sparkles, RefreshCw
} from 'lucide-react';

interface StoreLayout {
  layout_id: string;
  name: string;
  zones: {
    zone_id: string;
    name: string;
    coordinates: number[][];
  }[];
}

export default function StoreManagerDashboard() {
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

  const [stores, setStores] = useState<StoreLayout[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Store creation modal states
  const [showStoreModal, setShowStoreModal] = useState<boolean>(false);
  const [newStoreName, setNewStoreName] = useState<string>('');
  const [newStoreLocation, setNewStoreLocation] = useState<string>('');
  const [newStoreSize, setNewStoreSize] = useState<string>('5000');

  useEffect(() => {
    if (accessToken) {
      fetchStores();
    }
  }, [accessToken]);

  const fetchStores = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/stores/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to retrieve stores');
      const data = await res.json();
      setStores(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching store locations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const token = accessToken || localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE}/api/stores/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newStoreName,
          location: newStoreLocation,
          metadata: { size_sqft: parseInt(newStoreSize) || 5000 }
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to register store');
      }

      setSuccessMsg(`Store "${newStoreName}" successfully registered!`);
      setNewStoreName('');
      setNewStoreLocation('');
      setNewStoreSize('5000');
      setShowStoreModal(false);
      fetchStores();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('Are you sure you want to delete this store layout? All mapped shelves will be permanently removed.')) return;
    setErrorMsg('');
    setSuccessMsg('');
    const token = accessToken || localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_BASE}/api/v1/stores/${storeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to delete store layout');
      }

      setSuccessMsg('Store layout deleted successfully.');
      fetchStores();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const totalZones = stores.reduce((acc, curr) => acc + (curr.zones?.length || 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <StoreIcon className="w-6 h-6 text-emerald-400" /> Store Manager Gateway
          </h1>
          <p className="text-zinc-400 text-sm">
            Monitor layouts, configure store physical locations, and access the interactive layout planner.
          </p>
        </div>
        <button
          onClick={() => setShowStoreModal(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-lg shadow-emerald-500/15"
        >
          <Plus className="w-4 h-4" /> Register New Store
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-450 shrink-0">
            <StoreIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Total Stores</h4>
            <p className="text-2xl font-bold text-white mt-0.5">{stores.length}</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-450 shrink-0">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Configured Zones</h4>
            <p className="text-2xl font-bold text-white mt-0.5">{totalZones}</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-450 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Platform Health</h4>
            <p className="text-2xl font-bold text-white mt-0.5">Optimal</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs">
          {successMsg}
        </div>
      )}

      {/* Stores List */}
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80 space-y-4">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-emerald-400" /> Active Floor Plans
        </h3>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-zinc-550 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" /> Loading store layouts...
          </div>
        ) : stores.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 bg-zinc-950/50 rounded-2xl border border-zinc-900 max-w-lg mx-auto">
            No stores registered. Click "Register New Store" to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((s) => (
              <div 
                key={s.layout_id}
                className="p-5 bg-zinc-900/40 border border-zinc-850 rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition-all gap-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-base font-bold text-white truncate">{s.name}</h4>
                    <button
                      onClick={() => handleDeleteStore(s.layout_id)}
                      className="p-1 text-zinc-650 hover:text-red-450 transition-all cursor-pointer"
                      title="Delete Store"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-450 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500/80" /> ID: {s.layout_id}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Zones configuration: {s.zones?.length || 0} active zones mapped on canvas.
                  </p>
                </div>
                
                <button
                  onClick={() => router.push('/dashboard/layout-planner')}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-emerald-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  Open Layout Canvas <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Store Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-[#000000]/80 z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
            
            <h3 className="text-lg font-bold text-white mb-4">Register Store Layout</h3>
            
            <form onSubmit={handleCreateStore} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Store Name</label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Gorakhpur Store"
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
                  placeholder="Gorakhpur"
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
                  Save Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
