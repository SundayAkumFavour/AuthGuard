import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  color?: 'blue' | 'red' | 'green' | 'amber' | 'slate' | 'purple';
  subtitle?: string;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100 text-blue-600', ring: 'ring-blue-100' },
  red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'bg-red-100 text-red-600', ring: 'ring-red-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100 text-green-600', ring: 'ring-green-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100 text-amber-600', ring: 'ring-amber-100' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-600', icon: 'bg-slate-100 text-slate-600', ring: 'ring-slate-100' },
  purple: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'bg-violet-100 text-violet-600', ring: 'ring-violet-100' },
};

export function MetricCard({ label, value, icon: Icon, trend, color = 'blue', subtitle }: MetricCardProps) {
  const c = colorMap[color];
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${c.icon}`}>
          <Icon size={22} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400">vs last period</span>
        </div>
      )}
    </div>
  );
}
