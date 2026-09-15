import { useState } from 'react';

interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  yLabel?: string;
  formatValue?: (v: number) => string;
}

export function BarChart({ data, height = 240, yLabel, formatValue }: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barWidth = 100 / (data.length * 1.5);
  const gap = barWidth / 2;
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (maxVal / tickCount) * i);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height / 2.4}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="barGradAnom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => {
          const y = (height / 2.4) - (t / maxVal) * (height / 2.4 - 10) - 2;
          return (
            <g key={i}>
              <line x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.15" />
              <text x="0.5" y={y} fontSize="1.8" fill="#9ca3af" textAnchor="start">
                {formatValue ? formatValue(t) : Math.round(t)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * (height / 2.4 - 10);
          const y = (height / 2.4) - barH - 2;
          const x = gap + i * (barWidth + gap);
          const isHovered = hovered === i;
          const color = d.color === 'red' ? 'url(#barGradAnom)' : 'url(#barGrad)';
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill={color}
                rx="0.5"
                opacity={isHovered ? 1 : 0.85}
              />
              <text x={x + barWidth / 2} y={height / 2.4 - 0.5} fontSize="1.6" fill="#6b7280" textAnchor="middle">
                {d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {hovered !== null && (
        <div className="mt-1 text-xs text-gray-600 text-center">
          {data[hovered].label}: {formatValue ? formatValue(data[hovered].value) : data[hovered].value}
        </div>
      )}
      {yLabel && <div className="text-xs text-gray-400 text-center mt-1">{yLabel}</div>}
    </div>
  );
}
