'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  Activity, Users, ShoppingBag, Eye, ArrowRight, Video, 
  Bell, Settings, TrendingUp, Cpu, Server
} from 'lucide-react';

interface AlertItem {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export default function UnifiedDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuthStore();

  // States
  const [visitorCount, setVisitorCount] = useState(142);
  const [conversionRate, setConversionRate] = useState(64.2);
  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: '1', time: '10s ago', message: 'Shopper #182 entered Aisle 2 (Beverages)', type: 'info' },
    { id: '2', time: '1m ago', message: 'Item SKU-DORITOS picked up from Shelf 1', type: 'success' },
    { id: '3', time: '3m ago', message: 'Low stock warning on Aisle 3 (Milk)', type: 'warning' },
    { id: '4', time: '5m ago', message: 'Conversion completed: Shopper #179 checked out', type: 'success' },
  ]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!localStorage.getItem('accessToken')) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Simulate real-time ticker
    const timer = setInterval(() => {
      setVisitorCount(prev => prev + (Math.random() > 0.5 ? 1 : 0));
      const messages = [
        'Shopper entered Entrance Aisle',
        'Customer attention detected on Dairy shelf',
        'Coke 500ml picked up from Aisle 1',
        'New layout recommendation computed'
      ];
      const types: ('info' | 'success' | 'warning')[] = ['info', 'success', 'warning'];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      setAlerts(prev => [
        { id: Math.random().toString(), time: 'Just now', message: randomMsg, type: randomType },
        ...prev.slice(0, 4)
      ]);
    }, 8000);

    return () => {
      clearInterval(timer);
    };
  }, []);

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
        <button
          onClick={() => router.push('/dashboard/layout-planner')}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs cursor-pointer shadow-lg shadow-emerald-500/10 shrink-0"
        >
          Planner Canvas <ArrowRight className="w-4 h-4" />
        </button>
      </div>

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
            <p className="text-2xl font-bold text-white mt-0.5">86.4s avg</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-zinc-800/80 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center text-yellow-450 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Telemetry Engine</h4>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">Active</p>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Active Telemetry Ingestion Nodes */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-3xl border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-emerald-400" /> Active Video Stream Ingestion Nodes
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-900/35 border border-zinc-850 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Entrance Aisle Camera (0)</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">ONLINE</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>FPS: 29.4</span>
                  <span>Tracks: 2 Active</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/35 border border-zinc-850 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Beverages Aisle Camera (1)</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">ONLINE</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>FPS: 30.0</span>
                  <span>Tracks: 1 Active</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/35 border border-zinc-850 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Checkout Area Camera (2)</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">ONLINE</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>FPS: 29.8</span>
                  <span>Tracks: 0 Active</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/35 border border-zinc-850 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">Snacks Aisle Camera (3)</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">ONLINE</span>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1">
                  <span>FPS: 30.0</span>
                  <span>Tracks: 0 Active</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-zinc-900 pt-4 mt-6 flex justify-between items-center text-[10px] text-zinc-550">
            <span>Hardware Status: All telemetry nodes communicating normally.</span>
            <span className="text-emerald-400 font-bold font-mono">119.2 FPS total</span>
          </div>
        </div>

        {/* Right Side: Real-time logs and alerts */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-3xl border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-emerald-400" /> Live Ingestion Alerts
            </h3>
            
            <div className="space-y-3">
              {alerts.map((al) => (
                <div key={al.id} className="p-3 bg-zinc-900/30 border border-zinc-850 rounded-xl flex flex-col gap-1 text-[11px]">
                  <div className="flex justify-between items-center text-zinc-500 text-[9px] font-mono">
                    <span>{al.time}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      al.type === 'success' ? 'bg-emerald-500' :
                      al.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                  </div>
                  <p className="text-zinc-300 font-medium leading-normal">{al.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick link panel */}
          <div className="border-t border-zinc-900 pt-4 mt-4 grid grid-cols-2 gap-2 text-[10px] font-bold">
            <button
              onClick={() => router.push('/dashboard/analyst')}
              className="py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 text-center transition-all cursor-pointer"
            >
              Catalog SKUs
            </button>
            <button
              onClick={() => router.push('/dashboard/manager')}
              className="py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 text-center transition-all cursor-pointer"
            >
              Stores Setup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
