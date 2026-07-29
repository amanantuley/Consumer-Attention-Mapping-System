import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Eye, TrendingUp, BarChart3, Users, Compass, Store, LogOut, 
  Settings, Clock, Sparkles, Layers, Box, FileText 
} from "lucide-react";

// Import custom SVG charts
import {
  LineChart,
  AreaChart,
  PieChart,
  DonutChart,
  SankeyDiagram,
  BoxPlot,
  ScatterPlot,
  TreeMap,
  HorizontalBarChart
} from "@/components/ui/charts";

const RetailAnalystDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // 1. KPI Cards data
  const stats = [
    { title: "Average Attention Time", value: "22.5s", icon: Eye, color: "bg-blue-500/20 text-blue-400" },
    { title: "Average Dwell Time", value: "1m 45s", icon: BarChart3, color: "bg-purple-500/20 text-purple-400" },
    { title: "Repeat Visitors Rate", value: "34.2%", icon: TrendingUp, color: "bg-green-500/20 text-green-400" },
    { title: "Avg. Session Length", value: "8m 14s", icon: Clock, color: "bg-orange-500/20 text-orange-400" },
    { title: "Engagement Score", value: "84/100", icon: Compass, color: "bg-indigo-500/20 text-indigo-400" },
    { title: "Online Active Sessions", value: "28", icon: Users, color: "bg-pink-500/20 text-pink-400" }
  ];

  // 2. Journey Flows (Sankey Diagram data)
  const journeyFlows = [
    { source: "Entrance", target: "Beverages", value: 140 },
    { source: "Entrance", target: "Snacks", value: 90 },
    { source: "Beverages", target: "Checkout", value: 110 },
    { source: "Snacks", target: "Checkout", value: 80 }
  ];

  // 3. Attention Analytics charts data
  const attentionDuration = [
    { label: "Aisle 1", value: 24 },
    { label: "Aisle 2", value: 18 },
    { label: "Aisle 3", value: 31 },
    { label: "Aisle 4", value: 22 },
    { label: "Aisle 5", value: 15 }
  ];

  const attentionTrend = [
    { label: "Mon", value: 120 },
    { label: "Tue", value: 145 },
    { label: "Wed", value: 130 },
    { label: "Thu", value: 165 },
    { label: "Fri", value: 189 },
    { label: "Sat", value: 240 },
    { label: "Sun", value: 210 }
  ];

  const boxPlotDistribution = [
    { label: "Beverages", min: 5, q1: 15, median: 25, q3: 35, max: 60 },
    { label: "Snacks", min: 8, q1: 18, median: 22, q3: 30, max: 48 },
    { label: "Produce", min: 10, q1: 22, median: 35, q3: 45, max: 75 },
    { label: "Frozen", min: 4, q1: 10, median: 18, q3: 25, max: 40 }
  ];

  // 4. Customer Segmentation chart data
  const customerSegments = [
    { label: "Explorers", value: 35 },
    { label: "Quick Buyers", value: 25 },
    { label: "Comparison Shoppers", value: 20 },
    { label: "Impulse Buyers", value: 20 }
  ];

  const segmentDistribution = [
    { label: "Brand Loyalists", value: 45 },
    { label: "Discount Seekers", value: 35 },
    { label: "First-time Walkins", value: 20 }
  ];

  // 6. Shopping Behavior charts data
  const mostViewedProducts = [
    { label: "Premium Energy Can", value: 94 },
    { label: "Organic Potato Chips", value: 78 },
    { label: "Gluten-Free Oats", value: 65 },
    { label: "Cold Brew Coffee", value: 58 },
    { label: "Greek Berry Yogurt", value: 49 }
  ];

  const mostIgnoredProducts = [
    { label: "Diet Soda Bottle", value: 48 },
    { label: "Salted Pretzels", value: 39 },
    { label: "Wheat Crackers", value: 31 },
    { label: "Instant Noodle Cup", value: 24 }
  ];



  const categoryInterest = [
    { label: "Fresh Produce", value: 40 },
    { label: "Packed Snacks", value: 25 },
    { label: "Soft Beverages", value: 20 },
    { label: "Breads & Bakery", value: 15 }
  ];

  // 7. Dwell Time Analytics hourly trend data
  const hourlyDwellTime = [
    { label: "09:00", value: 48 },
    { label: "11:00", value: 62 },
    { label: "13:00", value: 75 },
    { label: "15:00", value: 58 },
    { label: "17:00", value: 92 },
    { label: "19:00", value: 104 }
  ];

  // 8. Behavioral Analytics Scatter/Bubble coordinates
  const behavioralScatter = [
    { x: 15, y: 10, size: 8, label: "Chips A" },
    { x: 30, y: 25, size: 12, label: "Coffee B" },
    { x: 45, y: 15, size: 6, label: "Yogurt C" },
    { x: 60, y: 55, size: 14, label: "Energy D" },
    { x: 20, y: 40, size: 10, label: "Milk E" },
    { x: 75, y: 80, size: 18, label: "Bread F" }
  ];

  const sidebarLinks = [
    { id: "overview", label: "Overview", icon: Store },
    { id: "journey", label: "Journey Analysis", icon: Layers },
    { id: "attention", label: "Attention Analytics", icon: Eye },
    { id: "segments", label: "Segmentation", icon: Users },
    { id: "behavior", label: "Shopping Behaviour", icon: Compass },
    { id: "dwell", label: "Dwell Time Analysis", icon: Clock },
    { id: "traffic_flow", label: "Traffic Flow Analysis", icon: TrendingUp },
    { id: "zone_perf", label: "Zone Performance", icon: Layers },
    { id: "product_analytics", label: "Product Analytics", icon: Box },
    { id: "category_perf", label: "Category Performance", icon: Layers },
    { id: "insights", label: "AI Insights", icon: Sparkles },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex bg-[#070e17] text-slate-100 min-h-screen">
      
      {/* Sub Sidebar inside Retail Analyst Dashboard */}
      <div className="w-56 bg-[#0c1524] border-r border-slate-800 p-4 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2 py-3 border-b border-slate-800/60">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <span className="font-bold text-xs tracking-wider uppercase text-slate-200">Retail Analyst Dashboard</span>
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
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" 
                      : "text-slate-400 hover:bg-[#121f35] hover:text-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </nav>
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

          {/* Header */}
          <div className="border-b border-slate-800/80 pb-5">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Consumer Insights & Analytics</span>
            <h1 className="text-2xl font-extrabold text-slate-100 mt-1">
              Welcome back, {user?.full_name || user?.username || "Retail Analyst"}!
            </h1>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat, i) => (
                  <Card key={i} className="bg-[#0c1524] border-slate-800 text-white">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{stat.title}</span>
                        <stat.icon className={`w-3.5 h-3.5 ${stat.color.split(" ")[1]}`} />
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-200 mt-2">{stat.value}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Journey & Flow */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="border-b border-slate-850">
                    <CardTitle className="text-xs font-bold uppercase">Customer Journey Sankey Flow</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <SankeyDiagram flows={journeyFlows} />
                  </CardContent>
                </Card>

                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="border-b border-slate-850">
                    <CardTitle className="text-xs font-bold uppercase">Movement Flow Chart</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 flex flex-col justify-center items-center h-[240px] space-y-4">
                    <div className="flex flex-col items-center p-2.5 bg-blue-950/40 border border-blue-900/50 rounded-lg w-40 text-center">
                      <span className="text-[9px] font-bold text-blue-400 uppercase">Entrance Foyer</span>
                      <span className="text-xs font-semibold text-slate-300 mt-0.5">100% Unique Traffic</span>
                    </div>
                    <div className="w-0.5 h-6 bg-slate-800 relative">
                      <span className="absolute bottom-0 -left-1 text-slate-600 text-xs">▼</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center p-2 bg-purple-950/40 border border-purple-900/50 rounded-lg w-28 text-center">
                        <span className="text-[9px] font-bold text-purple-400 uppercase">Aisle 1 (Left)</span>
                        <span className="text-xs font-semibold text-slate-300 mt-0.5">60% Traffic</span>
                      </div>
                      <div className="flex flex-col items-center p-2 bg-purple-950/40 border border-purple-900/50 rounded-lg w-28 text-center">
                        <span className="text-[9px] font-bold text-purple-400 uppercase">Aisle 2 (Right)</span>
                        <span className="text-xs font-semibold text-slate-300 mt-0.5">40% Traffic</span>
                      </div>
                    </div>
                    <div className="w-0.5 h-6 bg-slate-800 relative">
                      <span className="absolute bottom-0 -left-1 text-slate-600 text-xs">▼</span>
                    </div>
                    <div className="flex flex-col items-center p-2.5 bg-emerald-950/40 border border-emerald-900/50 rounded-lg w-40 text-center">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase">Checkout Lanes</span>
                      <span className="text-xs font-semibold text-slate-300 mt-0.5">78% Converters</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Heatmaps Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="pb-2 border-b border-slate-850"><CardTitle className="text-[10px] font-bold uppercase text-slate-400">Store Heatmap</CardTitle></CardHeader>
                  <CardContent className="pt-4 flex justify-center"><div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 via-yellow-400 to-red-500 animate-pulse" /></CardContent>
                </Card>
                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="pb-2 border-b border-slate-850"><CardTitle className="text-[10px] font-bold uppercase text-slate-400">Shelf Heatmap</CardTitle></CardHeader>
                  <CardContent className="pt-4 flex justify-center"><div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 via-pink-400 to-red-500 animate-pulse" /></CardContent>
                </Card>
                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="pb-2 border-b border-slate-850"><CardTitle className="text-[10px] font-bold uppercase text-slate-400">Traffic Heatmap</CardTitle></CardHeader>
                  <CardContent className="pt-4 flex justify-center"><div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 via-teal-400 to-amber-500 animate-pulse" /></CardContent>
                </Card>
                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="pb-2 border-b border-slate-850"><CardTitle className="text-[10px] font-bold uppercase text-slate-400">Zone Heatmap</CardTitle></CardHeader>
                  <CardContent className="pt-4 flex justify-center"><div className="w-16 h-16 rounded-full bg-gradient-to-bl from-green-500 via-amber-400 to-rose-500 animate-pulse" /></CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Tab 2: Journey */}
          {activeTab === "journey" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Shopper Path Sankey</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <SankeyDiagram flows={journeyFlows} />
              </CardContent>
            </Card>
          )}

          {/* Tab 3: Attention */}
          {activeTab === "attention" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Average Attention per Shelf</CardTitle></CardHeader>
                <CardContent className="pt-4"><LineChart data={attentionDuration} color="#3b82f6" /></CardContent>
              </Card>
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Attention Trend</CardTitle></CardHeader>
                <CardContent className="pt-4"><AreaChart data={attentionTrend} color="#a855f7" /></CardContent>
              </Card>
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Attention Box Distribution</CardTitle></CardHeader>
                <CardContent className="pt-4"><BoxPlot data={boxPlotDistribution} /></CardContent>
              </Card>
            </div>
          )}

          {/* Tab 4: Segments */}
          {activeTab === "segments" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Customer Segments</CardTitle></CardHeader>
                <CardContent className="pt-4"><PieChart data={customerSegments} /></CardContent>
              </Card>
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Segment Distribution</CardTitle></CardHeader>
                <CardContent className="pt-4"><DonutChart data={segmentDistribution} /></CardContent>
              </Card>
            </div>
          )}

          {/* Tab 5: Behavior */}
          {activeTab === "behavior" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Most Viewed vs Ignored</CardTitle></CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <HorizontalBarChart data={mostViewedProducts} color="#3b82f6" height={150} />
                  <HorizontalBarChart data={mostIgnoredProducts} color="#94a3b8" height={130} />
                </CardContent>
              </Card>
              <Card className="bg-[#0c1524] border-slate-800 text-white flex flex-col justify-between">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Category Interest</CardTitle></CardHeader>
                <CardContent className="pt-4 flex-1">
                  <TreeMap data={categoryInterest} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab 6: Dwell */}
          {activeTab === "dwell" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Dwell Time Hourly</CardTitle></CardHeader>
                <CardContent className="pt-4"><LineChart data={hourlyDwellTime} color="#ec4899" /></CardContent>
              </Card>
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Behavioral Attention Scatter</CardTitle></CardHeader>
                <CardContent className="pt-4"><ScatterPlot data={behavioralScatter} /></CardContent>
              </Card>
            </div>
          )}

          {/* Tab 7: AI Insights */}
          {activeTab === "insights" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader><CardTitle className="text-xs font-bold uppercase">AI Generated Retail Insights</CardTitle></CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="p-3 bg-purple-950/20 border border-purple-900/30 rounded-lg">
                  <p className="text-xs font-bold text-purple-300">✔ Aisle 2 Snack Attention Lift</p>
                  <p className="text-[10px] text-slate-400 mt-1">Cross-correlations verify snack categories are viewed for 15% longer when beverages are assigned next to them.</p>
                </div>
                <div className="p-3 bg-purple-950/20 border border-purple-900/30 rounded-lg">
                  <p className="text-xs font-bold text-purple-300">✔ Checkout Congestion Peaks</p>
                  <p className="text-[10px] text-slate-400 mt-1">Queue sizes grow exponentially between 5 PM and 7 PM. Smart staffing adjustments recommended.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab 8: Settings */}
          {activeTab === "settings" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader><CardTitle className="text-xs font-bold uppercase">Analyst Preferences</CardTitle></CardHeader>
              <CardContent className="pt-4 text-xs text-slate-400">Settings mapping preferences, time window filters, and metrics parameters.</CardContent>
            </Card>
          )}

          {/* Traffic Flow Analysis */}
          {activeTab === "traffic_flow" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Entrance vs Exit Daily Rates</CardTitle></CardHeader>
                <CardContent className="pt-4"><LineChart data={attentionTrend} color="#10b981" /></CardContent>
              </Card>
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Zone Flow Ratios</CardTitle></CardHeader>
                <CardContent className="pt-4"><DonutChart data={customerSegments} /></CardContent>
              </Card>
            </div>
          )}

          {/* Zone Performance */}
          {activeTab === "zone_perf" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Relative Store Zone Performance Scores</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#070e17] text-slate-400 border-b border-slate-800 font-bold">
                      <th className="p-4 pl-6">Zone Name</th>
                      <th className="p-4">Dwell Score</th>
                      <th className="p-4">Total Pickups</th>
                      <th className="p-4">Conversion Lift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {[
                      { name: "Snack Aisle 1", dwell: "85/100", count: 180, lift: "+12.4%" },
                      { name: "Beverage Aisle 2", dwell: "92/100", count: 240, lift: "+18.9%" },
                      { name: "Bakery Endcap", dwell: "64/100", count: 95, lift: "+5.2%" },
                      { name: "Cosmetics Counter", dwell: "78/100", count: 120, lift: "+8.7%" }
                    ].map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/10">
                        <td className="p-4 pl-6 font-bold text-slate-200">{item.name}</td>
                        <td className="p-4 text-slate-400">{item.dwell}</td>
                        <td className="p-4 text-emerald-400 font-bold">{item.count} picks</td>
                        <td className="p-4 text-blue-400 font-bold">{item.lift}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Product Analytics */}
          {activeTab === "product_analytics" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Attraction Rank</CardTitle></CardHeader>
                <CardContent className="pt-4"><HorizontalBarChart data={mostViewedProducts} color="#ec4899" /></CardContent>
              </Card>
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Product Ignored Scores</CardTitle></CardHeader>
                <CardContent className="pt-4"><HorizontalBarChart data={mostIgnoredProducts} color="#64748b" /></CardContent>
              </Card>
            </div>
          )}

          {/* Category Performance */}
          {activeTab === "category_perf" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white flex flex-col justify-between">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Category Interest Score</CardTitle></CardHeader>
                <CardContent className="pt-4 flex-1"><TreeMap data={categoryInterest} /></CardContent>
              </Card>
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Category Dwell Distribution</CardTitle></CardHeader>
                <CardContent className="pt-4"><BoxPlot data={boxPlotDistribution} /></CardContent>
              </Card>
            </div>
          )}

          {/* Reports */}
          {activeTab === "reports" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Download Consumer Insights Reports</CardTitle></CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-900/30 text-xs">
                  <p className="font-bold text-slate-200">Daily Footfall Digest</p>
                  <p className="text-[10px] text-slate-500 mt-1">Summary of peak hours, dwell time statistics, and conversion lift averages.</p>
                  <button className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded">Generate PDF</button>
                </div>
                <div className="p-4 rounded-lg bg-purple-950/20 border border-purple-900/30 text-xs">
                  <p className="font-bold text-slate-200">Weekly Attention Lift Audits</p>
                  <p className="text-[10px] text-slate-500 mt-1">Gaze duration ratios, box plots, and scatter conversions matrix.</p>
                  <button className="mt-3 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded">Generate PDF</button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fallback logs */}
          {!["overview", "journey", "attention", "segments", "behavior", "dwell", "insights", "settings", "traffic_flow", "zone_perf", "product_analytics", "category_perf", "reports"].includes(activeTab) && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850">
                <CardTitle className="text-xs font-bold uppercase">{activeTab.replace("_", " ")} Portal</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="p-4 rounded-lg bg-purple-950/20 border border-purple-900/30 text-xs text-purple-300">
                  <p className="font-bold uppercase tracking-wider mb-2">Simulated Live Log Stream:</p>
                  <pre className="font-mono text-[10px] text-slate-400 space-y-1">
                    {`[INFO] ${new Date().toISOString()} - Initializing connection worker for ${activeTab}...
[SUCCESS] Verified SSL connection parameters.
[INFO] Ready to fetch active datasets. Listening to events...`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

    </div>
  );
};

export default RetailAnalystDashboard;
