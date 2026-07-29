import React, { useState } from "react";

// Tooltip helper component
interface TooltipProps {
  x: number;
  y: number;
  content: string;
  visible: boolean;
}

const ChartTooltip: React.FC<TooltipProps> = ({ x, y, content, visible }) => {
  if (!visible) return null;
  return (
    <div
      className="absolute bg-slate-900/95 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none transition-all duration-150 z-50 border border-slate-700/50 backdrop-blur-sm -translate-x-1/2 -translate-y-full"
      style={{ left: x, top: y - 10 }}
    >
      {content}
    </div>
  );
};

// ==========================================
// 1. LineChart Component
// ==========================================
interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ data, height = 200, color = "#3b82f6" }) => {
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, content: "", visible: false });
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const width = 500;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = 0;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((d.value - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });

  const pathD = points.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ""
  );

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
          const y = padding + chartHeight * r;
          const val = Math.round(maxVal - r * maxVal);
          return (
            <g key={idx} className="opacity-40">
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" />
              <text x={padding - 10} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-medium">{val}</text>
            </g>
          );
        })}

        {/* X labels */}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={height - 10} textAnchor="middle" className="fill-slate-400 text-[9px] font-medium">
            {p.label}
          </text>
        ))}

        {/* Line path */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Interactive dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            className="fill-white stroke-blue-600 stroke-[2px] cursor-pointer hover:r-6 transition-all"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                setTooltip({
                  x: (p.x / width) * rect.width,
                  y: (p.y / height) * rect.height,
                  content: `${p.label}: ${p.value}`,
                  visible: true,
                });
              }
            }}
            onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
          />
        ))}
      </svg>
      <ChartTooltip {...tooltip} />
    </div>
  );
};

// ==========================================
// 2. AreaChart Component
// ==========================================
export const AreaChart: React.FC<LineChartProps> = ({ data, height = 200, color = "#3b82f6" }) => {
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, content: "", visible: false });
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const width = 500;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - (d.value / maxVal) * chartHeight;
    return { x, y, label: d.label, value: d.value };
  });

  const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
          const y = padding + chartHeight * r;
          return (
            <line key={idx} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth={1} />
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} />

        {/* Interactive nodes */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={5}
            className="fill-white stroke-[2px] cursor-pointer"
            style={{ stroke: color }}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                setTooltip({
                  x: (p.x / width) * rect.width,
                  y: (p.y / height) * rect.height,
                  content: `${p.label}: ${p.value}`,
                  visible: true,
                });
              }
            }}
            onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
          />
        ))}
      </svg>
      <ChartTooltip {...tooltip} />
    </div>
  );
};

