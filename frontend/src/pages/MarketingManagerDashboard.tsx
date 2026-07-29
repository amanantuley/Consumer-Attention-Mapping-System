import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Target, TrendingUp, BarChart3, Users, Eye, Sparkles, Store, LogOut, 
  Settings, Layers, Compass, FileText 
} from "lucide-react";

// Import custom SVG charts
import {
  LineChart,
  HorizontalBarChart,
  RadarChart,
  FunnelChart,
  DonutChart,
  ScatterPlot
} from "@/components/ui/charts";

const MarketingManagerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // 1. KPI Cards data
  const stats = [
    { title: "Campaign Reach", value: "142.5K", icon: Eye, color: "bg-blue-500/20 text-blue-400" },
    { title: "Promotion Engagement", value: "54.8%", icon: Users, color: "bg-purple-500/20 text-purple-400" },
    { title: "Product Visibility", value: "78%", icon: Target, color: "bg-indigo-500/20 text-indigo-400" },
    { title: "Conversion Rate", value: "22%", icon: TrendingUp, color: "bg-green-500/20 text-green-400" },
    { title: "Avg. Product Attraction", value: "7.8/10", icon: Sparkles, color: "bg-pink-500/20 text-pink-400" },
    { title: "Campaign ROI", value: "3.4x", icon: BarChart3, color: "bg-amber-500/20 text-amber-400" }
  ];

  // 2. Campaign Comparison charts data
  const visibilityMetricsRadar = [
    { label: "Gaze Rate", value: 85 },
    { label: "Dwell Time", value: 72 },
    { label: "Conversion", value: 64 },
    { label: "Attraction", value: 78 },
    { label: "Repeat View", value: 50 }
  ];

  const campaignTrend = [
    { label: "Wk 1", value: 12 },
    { label: "Wk 2", value: 24 },
    { label: "Wk 3", value: 45 },
    { label: "Wk 4", value: 39 },
    { label: "Wk 5", value: 68 }
  ];

  const visibilityScore = [
    { label: "Gourmet Coffee", value: 88 },
    { label: "Crispy Potato", value: 74 },
    { label: "Gluten Cookie", value: 56 },
    { label: "Soft Cola", value: 42 }
  ];

  const campaignConversionFunnel = [
    { stage: "Reach / Impression", value: 1000 },
    { stage: "Product View", value: 650 },
    { stage: "Shelf Pickup", value: 320 },
    { stage: "Conversions", value: 120 }
  ];

  const attractivenessRanking = [
    { label: "Choco Crunch Bar", value: 92 },
    { label: "Organic Herb Tea", value: 84 },
    { label: "Whole Grain Loaf", value: 67 },
    { label: "Citrus Punch", value: 53 }
  ];

  const engagementDistribution = [
    { label: "Video Ads", value: 48 },
    { label: "Shelf Banners", value: 32 },
    { label: "Endcap Displays", value: 20 }
  ];

  const scatterAttentionConversion = [
    { x: 12, y: 8, size: 8, label: "Diet Soda" },
    { x: 25, y: 22, size: 12, label: "Oat Bar" },
    { x: 40, y: 18, size: 6, label: "Matcha Tea" },
    { x: 55, y: 64, size: 14, label: "Cookie Box" },
    { x: 70, y: 78, size: 18, label: "Coffee Bag" }
  ];

  const sidebarLinks = [
    { id: "overview", label: "Overview", icon: Store },
    { id: "campaigns", label: "Campaign Performance", icon: Layers },
    { id: "promotion", label: "Promotion Effectiveness", icon: TrendingUp },
    { id: "visibility", label: "Product Visibility", icon: Eye },
    { id: "attraction", label: "Product Attractiveness", icon: Sparkles },
    { id: "engagement", label: "Customer Engagement", icon: Users },
    { id: "conversion", label: "Conversion Analysis", icon: TrendingUp },
    { id: "attention_insights", label: "Attention Insights", icon: Eye },
    { id: "traffic_insights", label: "Traffic Insights", icon: Compass },
    { id: "recommendations", label: "Marketing Recommendations", icon: Sparkles },
    { id: "action_center", label: "Action Center", icon: Target },
    { id: "reports", label: "Campaign Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex bg-[#070e17] text-slate-100 min-h-screen">
      
      {/* Sub Sidebar inside Marketing Manager Dashboard */}
      <div className="w-56 bg-[#0c1524] border-r border-slate-800 p-4 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2 py-3 border-b border-slate-800/60">
            <Target className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-xs tracking-wider uppercase text-slate-200">Marketing Dashboard</span>
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
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" 
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
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Promotion Campaign Evaluations</span>
            <h1 className="text-2xl font-extrabold text-slate-100 mt-1">
              Welcome back, {user?.full_name || user?.username || "Marketing Manager"}!
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
                        <stat.icon className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-200 mt-2">{stat.value}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Campaign Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="border-b border-slate-850">
                    <CardTitle className="text-xs font-bold uppercase">Campaign A/B/C Comparisons</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[200px] w-full flex items-end justify-around pb-6 relative">
                      {[
                        { name: "Campaign A", metrics: [55, 34, 48] },
                        { name: "Campaign B", metrics: [82, 65, 74] },
                        { name: "Campaign C", metrics: [40, 22, 30] }
                      ].map((grp, gIdx) => (
                        <div key={gIdx} className="flex flex-col items-center gap-1.5 w-1/4">
                          <div className="flex items-end gap-1.5 h-36">
                            <div className="w-3 bg-blue-500 rounded-t shadow-sm" style={{ height: `${grp.metrics[0]}%` }} />
                            <div className="w-3 bg-emerald-500 rounded-t shadow-sm" style={{ height: `${grp.metrics[1]}%` }} />
                            <div className="w-3 bg-purple-500 rounded-t shadow-sm" style={{ height: `${grp.metrics[2]}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 mt-2">{grp.name}</span>
                        </div>
                      ))}
                      <div className="absolute top-2 right-4 flex items-center gap-2.5 text-[8px] font-bold text-slate-500 bg-slate-900/60 p-1.5 rounded">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full" /> Engage</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> Lift</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full" /> View</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="border-b border-slate-850">
                    <CardTitle className="text-xs font-bold uppercase">Campaign Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <LineChart data={campaignTrend} color="#ec4899" />
                  </CardContent>
                </Card>
              </div>

              {/* Promotion Eff: Before vs After Dual Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="border-b border-slate-850">
                    <CardTitle className="text-xs font-bold uppercase">Before vs After Promotion Lift</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="h-[200px] w-full flex items-end justify-around pb-6 relative">
                      {[
                        { cat: "Attention Time", before: 15, after: 24, lift: "+60%" },
                        { cat: "Product Pickups", before: 30, after: 48, lift: "+60%" },
                        { cat: "Conversions", before: 12, after: 21, lift: "+75%" }
                      ].map((category, idx) => {
                        const maxVal = 50;
                        const hBefore = `${(category.before / maxVal) * 80 + 10}%`;
                        const hAfter = `${(category.after / maxVal) * 80 + 10}%`;
                        return (
                          <div key={idx} className="flex flex-col items-center w-1/4">
                            <div className="flex items-end gap-2 h-36">
                              <div className="w-4 bg-blue-500 rounded-t" style={{ height: hBefore }} />
                              <div className="w-4 bg-emerald-500 rounded-t" style={{ height: hAfter }} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-300 mt-2">{category.cat}</span>
                            <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded-full mt-1">
                              {category.lift}
                            </span>
                          </div>
                        );
                      })}
                      <div className="absolute top-2 right-4 flex items-center gap-2 text-[8px] font-bold text-slate-500 bg-slate-900/60 p-1.5 rounded">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full" /> Before</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> After</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Recommendations */}
                <Card className="bg-[#0c1524] border-slate-800 text-white">
                  <CardHeader className="border-b border-slate-850">
                    <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      AI Powered Layout Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 divide-y divide-slate-850">
                    {[
                      { title: "Move Product A to Shelf 2", impact: "High Impact" },
                      { title: "Increase Shelf Lighting (Aisle 3)", impact: "Medium Impact" },
                      { title: "Change Promotional Banner", impact: "Medium Impact" }
                    ].map((rec, i) => (
                      <div key={i} className="py-2.5 flex justify-between items-start gap-4 text-[10px]">
                        <div>
                          <h4 className="font-bold text-slate-200">{rec.title}</h4>
                        </div>
                        <span className="text-[8px] bg-red-950/40 text-red-400 border border-red-900/40 px-1.5 py-0.5 rounded-full shrink-0">
                          {rec.impact}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Tab 2: Campaigns */}
          {activeTab === "campaigns" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Campaign Conversions Funnel</CardTitle></CardHeader>
                <CardContent className="pt-4"><FunnelChart data={campaignConversionFunnel} /></CardContent>
              </Card>
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Engagement Distribution</CardTitle></CardHeader>
                <CardContent className="pt-4"><DonutChart data={engagementDistribution} /></CardContent>
              </Card>
            </div>
          )}

          {/* Tab 3: Promotion */}
          {activeTab === "promotion" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader><CardTitle className="text-xs font-bold uppercase">Before vs After Promotion Lift Chart</CardTitle></CardHeader>
              <CardContent className="pt-4">
                <LineChart data={campaignTrend} color="#10b981" />
              </CardContent>
            </Card>
          )}

          {/* Tab 4: Visibility */}
          {activeTab === "visibility" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Visibility Metrics</CardTitle></CardHeader>
                <CardContent className="pt-4"><RadarChart data={visibilityMetricsRadar} /></CardContent>
              </Card>
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Product Visibility Score</CardTitle></CardHeader>
                <CardContent className="pt-4"><HorizontalBarChart data={visibilityScore} color="#6366f1" /></CardContent>
              </Card>
            </div>
          )}

          {/* Tab 5: Attraction */}
          {activeTab === "attraction" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Product Attractiveness Ranking</CardTitle></CardHeader>
                <CardContent className="pt-4"><HorizontalBarChart data={attractivenessRanking} color="#ec4899" /></CardContent>
              </Card>
              <Card className="bg-[#0c1524] border-slate-800 text-white">
                <CardHeader><CardTitle className="text-xs font-bold uppercase">Scatter Attention vs Conversion</CardTitle></CardHeader>
                <CardContent className="pt-4"><ScatterPlot data={scatterAttentionConversion} /></CardContent>
              </Card>
            </div>
          )}

          {/* Tab 6: Settings */}
          {activeTab === "settings" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader><CardTitle className="text-xs font-bold uppercase">Campaign Settings</CardTitle></CardHeader>
              <CardContent className="pt-4 text-xs text-slate-400">Settings panel to configure system preferences and trigger mock advertising campaigns.</CardContent>
            </Card>
          )}

          {/* Customer Engagement */}
          {activeTab === "engagement" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader><CardTitle className="text-xs font-bold uppercase">Promotion Engagement Distribution</CardTitle></CardHeader>
              <CardContent className="pt-4"><DonutChart data={engagementDistribution} /></CardContent>
            </Card>
          )}

          {/* Conversion Analysis */}
          {activeTab === "conversion" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader><CardTitle className="text-xs font-bold uppercase">Campaign Conversion Funnel Stage Analysis</CardTitle></CardHeader>
              <CardContent className="pt-4"><FunnelChart data={campaignConversionFunnel} /></CardContent>
            </Card>
          )}

          {/* Attention Insights */}
          {activeTab === "attention_insights" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader><CardTitle className="text-xs font-bold uppercase">Attention vs Conversion Scatter Plot</CardTitle></CardHeader>
              <CardContent className="pt-4"><ScatterPlot data={scatterAttentionConversion} /></CardContent>
            </Card>
          )}

          {/* Traffic Insights */}
          {activeTab === "traffic_insights" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader><CardTitle className="text-xs font-bold uppercase">Store Traffic Ingestion Timeline</CardTitle></CardHeader>
              <CardContent className="pt-4"><LineChart data={campaignTrend} color="#6366f1" /></CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {activeTab === "recommendations" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader><CardTitle className="text-xs font-bold uppercase flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> AI Recommendations Dashboard</CardTitle></CardHeader>
              <CardContent className="pt-4 divide-y divide-slate-850">
                {[
                  { title: "Relocate Product D to Shelf A", impact: "High Impact", reason: "Low visibility detected on current shelf coordinates." },
                  { title: "Extend Weekend Bonanza Campaign", impact: "Medium Impact", reason: "Performing well with high attention dwell times." },
                  { title: "Change endcap display lighting", impact: "Low Impact", reason: "Slight lift in attention spans expected." }
                ].map((item, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-start gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{item.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.reason}</p>
                    </div>
                    <span className="text-[9px] bg-indigo-950 text-indigo-400 border border-indigo-900 px-2 py-0.5 rounded font-bold shrink-0">{item.impact}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action Center */}
          {activeTab === "action_center" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Pending Campaign Actions Approval</CardTitle></CardHeader>
              <CardContent className="pt-4 divide-y divide-slate-850">
                {[
                  { action: "Approve 10% discount on Beverages Aisle 2", status: "Pending approval" },
                  { action: "Deploy H.264 stream codecs update", status: "Ready to deploy" }
                ].map((act, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-semibold">{act.action}</span>
                    <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-[10px]">Approve Action</button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Campaign Reports */}
          {activeTab === "reports" && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850"><CardTitle className="text-xs font-bold uppercase">Campaign Evaluations PDF Portal</CardTitle></CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-900/30 text-xs">
                  <p className="font-bold text-slate-200">Daily Campaign Reach Report</p>
                  <p className="text-[10px] text-slate-500 mt-1">Download daily impressions, gaze durations, and ROI conversions.</p>
                  <button className="mt-3 px-3 py-1.5 bg-blue-650 hover:bg-blue-750 text-white font-bold rounded">Download PDF</button>
                </div>
                <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-xs">
                  <p className="font-bold text-slate-200">Weekly ROI Lift Audit</p>
                  <p className="text-[10px] text-slate-500 mt-1">Sankey shopper flows, radar charts, and comparative performance audits.</p>
                  <button className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded">Download PDF</button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fallback logs */}
          {!["overview", "campaigns", "promotion", "visibility", "attraction", "engagement", "conversion", "attention_insights", "traffic_insights", "recommendations", "action_center", "reports", "settings"].includes(activeTab) && (
            <Card className="bg-[#0c1524] border-slate-800 text-white">
              <CardHeader className="border-b border-slate-850">
                <CardTitle className="text-xs font-bold uppercase">{activeTab.replace("_", " ")} Portal</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-xs text-indigo-300">
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

export default MarketingManagerDashboard;
