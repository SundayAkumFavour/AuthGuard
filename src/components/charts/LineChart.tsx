import { useState } from 'react';

interface LineDatum {
  label: string;
  value: number;
  value2?: number;
}

interface LineChartProps {
  data: LineDatum[];
  height?: number;
  color?: string;
  color2?: string;
  yLabel?: string;
  formatValue?: (v: number) => string;
}

export function LineChart({ data, height = 240, color = '#3b82f6', color2 = '#ef4444', yLabel, formatValue }: LineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => Math.max(d.value, d.value2 ?? 0)), 1);
  const padding = 4;
  const chartH = height / 2.4;
  const usableH = chartH - padding * 2;
  const stepX = data.length > 1 ? (100 - 8) / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: 4 + i * stepX,
    y: chartH - padding - (d.value / maxVal) * usableH,
    y2: d.value2 != null ? chartH - padding - (d.value2 / maxVal) * usableH : null,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const pathD2 = points.filter(p => p.y2 != null).map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y2}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartH - padding} L ${points[0].x} ${chartH - padding} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${chartH}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id="lineArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const y = padding + f * usableH;
          const val = maxVal * (1 - f);
          return (
            <g key={i}>
              <line x1="4" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.15" />
              <text x="0.5" y={y + 1} fontSize="1.6" fill="#9ca3af">
                {formatValue ? formatValue(val) : Math.round(val)}
              </text>
            </g>
          );
        })}
        <path d={areaD} fill="url(#lineArea)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="0.4" strokeLinejoin="round" />
        {pathD2 && <path d={pathD2} fill="none" stroke={color2} strokeWidth="0.4" strokeDasharray="1,1" strokeLinejoin="round" />}
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <circle cx={p.x} cy={p.y} r={hovered === i ? 1.2 : 0.6} fill={color} />
            {p.y2 != null && <circle cx={p.x} cy={p.y2} r={hovered === i ? 1 : 0.5} fill={color2} />}
            {hovered === i && (
              <line x1={p.x} y1={padding} x2={p.x} y2={chartH - padding} stroke="#d1d5db" strokeWidth="0.15" strokeDasharray="0.5,0.5" />
            )}
          </g>
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-2">
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-gray-400">
            {i % Math.ceil(data.length / 6) === 0 ? d.label : ''}
          </span>
        ))}
      </div>
      {hovered !== null && (
        <div className="mt-1 text-xs text-gray-600 text-center">
          {data[hovered].label}: {formatValue ? formatValue(data[hovered].value) : data[hovered].value}
          {data[hovered].value2 != null && ` / ${formatValue ? formatValue(data[hovered].value2!) : data[hovered].value2}`}
        </div>
      )}
      {yLabel && <div className="text-xs text-gray-400 text-center mt-1">{yLabel}</div>}
    </div>
  );
}
