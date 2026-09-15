import { useEffect, useState } from 'react';
import { Database, RefreshCw, Download, Table, Users, Calendar, Server } from 'lucide-react';
import { MetricCard } from '@/components/charts';
import { getState, subscribe, generateAndStoreData } from '@/lib/store';
import { USERS, ACTIVITIES } from '@/lib/dataGenerator';

export function DataCollectionPage() {
  const [state, setLocalState] = useState(getState());
  const [loading, setLoading] = useState(false);
  const [numDays, setNumDays] = useState(30);

  useEffect(() => {
    const unsub = subscribe(() => setLocalState(getState()));
    setLocalState(getState());
    return unsub;
  }, []);

  async function handleGenerate() {
    setLoading(true);
    await generateAndStoreData();
    setLoading(false);
  }

  const stats = state.stats;
  const recentEvents = state.events.slice(-15).reverse();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
          <Database size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-blue-900">CMU Insider Threat Test Dataset</h3>
          <p className="text-sm text-blue-700 mt-1">
            Based on the Carnegie Mellon University Insider Threat dataset (r6.2) available at
            kilthub.cmu.edu. This system generates synthetic login events that mirror the structure
            of the CMU dataset — user IDs, timestamps, PC identifiers, IP addresses, and activity types —
            with injected anomalous behaviors for detection testing.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Dataset Configuration</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of Days</label>
            <input
              type="range"
              min={7}
              max={60}
              value={numDays}
              onChange={e => setNumDays(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>7 days</span>
              <span className="font-medium text-blue-600">{numDays} days</span>
              <span>60 days</span>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : state.isGenerated ? (
              <>
                <RefreshCw size={18} />
                Regenerate
              </>
            ) : (
              <>
                <Database size={18} />
                Generate Dataset
              </>
            )}
          </button>
        </div>
      </div>

      {state.isGenerated && stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Total Events" value={stats.total_events.toLocaleString()} icon={Database} color="blue" />
            <MetricCard label="Users" value={stats.total_users} icon={Users} color="slate" />
            <MetricCard label="Anomalies" value={stats.anomaly_count} icon={Table} color="red" />
            <MetricCard label="Normal Events" value={stats.normal_count.toLocaleString()} icon={Table} color="green" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-gray-400" />
                <h4 className="font-medium text-gray-700 text-sm">Date Range</h4>
              </div>
              <p className="text-lg font-bold text-gray-900">{numDays} days</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(stats.date_range[0]).toLocaleDateString()} — {new Date(stats.date_range[1]).toLocaleDateString()}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-gray-400" />
                <h4 className="font-medium text-gray-700 text-sm">User IDs</h4>
              </div>
              <div className="flex flex-wrap gap-1">
                {USERS.slice(0, 8).map(u => (
                  <span key={u} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{u}</span>
                ))}
                <span className="text-xs text-gray-400 px-1">+{USERS.length - 8} more</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Server size={16} className="text-gray-400" />
                <h4 className="font-medium text-gray-700 text-sm">Activity Types</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ACTIVITIES.map(a => (
                  <span key={a} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{a}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Sample Login Events</h3>
              <span className="text-xs text-gray-400">Showing latest 15 events</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="text-left px-4 py-2.5 font-medium">User</th>
                    <th className="text-left px-4 py-2.5 font-medium">Timestamp</th>
                    <th className="text-left px-4 py-2.5 font-medium">Day</th>
                    <th className="text-left px-4 py-2.5 font-medium">Hour</th>
                    <th className="text-left px-4 py-2.5 font-medium">PC</th>
                    <th className="text-left px-4 py-2.5 font-medium">IP Address</th>
                    <th className="text-left px-4 py-2.5 font-medium">Activity</th>
                    <th className="text-left px-4 py-2.5 font-medium">Flags</th>
                    <th className="text-center px-4 py-2.5 font-medium">Anomaly</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((evt, i) => (
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-gray-700">{evt.user_id}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">{new Date(evt.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">{['Su','Mo','Tu','We','Th','Fr','Sa'][evt.day_of_week]}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">{evt.hour_of_day}:00</td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{evt.pc_id}</td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-500">{evt.ip_address}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{evt.activity}</td>
                      <td className="px-4 py-2 text-xs">
                        <div className="flex gap-1">
                          {evt.is_off_hours && <span className="bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded text-[10px]">Off-Hours</span>}
                          {evt.is_weekend && <span className="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-[10px]">Weekend</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {evt.is_anomaly ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
