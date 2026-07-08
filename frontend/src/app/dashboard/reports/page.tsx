'use client';

import React, { useState } from 'react';
import { 
  FileText, Filter, Download, Printer, ArrowDown, 
  Layers, Activity, RefreshCw, BarChart3
} from 'lucide-react';

interface ReportRow {
  date: string;
  visitors: number;
  avgDwell: string;
  conversions: number;
  rate: string;
  revenue: string;
}

export default function ReportsGenerator() {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('7d');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportRow[] | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate API delay
    setTimeout(() => {
      setReportData([
        { date: '2026-07-07', visitors: 142, avgDwell: '86s', conversions: 88, rate: '61.9%', revenue: '$340.50' },
        { date: '2026-07-06', visitors: 110, avgDwell: '94s', conversions: 72, rate: '65.4%', revenue: '$290.10' },
        { date: '2026-07-05', visitors: 165, avgDwell: '112s', conversions: 110, rate: '66.6%', revenue: '$485.40' },
        { date: '2026-07-04', visitors: 98, avgDwell: '78s', conversions: 50, rate: '51.0%', revenue: '$180.20' },
        { date: '2026-07-03', visitors: 130, avgDwell: '82s', conversions: 78, rate: '60.0%', revenue: '$310.00' },
      ]);
      setIsGenerating(false);
    }, 1200);
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    const headers = 'Date,Visitors,Avg Dwell Time,Conversions,Conversion Rate,Revenue\n';
    const csvContent = reportData.map(r => 
      `${r.date},${r.visitors},${r.avgDwell},${r.conversions},${r.rate},${r.revenue.replace('$','')}`
    ).join('\n');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cams_report_${reportType}_${dateRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" /> Analytical Reports
          </h1>
          <p className="text-zinc-400 text-sm">
            Configure data criteria filters, compute store dwell funnel conversions, and export certified CSV summaries.
          </p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-panel p-5 rounded-3xl border border-zinc-800/80 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end text-xs">
        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Report Type
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="summary">Store Summary KPI</option>
            <option value="sku">SKU Dwell Attention</option>
            <option value="zones">Zone Density Flow</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        <div className="sm:col-span-2 flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-850 text-[#09090b] font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Computing...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" /> Generate Report
              </>
            )}
          </button>

          {reportData && (
            <>
              <button
                onClick={handleExportCSV}
                className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 rounded-xl text-emerald-400 hover:text-white transition-all cursor-pointer"
                title="Export CSV"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.print()}
                className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 rounded-xl text-emerald-400 hover:text-white transition-all cursor-pointer"
                title="Print PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Generated Report Content */}
      {reportData ? (
        <div className="space-y-6">
          {/* Conversion funnel mock visual */}
          <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-5 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-400" /> Conversion Funnel Analysis
            </h3>
            
            <div className="max-w-xl mx-auto space-y-3.5 py-4">
              <div className="relative">
                <div className="h-9 bg-emerald-500 text-[#09090b] font-bold flex items-center justify-center rounded-xl text-xs">
                  Aisle Entry Visitors (100%)
                </div>
              </div>
              <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-zinc-600" /></div>
              <div className="relative px-8">
                <div className="h-9 bg-emerald-500/70 text-white font-bold flex items-center justify-center rounded-xl text-xs border border-emerald-500/30">
                  Dwell & Gaze Target &gt; 5s (82%)
                </div>
              </div>
              <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-zinc-600" /></div>
              <div className="relative px-16">
                <div className="h-9 bg-emerald-500/40 text-emerald-350 font-bold flex items-center justify-center rounded-xl text-xs border border-emerald-500/20">
                  Product Picked Up (74%)
                </div>
              </div>
              <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-zinc-600" /></div>
              <div className="relative px-24">
                <div className="h-9 bg-emerald-950/40 text-emerald-450 border border-emerald-500/40 font-bold flex items-center justify-center rounded-xl text-xs">
                  Checkout Conversion (61.9%)
                </div>
              </div>
            </div>
          </div>

          {/* Table display */}
          <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" /> Generated Data Matrix
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-semibold">
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4">Unique Visitors</th>
                    <th className="py-4 px-4">Average Gaze Dwell</th>
                    <th className="py-4 px-4">Interactions / Pickups</th>
                    <th className="py-4 px-4">Conversion Rate</th>
                    <th className="py-4 px-4 text-right">Estimated Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-300">
                  {reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/30 transition-all">
                      <td className="py-4 px-4 font-mono font-semibold text-white">{row.date}</td>
                      <td className="py-4 px-4">{row.visitors} shoppers</td>
                      <td className="py-4 px-4 font-mono text-[11px] text-zinc-500">{row.avgDwell}</td>
                      <td className="py-4 px-4">{row.conversions} sessions</td>
                      <td className="py-4 px-4 text-emerald-450 font-bold">{row.rate}</td>
                      <td className="py-4 px-4 font-bold text-white text-right">{row.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-zinc-800/80 flex flex-col items-center justify-center text-center text-zinc-550 min-h-[300px]">
          <FileText className="w-12 h-12 text-zinc-700 mb-3 animate-pulse" />
          <h3 className="font-bold text-white mb-1">No Report Generated</h3>
          <p className="text-xs max-w-sm">
            Select your desired report type and date range filtering above, then click "Generate Report" to construct data matrices.
          </p>
        </div>
      )}
    </div>
  );
}
