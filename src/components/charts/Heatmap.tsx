interface HeatmapProps {
  data: number[][];
  xLabels: string[];
  yLabels: string[];
  height?: number;
  colorScale?: [string, string];
  title?: string;
}

export function Heatmap({ data, xLabels, yLabels, height = 280, colorScale = ['#eff6ff', '#1e40af'], title }: HeatmapProps) {
  const max = Math.max(...data.flat(), 1);
  const cellW = 100 / xLabels.length;
  const cellH = 100 / yLabels.length;

  function colorFor(val: number): string {
    const t = val / max;
    const r1 = parseInt(colorScale[0].slice(1, 3), 16);
    const g1 = parseInt(colorScale[0].slice(3, 5), 16);
    const b1 = parseInt(colorScale[0].slice(5, 7), 16);
    const r2 = parseInt(colorScale[1].slice(1, 3), 16);
    const g2 = parseInt(colorScale[1].slice(3, 5), 16);
    const b2 = parseInt(colorScale[1].slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  }

  return (
    <div className="w-full">
      {title && <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>}
      <div className="flex">
        <div className="flex flex-col justify-around pr-2" style={{ height }}>
          {yLabels.map((l, i) => (
            <span key={i} className="text-[10px] text-gray-500 text-right leading-tight">{l}</span>
          ))}
        </div>
        <div className="flex-1">
          <svg viewBox="0 0 100 100" className="w-full" preserveAspectRatio="none" style={{ height }}>
            {data.map((row, i) =>
              row.map((val, j) => (
                <rect
                  key={`${i}-${j}`}
                  x={j * cellW}
                  y={i * cellH}
                  width={cellW}
                  height={cellH}
                  fill={colorFor(val)}
                  stroke="white"
                  strokeWidth="0.15"
                />
              ))
            )}
          </svg>
          <div className="flex justify-around mt-1">
            {xLabels.map((l, i) => (
              <span key={i} className="text-[10px] text-gray-500">{l}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 justify-center">
        <span className="text-[10px] text-gray-400">Low</span>
        <div className="w-24 h-2 rounded-full" style={{ background: `linear-gradient(to right, ${colorScale[0]}, ${colorScale[1]})` }} />
        <span className="text-[10px] text-gray-400">High</span>
      </div>
    </div>
  );
}
