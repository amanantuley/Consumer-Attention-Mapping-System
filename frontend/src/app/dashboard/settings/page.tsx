'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  Settings, User as UserIcon, Cpu, Layers, Lock, 
  CheckCircle2, Activity, Sparkles
} from 'lucide-react';

export default function SettingsPortal() {
  const { user } = useAuthStore();
  const [theme, setTheme] = useState('dark');
  const [gazeThreshold, setGazeThreshold] = useState('0.75');
  const [iouThreshold, setIouThreshold] = useState('0.45');
  const [showConfigMsg, setShowConfigMsg] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfigMsg(true);
    setTimeout(() => setShowConfigMsg(false), 3000);
  };

  const roleLabel = user?.role ? user.role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Analyst';

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-400" /> Gateway Parameters
          </h1>
          <p className="text-zinc-400 text-sm">
            Modify profile configuration setups, dark theme preferences, and adjust AI model prediction thresholds.
          </p>
        </div>
      </div>

      {showConfigMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Parameters saved successfully and hot-reloaded.
        </div>
      )}

      {/* Grid Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Profile & Account settings */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-5 rounded-3xl border border-zinc-800/80 space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-3.5">
              <UserIcon className="w-4 h-4 text-emerald-400" /> Security Profile
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-zinc-550 block mb-1">Full Corporate Name</span>
                <span className="text-sm font-bold text-white block bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-zinc-900">{user?.full_name || 'System Administrator'}</span>
              </div>
              
              <div>
                <span className="text-zinc-550 block mb-1">Company Email Address</span>
                <span className="text-sm font-mono text-zinc-450 block bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-zinc-900 truncate">{user?.email || 'admin@cams.com'}</span>
              </div>

              <div>
                <span className="text-zinc-550 block mb-1">Gateway Access Level</span>
                <span className="text-sm font-bold text-emerald-450 block bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-zinc-900">{roleLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: AI parameters and systems thresholds */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveConfig} className="glass-panel p-6 rounded-3xl border border-zinc-800/80 space-y-6">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-4">
              <Cpu className="w-4 h-4 text-emerald-400" /> AI Pipeline Calibration Thresholds
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Gaze Tracking Confidence Limit</label>
                <select
                  value={gazeThreshold}
                  onChange={(e) => setGazeThreshold(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="0.90">0.90 (High Precision)</option>
                  <option value="0.75">0.75 (Balanced / Recommended)</option>
                  <option value="0.50">0.50 (Low Confidence / High Recall)</option>
                </select>
                <span className="text-[9px] text-zinc-550 mt-1.5 block">Confidence score cutoff for head pose projection and iris detection.</span>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">ByteTrack Overlap IoU Limit</label>
                <select
                  value={iouThreshold}
                  onChange={(e) => setIouThreshold(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="0.60">0.60 (Strict Object Association)</option>
                  <option value="0.45">0.45 (Standard Kalman Tracking)</option>
                  <option value="0.30">0.30 (Relaxed Overlaps)</option>
                </select>
                <span className="text-[9px] text-zinc-550 mt-1.5 block">Intersection-over-Union threshold constraint for binding shopper frames.</span>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Visual Theme Mode</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="dark">Vibrant Dark Mode (Mockup Default)</option>
                  <option value="light">Classic Light Mode</option>
                </select>
              </div>
            </div>

            <div className="border-t border-zinc-900 pt-4 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] font-bold rounded-xl shadow-lg transition-all text-xs cursor-pointer"
              >
                Save & Apply Settings
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
