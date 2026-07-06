'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  TrendingUp, Users, Calendar, Download, AlertCircle, 
  Map, Eye, DollarSign, Activity, FileSpreadsheet, FileText, ArrowDownToLine
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';

interface KPIState {
  total_shoppers: number;
  conversion_rate: number;
  average_dwell_time: number;
  total_sales: number;
}

interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
}

const defaultKPIs: KPIState = {
  total_shoppers: 142,
  conversion_rate: 34.5,
  average_dwell_time: 480.2,
  total_sales: 3429.50
};

// Hourly activity chart mock data
const hourlyData = [
  { hour: '09:00', visitors: 12, sales: 120 },
  { hour: '10:00', visitors: 19, sales: 240 },
  { hour: '11:00', visitors: 28, sales: 480 },
  { hour: '12:00', visitors: 42, sales: 890 },
  { hour: '13:00', visitors: 35, sales: 650 },
  { hour: '14:00', visitors: 24, sales: 340 },
  { hour: '15:00', visitors: 31, sales: 510 },
  { hour: '16:00', visitors: 48, sales: 1100 },
  { hour: '17:00', visitors: 56, sales: 1420 },
];

export default function AnalystPage() {
  const { accessToken } = useAuthStore();
  const [storeId, setStoreId] = useState<number>(1);
  const [kpis, setKpis] = useState<KPIState>(defaultKPIs);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [heatmapType, setHeatmapType] = useState<string>('movements');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchData();
  }, [storeId, heatmapType]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch KPIs
      const kpiRes = await fetch(`/api/v1/analytics/kpis/${storeId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (kpiRes.ok) {
        const kpiData = await kpiRes.json();
        setKpis(kpiData);
      }

      // Fetch Heatmap
      const hmRes = await fetch(`/api/v1/analytics/heatmaps/${storeId}?heatmap_type=${heatmapType}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (hmRes.ok) {
        const hmData = await hmRes.json();
        setHeatmapPoints(hmData.points || []);
      }
    } catch (e) {
      console.error("Failed to load analytics metrics", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = (format: 'pdf' | 'csv' | 'excel') => {
    if (!accessToken) return;
    
    // Use window.open or fetch download
    const url = `/api/v1/analytics/report/${storeId}?format=${format}&token=${accessToken}`;
    // Create temporary download element
    const a = document.createElement('a');
    a.href = url;
    // Set headers with token by querying directly or clicking
    a.setAttribute('download', `cams_report_${storeId}.${format === 'excel' ? 'xlsx' : format}`);
    // Open in new tab which streams file
    window.open(url, '_blank');
  };

  // Build grid map values (10x10)
  const getGridColor = (x: number, y: number) => {
    const pt = heatmapPoints.find(p => Math.floor(p.x / 10) === x && Math.floor(p.y / 10) === y);
    if (!pt) return 'bg-zinc-900/30';
    const val = pt.value;
    if (val > 15) return 'bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
    if (val > 8) return 'bg-yellow-500/60 shadow-[0_0_6px_rgba(234,179,8,0.4)]';
    return 'bg-emerald-500/40';
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" /> Executive Insights
          </h1>
          <p className="text-zinc-400 text-sm">
            Overview of shopper demographics, attention durations, conversion KPIs, and floor layouts.
          </p>
        </div>

        {/* Store selector & exports */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <select 
            value={storeId} 
            onChange={(e) => setStoreId(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value={1}>Downtown Retail #1</option>
            <option value={2}>Uptown Outlet #2</option>
          </select>

          {/* Export Report Actions */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            <button 
              onClick={() => handleDownloadReport('pdf')}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Download PDF Report"
            >
              <FileText className="w-4 h-4 text-red-400" /> PDF
            </button>
            <button 
              onClick={() => handleDownloadReport('csv')}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Download CSV Spreadsheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> CSV
            </button>
            <button 
              onClick={() => handleDownloadReport('excel')}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Download Excel Sheet"
            >
              <ArrowDownToLine className="w-4 h-4 text-blue-400" /> XLS
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-6 rounded-2xl border border-zinc-800/80 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Total Shoppers</p>
            <h3 className="text-2xl font-bold text-white mt-1">{kpis.total_shoppers}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-zinc-800/80 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Conversion Rate</p>
            <h3 className="text-2xl font-bold text-white mt-1">{kpis.conversion_rate}%</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-zinc-800/80 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Eye className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Avg. Dwell Time</p>
            <h3 className="text-2xl font-bold text-white mt-1">{(kpis.average_dwell_time / 60).toFixed(1)} mins</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-zinc-800/80 flex items-center gap-4 relative overflow-hidden">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Sales Revenue</p>
            <h3 className="text-2xl font-bold text-white mt-1">${kpis.total_sales.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Main Charts & Spatial Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visitor Activity Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" /> Shopper Traffic & Hourly Sales
            </h3>
            <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800/60 px-2.5 py-1 rounded-full font-medium">
              Live updates
            </span>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="hour" stroke="#a1a1aa" fontSize={11} />
                <YAxis stroke="#a1a1aa" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                <Area type="monotone" dataKey="visitors" stroke="#10b981" fillOpacity={1} fill="url(#colorVisitors)" name="Shoppers" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap Layout Display */}
        <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Map className="w-5 h-5 text-emerald-400" /> Floor Spatial Heatmap
            </h3>
            
            {/* Heatmap type selector */}
            <select
              value={heatmapType}
              onChange={(e) => setHeatmapType(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              <option value="movements">Foot Traffic</option>
              <option value="gaze">Gaze Attention</option>
            </select>
          </div>

          <p className="text-zinc-500 text-xs mb-4">
            A 2D layout grid showing zone occupancy density. Red fields represent bottleneck hotspots.
          </p>

          {/* 10x10 Floor layout grid */}
          <div className="flex-1 aspect-square bg-zinc-950 border border-zinc-900 rounded-2xl p-3 grid grid-cols-10 gap-1.5">
            {Array.from({ length: 10 }).map((_, yIdx) => 
              Array.from({ length: 10 }).map((_, xIdx) => {
                const colorClass = getGridColor(xIdx, yIdx);
                return (
                  <div 
                    key={`${xIdx}-${yIdx}`} 
                    className={`w-full h-full rounded-md transition-all duration-500 ${colorClass}`}
                    title={`Cell [${xIdx}, ${yIdx}]`}
                  />
                );
              })
            )}
          </div>
          
          {/* Map legend */}
          <div className="mt-4 flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest font-semibold px-1">
            <span>Low Traffic</span>
            <div className="h-2 w-32 bg-gradient-to-r from-emerald-500/40 via-yellow-500/60 to-red-500/80 rounded" />
            <span>High Gaze Density</span>
          </div>
        </div>

      </div>
    </div>
  );
}
