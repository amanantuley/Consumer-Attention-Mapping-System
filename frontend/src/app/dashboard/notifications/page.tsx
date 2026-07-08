'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, Trash2, Filter, CheckCircle2, AlertTriangle, Info, Activity
} from 'lucide-react';

interface NotificationItem {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  store: string;
}

export default function NotificationsFeed() {
  const [filterType, setFilterType] = useState<string>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', timestamp: '2026-07-08 16:30:12', message: 'Shopper Entry: ID #195 has entered Entrance Aisle', type: 'info', store: 'Gorakhpur Store' },
    { id: '2', timestamp: '2026-07-08 16:29:45', message: 'Low Inventory Alert: Tide Liquid Detergent 2L is below 10 units threshold', type: 'warning', store: 'Gorakhpur Store' },
    { id: '3', timestamp: '2026-07-08 16:28:10', message: 'Conversion Alert: Shopper ID #182 successfully purchased Pepsi 500ml', type: 'success', store: 'Gorakhpur Store' },
    { id: '4', timestamp: '2026-07-08 16:25:30', message: 'Attention Spike: Gaze duration on Coca-Cola 500ml shelf exceeded 120s limit', type: 'info', store: 'Gorakhpur Store' },
    { id: '5', timestamp: '2026-07-08 16:20:00', message: 'Camera Ingestion Failure: Video feed node Checkout Camera (Index 2) disconnected', type: 'error', store: 'Lucknow Store' },
  ]);

  // Simulate real-time alerts ticker
  useEffect(() => {
    const interval = setInterval(() => {
      const logs = [
        { message: 'Shopper Entry: ID #199 entered Gorakhpur Flagship', type: 'info', store: 'Gorakhpur Store' },
        { message: 'Conversion Alert: Shopper ID #191 purchased Whole Milk 1L', type: 'success', store: 'Gorakhpur Store' },
        { message: 'Stock Threshold: Pepsi 500ml restocked (40 units added)', type: 'success', store: 'Lucknow Store' },
        { message: 'Dwell Timeout: ID #192 hovered over snacks section &gt; 90s', type: 'warning', store: 'Lucknow Store' },
      ];
      const selected = logs[Math.floor(Math.random() * logs.length)];
      
      const newAlert: NotificationItem = {
        id: Math.random().toString(),
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        message: selected.message,
        type: selected.type as any,
        store: selected.store
      };

      setNotifications(prev => [newAlert, ...prev]);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const handleClearAll = () => {
    setNotifications([]);
  };

  const filteredAlerts = notifications.filter(n => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-400" /> Notifications & Alerts
          </h1>
          <p className="text-zinc-400 text-sm">
            Monitor real-time Kafka event streams, YOLO tracking triggers, and hardware connectivity logs.
          </p>
        </div>
        
        <button
          onClick={handleClearAll}
          className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-red-400 hover:text-white font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs cursor-pointer"
        >
          <Trash2 className="w-4 h-4" /> Clear All Logs
        </button>
      </div>

      {/* Main Alerts Feed */}
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80 space-y-5">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900/60 pb-4 text-xs">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" /> Ingestion Activity Stream
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1 whitespace-nowrap">
              <Filter className="w-3.5 h-3.5" /> Severity Filter:
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 w-full sm:w-44"
            >
              <option value="all">All Events</option>
              <option value="info">Info / Entries</option>
              <option value="success">Success / Purchases</option>
              <option value="warning">Warnings</option>
              <option value="error">System Failures</option>
            </select>
          </div>
        </div>

        {/* Logs List */}
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 bg-zinc-950/50 rounded-2xl border border-zinc-900 max-w-lg mx-auto">
            No notification events match the selected filter.
          </div>
        ) : (
          <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredAlerts.map((n) => (
              <div 
                key={n.id}
                className={`p-4 rounded-2xl border flex gap-4 items-start transition-all ${
                  n.type === 'error' ? 'bg-red-950/10 border-red-900/30' :
                  n.type === 'warning' ? 'bg-yellow-950/10 border-yellow-900/30' :
                  n.type === 'success' ? 'bg-emerald-950/10 border-emerald-900/30' :
                  'bg-zinc-900/30 border-zinc-850'
                }`}
              >
                {/* Icon mapping */}
                <div className={`p-2 rounded-xl shrink-0 ${
                  n.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-900/20' :
                  n.type === 'warning' ? 'bg-yellow-500/10 text-yellow-450 border border-yellow-900/20' :
                  n.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-900/20' :
                  'bg-blue-500/10 text-blue-400 border border-blue-900/20'
                }`}>
                  {n.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                  {n.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                  {n.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  {n.type === 'info' && <Info className="w-5 h-5" />}
                </div>

                <div className="space-y-1 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[10px] text-zinc-500 font-mono">
                    <span>{n.timestamp}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-emerald-450 font-bold uppercase tracking-wider">{n.store}</span>
                  </div>
                  <p className="text-zinc-300 font-medium text-xs leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