// ==========================================
// 3. BarChart Component (Vertical)
// ==========================================
export const BarChart: React.FC<LineChartProps> = ({ data, height = 200, color = "#3b82f6" }) => {
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, content: "", visible: false });
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const width = 500;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barWidth = (chartWidth / data.length) * 0.6;
  const gap = (chartWidth / data.length) * 0.4;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
          const y = padding + chartHeight * r;
          return (
            <line key={idx} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth={1} />
          );
        })}

        {/* Render Bars */}
        {data.map((d, i) => {
          const x = padding + i * (barWidth + gap) + gap / 2;
          const h = (d.value / maxVal) * chartHeight;
          const y = padding + chartHeight - h;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                fill={color}
                rx={3}
                className="cursor-pointer hover:opacity-85 transition-opacity"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      x: ((x + barWidth / 2) / width) * rect.width,
                      y: (y / height) * rect.height,
                      content: `${d.label}: ${d.value}`,
                      visible: true,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
              />
              <text x={x + barWidth / 2} y={height - 12} textAnchor="middle" className="fill-slate-400 text-[9px] font-medium">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartTooltip {...tooltip} />
    </div>
  );
};

// ==========================================
// 4. HorizontalBarChart Component
// ==========================================
export const HorizontalBarChart: React.FC<LineChartProps> = ({ data, height = 200, color = "#6366f1" }) => {
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, content: "", visible: false });
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const width = 500;
  const paddingLeft = 110;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const rowHeight = chartHeight / data.length;
  const barHeight = rowHeight * 0.65;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {data.map((d, i) => {
          const y = paddingTop + i * rowHeight + (rowHeight - barHeight) / 2;
          const w = (d.value / maxVal) * chartWidth;

          return (
            <g key={i}>
              {/* Label */}
              <text
                x={paddingLeft - 10}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                className="fill-slate-600 text-[10px] font-semibold"
              >
                {d.label}
              </text>

              {/* Background slot */}
              <rect x={paddingLeft} y={y} width={chartWidth} height={barHeight} fill="#f1f5f9" rx={4} />

              {/* Fill bar */}
              <rect
                x={paddingLeft}
                y={y}
                width={w}
                height={barHeight}
                fill={color}
                rx={4}
                className="cursor-pointer hover:opacity-90 transition-all"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      x: ((paddingLeft + w / 2) / width) * rect.width,
                      y: (y / height) * rect.height,
                      content: `${d.label}: ${d.value}`,
                      visible: true,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
              />

              {/* Value Label */}
              <text x={paddingLeft + w + 8} y={y + barHeight / 2 + 4} className="fill-slate-700 text-[10px] font-bold">
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
      <ChartTooltip {...tooltip} />
    </div>
  );
};

// ==========================================
// 5. DonutChart & PieChart
// ==========================================
export const DonutChart: React.FC<LineChartProps> = ({ data, height = 200 }) => {
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, content: "", visible: false });
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = 65;
  const strokeWidth = 18;
  const cx = 150;
  const cy = 100;
  const circumference = 2 * Math.PI * radius;

  // Modern soft color palette
  const colors = ["#3b82f6", "#a855f7", "#10b981", "#f59e0b", "#ec4899", "#6366f1", "#14b8a6"];

  let accumulatedPercent = 0;

  return (
    <div className="relative w-full flex items-center justify-between" style={{ height }}>
      <svg viewBox="0 0 300 200" className="w-[60%] h-full">
        {data.map((d, i) => {
          const percent = d.value / total;
          const strokeDashoffset = circumference - percent * circumference;
          const rotation = accumulatedPercent * 360 - 90;
          accumulatedPercent += percent;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="transparent"
              stroke={colors[i % colors.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(${rotation} ${cx} ${cy})`}
              className="cursor-pointer hover:stroke-[22px] transition-all duration-200"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (rect) {
                  setTooltip({
                    x: (cx / 300) * rect.width,
                    y: (cy / 200) * rect.height,
                    content: `${d.label}: ${d.value} (${Math.round(percent * 100)}%)`,
                    visible: true,
                  });
                }
              }}
              onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
            />
          );
        })}
        {/* Center label */}
        <text x={cx} y={cy + 4} textAnchor="middle" className="fill-slate-800 text-xs font-bold">
          Total: {total}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex-1 space-y-1.5 pr-4 text-xs font-medium text-slate-600">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="truncate max-w-[100px]">{d.label}</span>
            <span className="ml-auto text-slate-400 font-bold">{d.value}</span>
          </div>
        ))}
      </div>
      <ChartTooltip {...tooltip} />
    </div>
  );
};

// ==========================================
// 6. PieChart Component
// ==========================================
export const PieChart: React.FC<LineChartProps> = ({ data, height = 200 }) => {
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, content: "", visible: false });
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const cx = 120;
  const cy = 100;
  const radius = 70;

  const colors = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];
  let accumulatedAngle = 0;

  return (
    <div className="relative w-full flex items-center justify-between" style={{ height }}>
      <svg viewBox="0 0 300 200" className="w-[60%] h-full">
        {data.map((d, i) => {
          const angle = (d.value / total) * 360;
          const startAngle = accumulatedAngle;
          const endAngle = accumulatedAngle + angle;
          accumulatedAngle += angle;

          // Polar coordinates calculations
          const rad = Math.PI / 180;
          const x1 = cx + radius * Math.cos(startAngle * rad);
          const y1 = cy + radius * Math.sin(startAngle * rad);
          const x2 = cx + radius * Math.cos(endAngle * rad);
          const y2 = cy + radius * Math.sin(endAngle * rad);

          const largeArc = angle > 180 ? 1 : 0;
          const dPath = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

          return (
            <path
              key={i}
              d={dPath}
              fill={colors[i % colors.length]}
              className="cursor-pointer hover:opacity-90 transition-opacity stroke-white stroke-2"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (rect) {
                  setTooltip({
                    x: (cx / 300) * rect.width,
                    y: (cy / 200) * rect.height,
                    content: `${d.label}: ${d.value} (${Math.round((d.value / total) * 100)}%)`,
                    visible: true,
                  });
                }
              }}
              onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex-1 space-y-1 text-xs text-slate-600 font-medium">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="truncate max-w-[100px]">{d.label}</span>
            <span className="ml-auto text-slate-400 font-bold">{d.value}</span>
          </div>
        ))}
      </div>
      <ChartTooltip {...tooltip} />
    </div>
  );
};

// ==========================================
// 7. FunnelChart Component
// ==========================================
interface FunnelChartProps {
  data: { stage: string; value: number }[];
  height?: number;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ data, height = 220 }) => {
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const width = 400;
  const rowHeight = (height - 30) / data.length;
  const maxVal = data[0].value || 1;

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {data.map((d, i) => {
          const topWidth = (d.value / maxVal) * 280;
          const nextData = data[i + 1];
          const bottomWidth = nextData ? (nextData.value / maxVal) * 280 : topWidth * 0.85;

          const y1 = i * rowHeight + 10;
          const y2 = y1 + rowHeight - 12;

          const x1 = (width - topWidth) / 2;
          const x2 = (width - bottomWidth) / 2;

          const points = `${x1},${y1} ${x1 + topWidth},${y1} ${x2 + bottomWidth},${y2} ${x2},${y2}`;

          return (
            <g key={i}>
              <polygon
                points={points}
                fill={`rgba(59, 130, 246, ${1 - i * 0.18})`}
                stroke="#3b82f6"
                strokeWidth={1}
              />
              <text x={width / 2} y={y1 + rowHeight / 2 - 3} textAnchor="middle" className="fill-white text-[10px] font-bold">
                {d.stage} ({d.value})
              </text>
              {nextData && (
                <text x={width / 2} y={y2 + 8} textAnchor="middle" className="fill-slate-400 text-[8px] font-medium">
                  Drop-off: {Math.round((1 - nextData.value / d.value) * 100)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ==========================================
// 8. GaugeChart Component
// ==========================================
interface GaugeProps {
  value: number; // 0 to 100
  title: string;
  height?: number;
}

export const GaugeChart: React.FC<GaugeProps> = ({ value, title, height = 150 }) => {
  const cx = 150;
  const cy = 130;
  const radius = 80;
  const angle = (value / 100) * 180;
  const rad = Math.PI / 180;

  // Hand pointer tip
  const needleX = cx + (radius - 15) * Math.cos((angle - 180) * rad);
  const needleY = cy + (radius - 15) * Math.sin((angle - 180) * rad);

  return (
    <div className="w-full flex flex-col items-center justify-center" style={{ height }}>
      <svg viewBox="0 0 300 160" className="w-full h-full">
        {/* Background semicircle arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={15}
          strokeLinecap="round"
        />

        {/* Fill level arc */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius * Math.cos((angle - 180) * rad)} ${cy + radius * Math.sin((angle - 180) * rad)}`}
          fill="none"
          stroke="#10b981"
          strokeWidth={15}
          strokeLinecap="round"
        />

        {/* Needle pointer */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#f43f5e" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill="#f43f5e" />

        {/* Value overlay text */}
        <text x={cx} y={cy - 15} textAnchor="middle" className="fill-slate-800 text-lg font-extrabold">
          {value}%
        </text>
        <text x={cx} y={cy + 22} textAnchor="middle" className="fill-slate-400 text-[10px] font-semibold uppercase">
          {title}
        </text>
      </svg>
    </div>
  );
};

// ==========================================
// 9. SankeyDiagram Component
// ==========================================
interface SankeyProps {
  flows: { source: string; target: string; value: number }[];
  height?: number;
}

export const SankeyDiagram: React.FC<SankeyProps> = ({ flows, height = 240 }) => {
  if (!flows || flows.length === 0) return <div className="text-gray-400 text-sm">No flow data</div>;

  // Unique sorted nodes list
  const nodesSet = new Set<string>();
  flows.forEach((f) => {
    nodesSet.add(f.source);
    nodesSet.add(f.target);
  });
  const nodes = Array.from(nodesSet);

  // Layout node levels (columns)
  const columns: Record<string, number> = {
    Entrance: 0,
    Beverages: 1,
    Snacks: 1,
    Checkout: 2,
    "Foyer Zone": 0,
    "Aisle Left": 1,
    "Aisle Right": 1,
    "Checkout Lanes": 2,
  };

  const colPositions = [40, 190, 340];
  const nodeHeights: Record<string, number> = {};
  const nodeY: Record<string, number> = {};

  // Compute node flows value
  nodes.forEach((node) => {
    const outValue = flows.filter((f) => f.source === node).reduce((acc, f) => acc + f.value, 0);
    const inValue = flows.filter((f) => f.target === node).reduce((acc, f) => acc + f.value, 0);
    const maxVal = Math.max(outValue, inValue, 10);
    nodeHeights[node] = Math.min(maxVal * 2, 70); // scale height
  });

  // Assign Y layout offsets to prevent overlapping
  const colCounts = [0, 0, 0];
  nodes.forEach((node) => {
    const col = columns[node] !== undefined ? columns[node] : 1;
    const yOffset = 30 + colCounts[col] * 90;
    nodeY[node] = yOffset;
    colCounts[col] += 1;
  });

  return (
    <div className="w-full bg-slate-50/50 p-4 rounded-xl border border-slate-100" style={{ height }}>
      <svg viewBox="0 0 400 220" className="w-full h-full">
        {/* Render flow connecting channels */}
        {flows.map((flow, i) => {
          const colSrc = columns[flow.source] !== undefined ? columns[flow.source] : 0;
          const colTgt = columns[flow.target] !== undefined ? columns[flow.target] : 2;

          const x1 = colPositions[colSrc] + 12;
          const y1 = nodeY[flow.source] + nodeHeights[flow.source] / 2;
          const x2 = colPositions[colTgt];
          const y2 = nodeY[flow.target] + nodeHeights[flow.target] / 2;

          const ctrlX1 = x1 + 50;
          const ctrlX2 = x2 - 50;

          const strokeWidth = Math.min(flow.value * 1.5, 30);
          const pathD = `M ${x1} ${y1} C ${ctrlX1} ${y1}, ${ctrlX2} ${y2}, ${x2} ${y2}`;

          return (
            <path
              key={i}
              d={pathD}
              fill="none"
              stroke="rgba(99, 102, 241, 0.15)"
              strokeWidth={strokeWidth}
              className="hover:stroke-indigo-500/30 transition-all cursor-pointer"
            />
          );
        })}

        {/* Render Nodes block */}
        {nodes.map((node, i) => {
          const col = columns[node] !== undefined ? columns[node] : 1;
          const x = colPositions[col];
          const y = nodeY[node];
          const h = nodeHeights[node];

          return (
            <g key={i}>
              <rect x={x} y={y} width={12} height={h} fill="#4f46e5" rx={2} />
              <text
                x={col === 0 ? x + 18 : x - 8}
                y={y + h / 2 + 4}
                textAnchor={col === 0 ? "start" : "end"}
                className="fill-slate-800 text-[10px] font-bold"
              >
                {node}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ==========================================
// 10. RadarChart Component
// ==========================================
interface RadarProps {
  data: { label: string; value: number }[]; // values 0 to 100
  height?: number;
}

export const RadarChart: React.FC<RadarProps> = ({ data, height = 200 }) => {
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const cx = 150;
  const cy = 100;
  const rMax = 65;
  const angleStep = (2 * Math.PI) / data.length;

  // Web coordinate calculations
  const levels = [0.25, 0.5, 0.75, 1];
  const gridPaths = levels.map((lvl) => {
    return data
      .map((_, i) => {
        const x = cx + rMax * lvl * Math.cos(i * angleStep - Math.PI / 2);
        const y = cy + rMax * lvl * Math.sin(i * angleStep - Math.PI / 2);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ") + " Z";
  });

  const valuePoints = data
    .map((d, i) => {
      const dist = (d.value / 100) * rMax;
      const x = cx + dist * Math.cos(i * angleStep - Math.PI / 2);
      const y = cy + dist * Math.sin(i * angleStep - Math.PI / 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full flex justify-center" style={{ height }}>
      <svg viewBox="0 0 300 200" className="w-[85%] h-full">
        {/* Draw outer grid web */}
        {gridPaths.map((path, idx) => (
          <path key={idx} d={path} fill="none" stroke="#e2e8f0" strokeWidth={1} />
        ))}

        {/* Axis spoke lines */}
        {data.map((d, i) => {
          const x = cx + rMax * Math.cos(i * angleStep - Math.PI / 2);
          const y = cy + rMax * Math.sin(i * angleStep - Math.PI / 2);
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" strokeWidth={1} />
              {/* Spoke label text */}
              <text
                x={cx + (rMax + 14) * Math.cos(i * angleStep - Math.PI / 2)}
                y={cy + (rMax + 8) * Math.sin(i * angleStep - Math.PI / 2) + 3}
                textAnchor="middle"
                className="fill-slate-500 text-[9px] font-bold"
              >
                {d.label}
              </text>
            </g>
          );
        })}

        {/* Draw filled values polygon */}
        <polygon points={valuePoints} fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth={2} />
      </svg>
    </div>
  );
};

// ==========================================
// 11. BoxPlot Component
// ==========================================
interface BoxPlotProps {
  data: { label: string; min: number; q1: number; median: number; q3: number; max: number }[];
  height?: number;
}

export const BoxPlot: React.FC<BoxPlotProps> = ({ data, height = 200 }) => {
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const width = 450;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max value of dataset
  const absoluteMax = Math.max(...data.map((d) => d.max), 1);
  const colWidth = chartWidth / data.length;
  const boxWidth = colWidth * 0.55;

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Draw y scale grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
          const y = paddingTop + chartHeight * r;
          const val = Math.round(absoluteMax - r * absoluteMax);
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#f1f5f9" strokeWidth={1} />
              <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="fill-slate-400 text-[9px]">
                {val}s
              </text>
            </g>
          );
        })}

        {/* Box slots */}
        {data.map((d, i) => {
          const x = paddingLeft + i * colWidth + (colWidth - boxWidth) / 2;

          // Convert raw stats to Y coordinates
          const scaleY = (val: number) => paddingTop + chartHeight - (val / absoluteMax) * chartHeight;
          const yMax = scaleY(d.max);
          const yQ3 = scaleY(d.q3);
          const yMedian = scaleY(d.median);
          const yQ1 = scaleY(d.q1);
          const yMin = scaleY(d.min);

          const midX = x + boxWidth / 2;

          return (
            <g key={i}>
              {/* Whiskers */}
              <line x1={midX} y1={yMax} x2={midX} y2={yMin} stroke="#64748b" strokeWidth={1.5} strokeDasharray="3,3" />
              <line x1={midX - 10} y1={yMax} x2={midX + 10} y2={yMax} stroke="#64748b" strokeWidth={1.5} />
              <line x1={midX - 10} y1={yMin} x2={midX + 10} y2={yMin} stroke="#64748b" strokeWidth={1.5} />

              {/* Box rect */}
              <rect
                x={x}
                y={yQ3}
                width={boxWidth}
                height={Math.abs(yQ1 - yQ3)}
                fill="rgba(59, 130, 246, 0.15)"
                stroke="#3b82f6"
                strokeWidth={1.5}
                rx={1}
              />

              {/* Median Line */}
              <line x1={x} y1={yMedian} x2={x + boxWidth} y2={yMedian} stroke="#ef4444" strokeWidth={2} />

              {/* Label */}
              <text x={midX} y={height - 4} textAnchor="middle" className="fill-slate-500 text-[9px] font-semibold">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ==========================================
// 12. ScatterPlot & BubbleChart
// ==========================================
interface ScatterProps {
  data: { x: number; y: number; size?: number; label: string }[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
}

export const ScatterPlot: React.FC<ScatterProps> = ({ data, xLabel = "X", yLabel = "Y", height = 200 }) => {
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const width = 500;
  const paddingLeft = 50;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingRight = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxX = Math.max(...data.map((d) => d.x), 1);
  const maxY = Math.max(...data.map((d) => d.y), 1);

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Axes lines */}
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#cbd5e1" strokeWidth={1.5} />
        <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={height - paddingBottom} stroke="#cbd5e1" strokeWidth={1.5} />

        {/* Render grid coordinates */}
        {data.map((d, i) => {
          const cx = paddingLeft + (d.x / maxX) * chartWidth;
          const cy = paddingTop + chartHeight - (d.y / maxY) * chartHeight;
          const r = d.size ? Math.min(d.size * 1.5, 16) : 6;

          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} fill="rgba(59, 130, 246, 0.6)" stroke="#3b82f6" strokeWidth={1.5} />
              <text x={cx} y={cy - r - 4} textAnchor="middle" className="fill-slate-600 text-[8px] font-semibold">
                {d.label}
              </text>
            </g>
          );
        })}

        {/* Axis Labels */}
        <text x={width / 2} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[9px] font-bold uppercase">
          {xLabel}
        </text>
        <text
          x={12}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90 12 ${height / 2})`}
          className="fill-slate-400 text-[9px] font-bold uppercase"
        >
          {yLabel}
        </text>
      </svg>
    </div>
  );
};

// ==========================================
// 13. TreeMap Component
// ==========================================
interface TreeMapProps {
  data: { label: string; value: number }[];
  height?: number;
}

export const TreeMap: React.FC<TreeMapProps> = ({ data, height = 200 }) => {
  if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No data</div>;

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const colors = ["bg-indigo-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-violet-500"];

  return (
    <div className="w-full flex flex-wrap gap-1" style={{ height }}>
      {data.map((d, i) => {
        const percentage = (d.value / total) * 100;
        return (
          <div
            key={i}
            className={`${colors[i % colors.length]} text-white p-2.5 rounded-lg flex flex-col justify-between shadow-sm cursor-pointer hover:scale-[1.01] transition-transform`}
            style={{
              width: `calc(${percentage}% - 4px)`,
              minWidth: "60px",
              flexGrow: 1,
              height: "100%",
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider truncate">{d.label}</span>
            <span className="text-sm font-extrabold">{d.value}%</span>
          </div>
        );
      })}
    </div>
  );
};
