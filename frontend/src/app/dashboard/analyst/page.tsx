'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  ShoppingBag, Plus, Edit2, Trash, MapPin, Activity, 
  BarChart3, Layers, Check, X, AlertCircle, RefreshCw, Layers3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
}

interface StoreItem {
  layout_id: string;
  name: string;
}

interface ShelfItem {
  id: string;
  shelf_name: string;
}

interface PlacementItem {
  id: string;
  shelf_id: string;
  product_id: string;
  quantity: number;
  product: ProductItem;
}

export default function ProductManagerDashboard() {
  const router = useRouter();
  const { user, accessToken, initialize } = useAuthStore();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user && user.role !== 'administrator' && user.role !== 'retail_analyst' && user.role !== 'marketing_manager') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [placements, setPlacements] = useState<PlacementItem[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [shelves, setShelves] = useState<ShelfItem[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Tab views
  const [activeTab, setActiveTab] = useState<'inventory' | 'placement' | 'analytics'>('inventory');

  // Product CRUD states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCategory, setProdCategory] = useState('Beverages');
  const [prodPrice, setProdPrice] = useState('1.99');
  const [prodStock, setProdStock] = useState('50');

  // Placement Form states
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedShelfId, setSelectedShelfId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [placementQty, setPlacementQty] = useState('5');

  // Mock analytics data
  const attentionData = [
    { name: 'Coca-Cola 500ml', gazeSeconds: 240, pickups: 85, purchases: 62 },
    { name: 'Doritos Nacho 150g', gazeSeconds: 410, pickups: 130, purchases: 95 },
    { name: 'Whole Milk 1L', gazeSeconds: 150, pickups: 60, purchases: 54 },
    { name: 'Tide Detergent 2L', gazeSeconds: 310, pickups: 45, purchases: 38 },
  ];

  const trendData = [
    { hour: '09:00', GazeMinutes: 12, Pickups: 4 },
    { hour: '11:00', GazeMinutes: 28, Pickups: 14 },
    { hour: '13:00', GazeMinutes: 45, Pickups: 26 },
    { hour: '15:00', GazeMinutes: 38, Pickups: 20 },
    { hour: '17:00', GazeMinutes: 62, Pickups: 35 },
    { hour: '19:00', GazeMinutes: 50, Pickups: 28 },
  ];

  useEffect(() => {
    if (accessToken) {
      fetchProducts();
      fetchPlacements();
      fetchStores();
    }
  }, [accessToken]);

  useEffect(() => {
    if (selectedStoreId) {
      fetchShelves(selectedStoreId);
    } else {
      setShelves([]);
    }
  }, [selectedStoreId]);

  const fetchProducts = async () => {
    setIsLoading(true);
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        if (data.length > 0) {
          setSelectedProductId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlacements = async () => {
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/products/placement`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlacements(data);
      }
    } catch (e) {
      console.error(e);
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
          setSelectedStoreId(data[0].layout_id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchShelves = async (storeId: string) => {
    const token = accessToken || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/stores/${storeId}/shelves/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShelves(data);
        if (data.length > 0) {
          setSelectedShelfId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const payload = {
      name: prodName,
      sku: prodSku,
      category: prodCategory,
      price: parseFloat(prodPrice) || 0.0,
      stock: parseInt(prodStock) || 0
    };

    const token = accessToken || localStorage.getItem('accessToken');
    try {
      let res;
      if (editingProduct) {
        res = await fetch(`${API_BASE}/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_BASE}/api/products/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to save product');
      }

      setSuccessMsg(`Product "${prodName}" successfully saved!`);
      setShowProductModal(false);
      setEditingProduct(null);
      setProdName('');
      setProdSku('');
      fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleEditClick = (p: ProductItem) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdCategory(p.category);
    setProdPrice(p.price.toString());
    setProdStock(p.stock.toString());
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (pId: string) => {
    if (!confirm('Are you sure you want to remove this product SKU?')) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/products/${pId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error('Failed to delete product SKU');
      setSuccessMsg('Product SKU deleted successfully.');
      fetchProducts();
      fetchPlacements();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSavePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/products/placement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          shelf_id: selectedShelfId,
          product_id: selectedProductId,
          quantity: parseInt(placementQty) || 1
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Placement allocation failed');
      }

      setSuccessMsg('Stock successfully placed on shelf!');
      setShowPlacementModal(false);
      fetchPlacements();
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
            <ShoppingBag className="w-6 h-6 text-emerald-400" /> Product Manager Gateway
          </h1>
          <p className="text-zinc-400 text-sm">
            Maintain retail inventory SKUs, allocate items to store layout shelves, and monitor eye gaze attention metrics.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inventory' 
                ? 'bg-emerald-500 text-[#09090b]' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            SKU Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('placement')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'placement' 
                ? 'bg-emerald-500 text-[#09090b]' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            Shelf Allocation ({placements.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-emerald-500 text-[#09090b]' 
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            Attention Analytics
          </button>
        </div>
      </div>

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

      {/* SKU CATALOG TAB */}
      {activeTab === 'inventory' && (
        <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-400" /> Active SKUs
            </h3>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProdName('');
                setProdSku('');
                setProdPrice('1.99');
                setProdStock('50');
                setShowProductModal(true);
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4" /> Register SKU
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold">
                  <th className="py-4 px-4">Product Name</th>
                  <th className="py-4 px-4">SKU Code</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Unit Price</th>
                  <th className="py-4 px-4">Warehouse Stock</th>
                  <th className="py-4 px-4 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      Loading catalog...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-550">
                      No products registered. Click "Register SKU" to add items.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-900/30 transition-all text-zinc-300">
                      <td className="py-4 px-4 font-semibold text-white">{p.name}</td>
                      <td className="py-4 px-4 font-mono text-[10px] text-zinc-500">{p.sku}</td>
                      <td className="py-4 px-4">
                        <span className="bg-zinc-950 px-2 py-0.5 border border-zinc-850 rounded font-semibold text-zinc-400 text-[10px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-white">${p.price.toFixed(2)}</td>
                      <td className="py-4 px-4 font-bold">{p.stock} units</td>
                      <td className="py-4 px-4 text-right flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-1.5 hover:text-emerald-400 text-zinc-500 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 hover:text-red-450 text-zinc-500 transition-all cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SHELF PLACEMENT TAB */}
      {activeTab === 'placement' && (
        <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers3 className="w-4 h-4 text-emerald-400" /> Placed Stock Inventory
            </h3>
            <button
              onClick={() => {
                if (stores.length > 0) {
                  setSelectedStoreId(stores[0].layout_id);
                }
                setShowPlacementModal(true);
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4" /> Place SKU on Shelf
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-semibold">
                  <th className="py-4 px-4">SKU Product</th>
                  <th className="py-4 px-4">SKU Code</th>
                  <th className="py-4 px-4">Shelf Node ID</th>
                  <th className="py-4 px-4">Placed Shelf Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {placements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-550">
                      No stock allocated to shelves yet. Click "Place SKU on Shelf".
                    </td>
                  </tr>
                ) : (
                  placements.map((pl) => (
                    <tr key={pl.id} className="hover:bg-zinc-900/30 transition-all text-zinc-300">
                      <td className="py-4 px-4 font-semibold text-white">{pl.product?.name}</td>
                      <td className="py-4 px-4 font-mono text-[10px] text-zinc-500">{pl.product?.sku}</td>
                      <td className="py-4 px-4 text-zinc-400 font-mono text-[10px]">{pl.shelf_id}</td>
                      <td className="py-4 px-4 font-bold text-emerald-450">{pl.quantity} items</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Attention Chart */}
            <div className="glass-panel p-5 rounded-3xl border border-zinc-800/80">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" /> Shopper Interest & Detections (Last 24h)
              </h3>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attentionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                    <YAxis stroke="#71717a" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="gazeSeconds" name="Eye Gaze Focus (sec)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pickups" name="Products Picked Up" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="purchases" name="Purchases / Conversions" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dwell and Interaction line trend */}
            <div className="glass-panel p-5 rounded-3xl border border-zinc-800/80">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" /> Shelf Density Gaze Trends (Hourly)
              </h3>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                    <XAxis dataKey="hour" stroke="#71717a" fontSize={10} />
                    <YAxis stroke="#71717a" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="GazeMinutes" name="Dwell Duration (min)" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                    <Line type="monotone" dataKey="Pickups" name="Interactions Count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CREATE PRODUCT SKU MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 bg-[#000000]/80 z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
            
            <h3 className="text-lg font-bold text-white mb-4">
              {editingProduct ? 'Edit SKU Details' : 'Register Product SKU'}
            </h3>
            
            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Product Name</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Coca-Cola 500ml"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">SKU Code (Unique Barcode)</label>
                <input
                  type="text"
                  required
                  disabled={editingProduct !== null}
                  value={prodSku}
                  onChange={(e) => setProdSku(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  placeholder="COKE-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Beverages">Beverages</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Household">Household</option>
                  <option value="Bakery">Bakery</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Unit Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="1.99"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Warehouse Stock (Units)</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="flex gap-3.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLACE PRODUCT ON SHELF MODAL */}
      {showPlacementModal && (
        <div className="fixed inset-0 bg-[#000000]/80 z-50 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
            
            <h3 className="text-lg font-bold text-white mb-4">Allocate SKU Stock to Shelf Node</h3>
            
            <form onSubmit={handleSavePlacement} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Select Store Location</label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>-- Choose Store --</option>
                  {stores.map((s) => (
                    <option key={s.layout_id} value={s.layout_id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Select Shelf Node</label>
                <select
                  value={selectedShelfId}
                  onChange={(e) => setSelectedShelfId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>-- Choose Shelf --</option>
                  {shelves.length === 0 ? (
                    <option disabled>No shelves configured for this store</option>
                  ) : (
                    shelves.map((sh) => (
                      <option key={sh.id} value={sh.id}>{sh.shelf_name}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Select SKU Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>-- Choose SKU --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Quantity to Place</label>
                <input
                  type="number"
                  required
                  value={placementQty}
                  onChange={(e) => setPlacementQty(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="5"
                />
              </div>

              <div className="flex gap-3.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPlacementModal(false)}
                  className="flex-1 py-2.5 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  Place Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
