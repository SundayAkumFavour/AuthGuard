interface RadarDatum {
  label: string;
  value: number;
  max: number;
}

interface RadarChartProps {
  data: RadarDatum[];
  size?: number;
  color?: string;
}

export function RadarChart({ data, size = 200, color = '#3b82f6' }: RadarChartProps) {
  const cx = 50;
  const cy = 50;
  const radius = 38;
  const numAxes = data.length;
  const angleStep = (Math.PI * 2) / numAxes;

  const axes = data.map((_, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), angle };
  });

  const rings = [0.25, 0.5, 0.75, 1];

  const dataPoints = data.map((d, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = (d.value / d.max) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
        {rings.map((r, i) => {
          const pts = axes.map(a => {
            const x = cx + r * radius * Math.cos(a.angle);
            const y = cy + r * radius * Math.sin(a.angle);
            return `${x},${y}`;
          }).join(' ');
          return <polygon key={i} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="0.2" />;
        })}
        {axes.map((a, i) => (
          <line key={i} x1={cx} y1={cy} x2={a.x} y2={a.y} stroke="#e5e7eb" strokeWidth="0.2" />
        ))}
        <polygon points={polygon} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="0.5" />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="0.8" fill={color} />
        ))}
        {data.map((d, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          const lx = cx + (radius + 8) * Math.cos(angle);
          const ly = cy + (radius + 8) * Math.sin(angle);
          return (
            <text key={i} x={lx} y={ly} fontSize="3" fill="#6b7280" textAnchor="middle" dominantBaseline="middle">
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
