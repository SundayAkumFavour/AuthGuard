import { useEffect, useState } from 'react';
import {
  ShieldCheck, AlertTriangle, Users, Database, TrendingUp,
  Activity, Cpu, CheckCircle, ArrowRight
} from 'lucide-react';
import { MetricCard, LineChart, DonutChart, BarChart } from '@/components/charts';
import { getState, subscribe, generateAndStoreData, loadDataFromDB } from '@/lib/store';
import type { PageId } from '@/lib/types';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [state, setLocalState] = useState(getState());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = subscribe(() => setLocalState(getState()));
    setLocalState(getState());
    return unsub;
  }, []);

  useEffect(() => {
    loadDataFromDB().then(() => setLocalState(getState()));
  }, []);

  async function handleGenerate() {
    setLoading(true);
    await generateAndStoreData();
    setLoading(false);
  }

  const stats = state.stats;
  const anomalyRate = stats && stats.total_events > 0
    ? (stats.anomaly_count / stats.total_events) * 100
    : 0;

  const eventsByDay = state.events.length > 0
    ? Array.from({ length: 7 }, (_, i) => {
        const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];
        const count = state.events.filter(e => e.day_of_week === i).length;
        const anomalies = state.events.filter(e => e.day_of_week === i && e.is_anomaly).length;
        return { label: day, value: count, value2: anomalies };
      })
    : [];

  const activityDistribution = state.events.length > 0
    ? ['Logon', 'Logoff', 'HTTP', 'File', 'Email'].map(act => {
        const count = state.events.filter(e => e.activity === act).length;
        return { label: act, value: count };
      })
    : [];

  const userActivity = state.events.length > 0
    ? Array.from(new Set(state.events.map(e => e.user_id))).slice(0, 10).map(uid => ({
        label: uid,
        value: state.events.filter(e => e.user_id === uid).length,
        color: state.events.some(e => e.user_id === uid && e.is_anomaly) ? 'red' : 'blue',
      }))
    : [];

  if (!state.isGenerated) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-xl mb-6">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to AuthGuard ML</h2>
          <p className="text-gray-500 max-w-xl mx-auto mb-8">
            An AI-powered authentication anomaly detection system inspired by the CMU Insider Threat dataset.
            Generate synthetic login events to start exploring the full ML pipeline — from data collection
            through real-time anomaly detection.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Dataset...
              </>
            ) : (
              <>
                <Database size={20} />
                Generate Dataset
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 mt-4">Synthesizes ~3,000 login events across 15 users over 30 days</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            { icon: Database, title: 'Data Collection', desc: 'CMU-style insider threat dataset with login events, timestamps, devices, and IPs', page: 'data-collection' as PageId },
            { icon: Cpu, title: 'ML Pipeline', desc: 'Feature engineering, model training, and evaluation with 5 anomaly detection algorithms', page: 'model-training' as PageId },
            { icon: Activity, title: 'Real-Time Detection', desc: 'Live anomaly scoring with behavioral profiling and instant alert generation', page: 'anomaly-detection' as PageId },
          ].map((f, i) => (
            <div
              key={i}
              onClick={() => onNavigate(f.page)}
              className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Events"
          value={stats?.total_events.toLocaleString() ?? 0}
          icon={Database}
          color="blue"
          subtitle="Login events collected"
        />
        <MetricCard
          label="Monitored Users"
          value={stats?.total_users ?? 0}
          icon={Users}
          color="slate"
          subtitle="Active accounts"
        />
        <MetricCard
          label="Anomalies Detected"
          value={stats?.anomaly_count ?? 0}
          icon={AlertTriangle}
          color="red"
          subtitle={`${anomalyRate.toFixed(1)}% of all events`}
        />
        <MetricCard
          label="Detection Rate"
          value={`${(100 - anomalyRate).toFixed(1)}%`}
          icon={CheckCircle}
          color="green"
          subtitle="Normal activity ratio"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Login Activity by Day of Week</h3>
              <p className="text-xs text-gray-500">Total events vs anomalous events</p>
            </div>
            <TrendingUp size={18} className="text-gray-400" />
          </div>
          <LineChart
            data={eventsByDay}
            height={260}
            color="#3b82f6"
            color2="#ef4444"
            yLabel="Number of events"
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Activity Distribution</h3>
          <DonutChart
            data={activityDistribution.map((d, i) => ({
              ...d,
              color: ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981'][i],
            }))}
            centerLabel="Events"
            centerValue={stats?.total_events.toLocaleString()}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Events per User</h3>
          <BarChart data={userActivity} height={260} />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Pipeline Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Data Collection', done: state.isGenerated, page: 'data-collection' as PageId },
              { label: 'Exploratory Analysis', done: state.events.length > 0, page: 'eda' as PageId },
              { label: 'Feature Engineering', done: state.features.length > 0, page: 'feature-engineering' as PageId },
              { label: 'Model Training', done: state.isTrained, page: 'model-training' as PageId },
              { label: 'Model Evaluation', done: state.modelResults.length > 0, page: 'model-evaluation' as PageId },
              { label: 'Anomaly Detection', done: state.anomalies.length > 0, page: 'anomaly-detection' as PageId },
              { label: 'Monitoring & Alerts', done: state.alerts.length > 0, page: 'monitoring' as PageId },
            ].map((step, i) => (
              <button
                key={i}
                onClick={() => onNavigate(step.page)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.done ? <CheckCircle size={14} /> : i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{step.label}</span>
                </div>
                <ArrowRight size={16} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
