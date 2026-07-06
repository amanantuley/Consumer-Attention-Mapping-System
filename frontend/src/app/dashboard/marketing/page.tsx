'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  BarChart, Percent, HelpCircle, AlertCircle, Sparkles, 
  ArrowUpRight, Play, Cpu, ShieldCheck, RefreshCcw
} from 'lucide-react';

interface Recommendation {
  id: number;
  type: string;
  details: {
    description: string;
    reason: string;
    actionable_steps: string[];
  };
  potential_revenue_impact: number;
  is_applied: boolean;
  created_at: string;
}

interface PredictionState {
  probability: number;
  prediction: string;
  driver: string;
  weight: number;
}

export default function MarketingPage() {
  const { accessToken } = useAuthStore();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dwellTime, setDwellTime] = useState<number>(120);
  const [gazeDuration, setGazeDuration] = useState<number>(45);
  const [zonesVisited, setZonesVisited] = useState<number>(3);
  const [productsPicked, setProductsPicked] = useState<number>(2);
  
  const [prediction, setPrediction] = useState<PredictionState | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState<boolean>(true);

  useEffect(() => {
    fetchRecommendations();
    handlePredict();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const res = await fetch('/api/v1/analytics/recommendations/1', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (e) {
      console.error("Failed to load recommendations", e);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const handlePredict = async () => {
    setIsPredicting(true);
    try {
      const res = await fetch(
        `/api/v1/analytics/predict-conversion?dwell_time=${dwellTime}&gaze_duration=${gazeDuration}&zones_visited=${zonesVisited}&products_picked=${productsPicked}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setPrediction({
          probability: data.purchase_probability,
          prediction: data.prediction,
          driver: data.model_insights.top_driver,
          weight: data.model_insights.driver_weight
        });
      }
    } catch (e) {
      console.error("Failed to execute ML conversion prediction", e);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-emerald-400" /> Marketing Conversions
        </h1>
        <p className="text-zinc-400 text-sm">
          Run XGBoost-based conversion predictions on shopper profiles and inspect automated shelf layout optimization guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* XGBoost Predictive Inference Sandbox */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-zinc-800/80 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5 text-emerald-400" /> ML Conversion Simulator
            </h3>
            <p className="text-zinc-500 text-xs mb-6">
              Adjust behavioral features below to compute the real-time probability of a shopper completing a purchase.
            </p>

            {/* Slider Inputs */}
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-zinc-300">Shopper Dwell Time ({dwellTime} seconds)</span>
                </div>
                <input 
                  type="range" min={10} max={600} step={10} value={dwellTime} 
                  onChange={(e) => setDwellTime(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-zinc-300">Gaze Focus Duration ({gazeDuration} seconds)</span>
                </div>
                <input 
                  type="range" min={0} max={180} step={5} value={gazeDuration} 
                  onChange={(e) => setGazeDuration(Number(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Zones Visited</label>
                  <input 
                    type="number" min={1} max={10} value={zonesVisited} 
                    onChange={(e) => setZonesVisited(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">Products Picked</label>
                  <input 
                    type="number" min={0} max={10} value={productsPicked} 
                    onChange={(e) => setProductsPicked(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Trigger Predict button */}
          <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <button
              onClick={handlePredict}
              disabled={isPredicting}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 text-[#09090b] font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 text-xs"
            >
              <RefreshCcw className={`w-4 h-4 ${isPredicting ? 'animate-spin' : ''}`} /> Run Prediction Inference
            </button>

            {prediction && (
              <div className="flex items-center gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-900/60 max-w-sm">
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">Purchase Prob.</span>
                  <span className="text-2xl font-black text-emerald-400">{(prediction.probability * 100).toFixed(1)}%</span>
                </div>
                <div className="border-l border-zinc-800 pl-4 text-left">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">Top Feature Driver</span>
                  <span className="text-xs text-white font-bold truncate block">{prediction.driver.replace('_', ' ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shelf Layout Recommendations */}
        <div className="glass-panel p-6 rounded-3xl border border-zinc-800/80 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Optimization Guidelines
          </h3>
          <p className="text-zinc-500 text-xs">
            Decision Tree-predicted suggestions to maximize shelf margin conversion.
          </p>

          <div className="space-y-4 overflow-y-auto max-h-96 pr-2">
            {isLoadingRecs ? (
              <div className="py-8 text-center text-xs text-zinc-600">Loading guidelines...</div>
            ) : recommendations.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-600">No suggestions generated yet.</div>
            ) : recommendations.map((rec) => (
              <div key={rec.id} className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-900/80 space-y-3 relative overflow-hidden">
                <div className="absolute right-0 top-0 bg-emerald-500/10 border-b border-l border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-bl-xl flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +${rec.potential_revenue_impact}
                </div>
                <h4 className="text-sm font-bold text-white pr-16">{rec.details.description}</h4>
                <p className="text-[11px] text-zinc-400">{rec.details.reason}</p>
                <div className="space-y-1 pt-1">
                  {rec.details.actionable_steps.map((step, sIdx) => (
                    <div key={sIdx} className="text-[10px] text-zinc-500 flex items-start gap-1.5 leading-relaxed">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
