interface ConfusionMatrixProps {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export function ConfusionMatrix({ tp, fp, tn, fn }: ConfusionMatrixProps) {
  const total = tp + fp + tn + fn || 1;
  const cells = [
    { label: 'True Negatives', value: tn, color: 'bg-green-50 border-green-200 text-green-700', valColor: 'text-green-600' },
    { label: 'False Positives', value: fp, color: 'bg-amber-50 border-amber-200 text-amber-700', valColor: 'text-amber-600' },
    { label: 'False Negatives', value: fn, color: 'bg-red-50 border-red-200 text-red-700', valColor: 'text-red-600' },
    { label: 'True Positives', value: tp, color: 'bg-blue-50 border-blue-200 text-blue-700', valColor: 'text-blue-600' },
  ];

  return (
    <div className="inline-block">
      <div className="grid grid-cols-2 gap-2">
        {cells.map((c, i) => (
          <div key={i} className={`rounded-lg border p-4 text-center ${c.color}`}>
            <div className={`text-2xl font-bold ${c.valColor}`}>{c.value}</div>
            <div className="text-xs mt-1">{c.label}</div>
            <div className="text-[10px] opacity-60 mt-0.5">{((c.value / total) * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-center text-xs text-gray-400">
        Total samples: {total}
      </div>
    </div>
  );
}
