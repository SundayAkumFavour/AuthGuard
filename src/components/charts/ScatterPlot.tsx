import { useState } from 'react';

interface ScatterPoint {
  x: number;
  y: number;
  color: string;
  label?: string;
  size?: number;
}

interface ScatterPlotProps {
  points: ScatterPoint[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
  xDomain?: [number, number];
  yDomain?: [number, number];
}

export function ScatterPlot({ points, height = 280, xLabel, yLabel, xDomain, yDomain }: ScatterPlotProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const xMin = xDomain?.[0] ?? Math.min(...points.map(p => p.x), 0);
  const xMax = xDomain?.[1] ?? Math.max(...points.map(p => p.x), 1);
  const yMin = yDomain?.[0] ?? 0;
  const yMax = yDomain?.[1] ?? Math.max(...points.map(p => p.y), 1);

  const pad = 6;
  const chartH = 100;
  const toX = (v: number) => pad + ((v - xMin) / (xMax - xMin || 1)) * (100 - pad * 2);
  const toY = (v: number) => chartH - pad - ((v - yMin) / (yMax - yMin || 1)) * (chartH - pad * 2);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${chartH}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const y = pad + f * (chartH - pad * 2);
          return (
            <g key={i}>
              <line x1={pad} y1={y} x2={100 - pad} y2={y} stroke="#e5e7eb" strokeWidth="0.15" />
              <text x={1} y={y + 1} fontSize="2" fill="#9ca3af">{Math.round(yMin + (yMax - yMin) * (1 - f))}</text>
            </g>
          );
        })}
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const x = pad + f * (100 - pad * 2);
          return <text key={i} x={x} y={chartH - 1} fontSize="2" fill="#9ca3af" textAnchor="middle">{Math.round(xMin + (xMax - xMin) * f)}</text>;
        })}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={toX(p.x)}
            cy={toY(p.y)}
            r={hovered === i ? (p.size ?? 0.8) * 1.5 : p.size ?? 0.8}
            fill={p.color}
            opacity={hovered === null || hovered === i ? 0.7 : 0.3}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-2">
        {xLabel && <span className="text-xs text-gray-500">{xLabel}</span>}
        {yLabel && <span className="text-xs text-gray-500">{yLabel}</span>}
      </div>
      {hovered !== null && points[hovered].label && (
        <div className="mt-1 text-xs text-gray-600 text-center">{points[hovered].label}</div>
      )}
    </div>
  );
}
