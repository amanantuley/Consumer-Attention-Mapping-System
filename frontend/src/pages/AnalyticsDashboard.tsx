import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyticsAPI, storeAPI } from "@/lib/api";
import type {
  AnalyticsSummary,
  AnalyticsRecommendation,
  HeatmapPoint,
  Store,
  StoreOccupancy,
} from "@/types";
import { Compass, Eye, TrendingUp, Clock, BarChart3, CircleDashed } from "lucide-react";
import { toast } from "react-toastify";
import { BarChart, DonutChart, LineChart } from "@/components/ui/charts";

const AnalyticsDashboard: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recommendations, setRecommendations] = useState<AnalyticsRecommendation[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [dwellByZone, setDwellByZone] = useState<{ zone: string; total_dwell_seconds: number; average_dwell_seconds: number; unique_shoppers: number; }[]>([]);
  const [attractiveness, setAttractiveness] = useState<{ zone: string; traffic_score: number; dwell_score: number; interaction_count: number; attractiveness_score: number; }[]>([]);
  const [occupancy, setOccupancy] = useState<StoreOccupancy | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStoreId !== null) {
      loadAnalytics(selectedStoreId);
    }
  }, [selectedStoreId]);

  const loadStores = async () => {
    try {
      const res = await storeAPI.getStores();
      setStores(res.data);
      if (res.data.length > 0) {
        setSelectedStoreId(res.data[0].id);
      }
    } catch (err) {
      toast.error("Unable to load stores for analytics.");
      console.error(err);
    }
  };

  const loadAnalytics = async (storeId: number) => {
    try {
      const [summaryRes, recRes, heatmapRes, dwellRes, attractRes, occupancyRes] = await Promise.all([
        analyticsAPI.getAnalyticsSummary(storeId),
        analyticsAPI.getRecommendations(storeId),
        analyticsAPI.getHeatmap(storeId),
        analyticsAPI.getDwellByZone(storeId),
        analyticsAPI.getAttractiveness(storeId),
        analyticsAPI.getOccupancy(storeId),
      ]);
      setSummary(summaryRes.data);
      setRecommendations(recRes.data);
      setHeatmapPoints(heatmapRes.data);
      setDwellByZone(dwellRes.data);
      setAttractiveness(attractRes.data);
      setOccupancy(occupancyRes.data);
    } catch (err) {
      toast.error("Failed to load analytics data.");
      console.error(err);
    }
  };

  return (
    <div className="flex bg-[#070e17] text-slate-100 min-h-screen">
      <div className="w-full p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Retail Intelligence</p>
            <h1 className="text-3xl font-extrabold text-slate-100 mt-3">Store Analytics Hub</h1>
            <p className="max-w-2xl text-sm text-slate-400 mt-2">
              Track foot traffic, dwell behavior, heatmap density, and product attractiveness all from one retail operations console.
            </p>
          </div>

          <div className="space-y-3 w-full max-w-sm">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 shadow-lg shadow-slate-950/40">
              <Label htmlFor="storeSelect" className="text-slate-400">Selected Store</Label>
              <Select value={selectedStoreId?.toString() ?? ""} onValueChange={(value) => setSelectedStoreId(Number(value))}>
                <SelectTrigger id="storeSelect" className="mt-2 w-full">
                  <SelectValue placeholder="Choose store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#0c1524] border border-slate-800">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-[0.3em] text-slate-400">Total Foot Traffic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-3xl font-bold text-slate-100">{summary?.total_shoppers ?? "--"}</p>
                  <p className="text-xs text-slate-500">Unique visitors in the selected window</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0c1524] border border-slate-800">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-[0.3em] text-slate-400">Avg. Dwell Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-emerald-400" />
                <div>
                  <p className="text-3xl font-bold text-slate-100">{summary ? `${summary.average_dwell_seconds}s` : "--"}</p>
                  <p className="text-xs text-slate-500">Average zone dwell per shopper</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0c1524] border border-slate-800">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-[0.3em] text-slate-400">Top Attention Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-slate-100">{summary?.top_zone ?? "--"}</p>
                  <p className="text-xs text-slate-500">Most viewed store region</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0c1524] border border-slate-800">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-[0.3em] text-slate-400">Current Occupancy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-3xl font-bold text-slate-100">{occupancy?.occupancy ?? "--"}</p>
                  <p className="text-xs text-slate-500">Active shoppers currently in store</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0c1524] border border-slate-800">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-[0.3em] text-slate-400">Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Compass className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-3xl font-bold text-slate-100">{summary?.recommendations_count ?? "--"}</p>
                  <p className="text-xs text-slate-500">Actionable optimization flags</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0c1524] border border-slate-800">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-[0.3em] text-slate-400">Top Attraction Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <CircleDashed className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-slate-100">{summary?.top_zone ?? "--"}</p>
                  <p className="text-xs text-slate-500">Most engaging store area</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2 bg-[#0c1524] border border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm text-slate-100">Heatmap Density Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative h-[360px] rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(248,113,113,0.18),_transparent_35%),radial-gradient(circle_at_20%_20%,_rgba(59,130,246,0.15),_transparent_18%)]" />
                <div className="absolute inset-0 p-4">
                  {heatmapPoints.length === 0 ? (
                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                      No heatmap data available yet for this store.
                    </div>
                  ) : (
                    <div className="grid h-full w-full grid-cols-8 gap-1">
                      {Array.from({ length: 64 }).map((_, idx) => {
                        const x = idx % 8;
                        const y = Math.floor(idx / 8);
                        const point = heatmapPoints.find((item) => item.x % 8 === x && item.y % 8 === y);
                        const count = point?.count ?? 0;
                        const opacity = Math.min(0.95, count / 10 + 0.05);
                        return (
                          <div
                            key={`${x}-${y}`}
                            className="rounded-xl border border-white/5"
                            style={{ backgroundColor: `rgba(248,113,113,${opacity})` }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-4 left-4 rounded-full bg-slate-950/95 px-3 py-2 text-xs text-slate-300 border border-slate-800 shadow-xl shadow-slate-950/40">
                  Heatmap shows density in recent tracking data.
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0c1524] border border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm text-slate-100">Recommendation Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.length === 0 ? (
                <div className="text-sm text-slate-500">No recommendations available yet.</div>
              ) : (
                recommendations.map((rec, index) => (
                  <div key={index} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{rec.zone}</span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-emerald-300">
                        {Math.round(rec.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-100">{rec.issue}</p>
                    <p className="mt-2 text-sm text-slate-400">{rec.action}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-1 bg-[#0c1524] border border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm text-slate-100">Average Dwell by Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart data={dwellByZone.map((item) => ({ label: item.zone, value: item.average_dwell_seconds }))} color="#22c55e" />
            </CardContent>
          </Card>

          <Card className="xl:col-span-1 bg-[#0c1524] border border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm text-slate-100">Zone Attractiveness</CardTitle>
            </CardHeader>
            <CardContent>
              <DonutChart data={attractiveness.map((item) => ({ label: item.zone, value: item.attractiveness_score }))} />
            </CardContent>
          </Card>

          <Card className="xl:col-span-1 bg-[#0c1524] border border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm text-slate-100">Zone Traffic Score</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={attractiveness.map((item) => ({ label: item.zone, value: item.traffic_score }))} color="#f97316" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
