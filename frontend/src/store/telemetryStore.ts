import { create } from 'zustand';

export interface TelemetryPoint {
  session_uuid: string;
  x: number;
  y: number;
  gaze_target_shelf_id: number | null;
  gaze_target_product_id: number | null;
  timestamp: string;
}

interface TelemetryState {
  ws: WebSocket | null;
  points: TelemetryPoint[];
  isConnected: boolean;
  connect: (storeId: number) => void;
  disconnect: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  ws: null,
  points: [],
  isConnected: false,

  connect: (storeId) => {
    // Close existing connection if any
    const existingWs = get().ws;
    if (existingWs) {
      existingWs.close();
    }

    // Determine WS protocol based on window location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // Connect through Nginx proxy
    const wsUrl = `${protocol}//${host}/ws/telemetry/${storeId}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      set({ isConnected: true });
      console.log(`Connected to CAMS real-time telemetry for Store #${storeId}`);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as TelemetryPoint;
        set((state) => {
          // Append new coordinates and truncate history to keep memory usage safe (max 100 points)
          const newPoints = [...state.points, data].slice(-100);
          return { points: newPoints };
        });
      } catch (e) {
        console.error('Failed to parse telemetry coordinates:', e);
      }
    };

    ws.onclose = () => {
      set({ isConnected: false, ws: null });
      console.log(`Disconnected from CAMS telemetry`);
    };

    ws.onerror = (err) => {
      console.error('Telemetry WebSocket Error:', err);
    };

    set({ ws });
  },

  disconnect: () => {
    const ws = get().ws;
    if (ws) {
      ws.close();
    }
    set({ ws: null, points: [], isConnected: false });
  }
}));
