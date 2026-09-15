interface GaugeProps {
  value: number;
  max?: number;
  label: string;
  size?: number;
  color?: string;
}

export function GaugeChart({ value, max = 1, label, size = 140, color = '#3b82f6' }: GaugeProps) {
  const pct = Math.min(value / max, 1);
  const angle = pct * 180 - 90;
  const radius = 40;
  const cx = 50;
  const cy = 50;

  const startAngle = -Math.PI;
  const endAngle = startAngle + pct * Math.PI;

  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  const largeArc = pct > 0.5 ? 1 : 0;

  const bgEndAngle = startAngle + Math.PI;
  const bgX2 = cx + radius * Math.cos(bgEndAngle);
  const bgY2 = cy + radius * Math.sin(bgEndAngle);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 55" style={{ width: size, height: size * 0.55 }}>
        <path d={`M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${bgX2} ${bgY2}`} fill="none" stroke="#e5e7eb" strokeWidth="6" strokeLinecap="round" />
        <path d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
        <text x={cx} y={42} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1f2937">
          {(pct * 100).toFixed(1)}%
        </text>
      </svg>
      <span className="text-xs text-gray-500 mt-1">{label}</span>
    </div>
  );
}
