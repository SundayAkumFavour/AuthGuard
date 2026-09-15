import { useEffect, useState } from 'react';
import { BarChart3, Clock, Calendar, Monitor, Network, AlertTriangle } from 'lucide-react';
import { BarChart, Heatmap, DonutChart, LineChart, ScatterPlot } from '@/components/charts';
import { MetricCard } from '@/components/charts';
import { getState, subscribe } from '@/lib/store';

export function EDAPage() {
  const [state, setLocalState] = useState(getState());

  useEffect(() => {
    const unsub = subscribe(() => setLocalState(getState()));
    setLocalState(getState());
    return unsub;
  }, []);

  if (!state.isGenerated) {
    return (
      <div className="text-center py-20 text-gray-400">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
        <p>Generate a dataset first to explore the data.</p>
      </div>
    );
  }

  const events = state.events;

  const hourDistribution = Array.from({ length: 24 }, (_, h) => {
    const count = events.filter(e => e.hour_of_day === h).length;
    const anomalies = events.filter(e => e.hour_of_day === h && e.is_anomaly).length;
    return { label: `${h}`, value: count, color: anomalies > 0 ? 'red' : 'blue' };
  });

  const dayDistribution = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => ({
    label: day,
    value: events.filter(e => e.day_of_week === i).length,
  }));

  const activityByAnomaly = ACTIVITIES_LIST.map(act => ({
    label: act,
    value: events.filter(e => e.activity === act && e.is_anomaly).length,
  }));

  const heatmapData = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) =>
      events.filter(e => e.day_of_week === day && e.hour_of_day === hour).length
    )
  );

  const pcUsage = Array.from(new Set(events.map(e => e.pc_id))).map(pc => ({
    label: pc,
    value: events.filter(e => e.pc_id === pc).length,
  })).sort((a, b) => b.value - a.value).slice(0, 10);

  const anomalyByUser = Array.from(new Set(events.map(e => e.user_id))).map(uid => ({
    label: uid,
    value: events.filter(e => e.user_id === uid && e.is_anomaly).length,
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  const scatterPoints = events.slice(0, 500).map(e => ({
    x: e.hour_of_day,
    y: e.day_of_week,
    color: e.is_anomaly ? '#ef4444' : '#3b82f6',
    label: `${e.user_id} @ ${e.hour_of_day}:00`,
    size: e.is_anomaly ? 1.2 : 0.6,
  }));

  const offHoursCount = events.filter(e => e.is_off_hours).length;
  const weekendCount = events.filter(e => e.is_weekend).length;
  const uniqueIPs = new Set(events.map(e => e.ip_address)).size;
  const uniquePCs = new Set(events.map(e => e.pc_id)).size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Off-Hours Logins" value={offHoursCount} icon={Clock} color="amber" subtitle={`${((offHoursCount / events.length) * 100).toFixed(1)}% of total`} />
        <MetricCard label="Weekend Logins" value={weekendCount} icon={Calendar} color="purple" subtitle={`${((weekendCount / events.length) * 100).toFixed(1)}% of total`} />
        <MetricCard label="Unique Devices" value={uniquePCs} icon={Monitor} color="blue" />
        <MetricCard label="Unique IP Addresses" value={uniqueIPs} icon={Network} color="slate" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-1">Login Distribution by Hour</h3>
          <p className="text-xs text-gray-500 mb-4">Red bars indicate hours with anomalies</p>
          <BarChart data={hourDistribution} height={260} />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-1">Login Distribution by Day</h3>
          <p className="text-xs text-gray-500 mb-4">Weekly login patterns</p>
          <BarChart data={dayDistribution} height={260} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-1">Activity Heatmap: Day of Week vs Hour of Day</h3>
        <p className="text-xs text-gray-500 mb-4">Darker cells indicate more login activity</p>
        <Heatmap
          data={heatmapData}
          xLabels={Array.from({ length: 24 }, (_, i) => `${i}`)}
          yLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
          height={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Anomalous Activities by Type</h3>
          <DonutChart
            data={activityByAnomaly.map((d, i) => ({
              ...d,
              color: ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981'][i],
            }))}
            centerLabel="Anomalies"
            centerValue={activityByAnomaly.reduce((a, b) => a + b.value, 0).toString()}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Top 10 Devices by Usage</h3>
          <BarChart data={pcUsage} height={260} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-1">Login Time Scatter Plot</h3>
          <p className="text-xs text-gray-500 mb-4">Red dots are anomalies, blue are normal events</p>
          <ScatterPlot
            points={scatterPoints}
            height={280}
            xLabel="Hour of Day"
            yLabel="Day of Week"
            xDomain={[0, 23]}
            yDomain={[0, 6]}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Anomalies per User</h3>
          {anomalyByUser.length > 0 ? (
            <BarChart data={anomalyByUser} height={280} />
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
              <div className="text-center">
                <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                No anomalies detected in dataset
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Daily Login Trend</h3>
        <LineChart
          data={getDailyTrend(events)}
          height={260}
          color="#3b82f6"
          color2="#ef4444"
          yLabel="Number of logins"
        />
      </div>
    </div>
  );
}

const ACTIVITIES_LIST = ['Logon', 'Logoff', 'HTTP', 'File', 'Email'];

function getDailyTrend(events: { timestamp: string; is_anomaly: boolean }[]) {
  const byDate = new Map<string, { total: number; anomalies: number }>();
  for (const evt of events) {
    const date = new Date(evt.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!byDate.has(date)) byDate.set(date, { total: 0, anomalies: 0 });
    const entry = byDate.get(date)!;
    entry.total++;
    if (evt.is_anomaly) entry.anomalies++;
  }
  return Array.from(byDate.entries()).map(([label, v]) => ({
    label,
    value: v.total,
    value2: v.anomalies,
  }));
}
