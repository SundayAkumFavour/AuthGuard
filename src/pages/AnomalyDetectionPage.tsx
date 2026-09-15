import { useEffect, useState, useRef } from 'react';
import { Radar, Play, Pause, Zap, AlertTriangle, CheckCircle, ArrowRight, Activity } from 'lucide-react';
import { MetricCard, BarChart } from '@/components/charts';
import { getState, subscribe, runAnomalyDetection, generateAlerts } from '@/lib/store';
import { generateSingleEvent } from '@/lib/dataGenerator';
import type { LoginEvent, PageId } from '@/lib/types';
import type { DetectionResult } from '@/lib/anomalyDetector';
import { detectAnomalies } from '@/lib/anomalyDetector';

interface AnomalyDetectionPageProps {
  onNavigate: (page: PageId) => void;
}

interface LiveEvent extends DetectionResult {
  event: LoginEvent;
}

export function AnomalyDetectionPage({ onNavigate }: AnomalyDetectionPageProps) {
  const [state, setLocalState] = useState(getState());
  const [isLive, setIsLive] = useState(false);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [batchResults, setBatchResults] = useState<DetectionResult[]>([]);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsub = subscribe(() => setLocalState(getState()));
    setLocalState(getState());
    return unsub;
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!state.isGenerated) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Radar size={48} className="mx-auto mb-4 opacity-50" />
        <p>Generate a dataset first to run anomaly detection.</p>
      </div>
    );
  }

  function handleBatchDetection() {
    setRunning(true);
    setTimeout(() => {
      const results = detectAnomalies(state.events, state.profiles);
      setBatchResults(results);
      runAnomalyDetection();
      generateAlerts();
      setRunning(false);
    }, 800);
  }

  function toggleLive() {
    if (isLive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsLive(false);
    } else {
      setIsLive(true);
      intervalRef.current = setInterval(() => {
        const evt = generateSingleEvent(state.profiles);
        const results = detectAnomalies([evt], state.profiles);
        setLiveEvents(prev => [results[0], ...prev].slice(0, 50));
      }, 1500);
    }
  }

  const anomalies = batchResults.filter(r => r.is_anomaly);
  const normal = batchResults.filter(r => !r.is_anomaly);
  const liveAnomalies = liveEvents.filter(e => e.is_anomaly);

  const severityData = ['low', 'medium', 'high', 'critical'].map(sev => ({
    label: sev.charAt(0).toUpperCase() + sev.slice(1),
    value: anomalies.filter(a => a.severity === sev).length,
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Anomaly Detection Engine</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              Run the trained detection model against all login events, or start live monitoring
              to detect anomalies in real-time as new login events stream in.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBatchDetection}
              disabled={running}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {running ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Run Batch Detection
                </>
              )}
            </button>
            <button
              onClick={toggleLive}
              className={`flex items-center gap-2 font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors whitespace-nowrap ${
                isLive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isLive ? <Pause size={18} /> : <Play size={18} />}
              {isLive ? 'Stop Live' : 'Start Live'}
            </button>
          </div>
        </div>
      </div>

      {isLive && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-800">Live monitoring active — analyzing new login events every 1.5 seconds</span>
          <span className="ml-auto text-sm text-green-600 font-mono">{liveEvents.length} events processed</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Events Analyzed"
          value={batchResults.length.toLocaleString()}
          icon={Activity}
          color="blue"
        />
        <MetricCard
          label="Anomalies Found"
          value={anomalies.length}
          icon={AlertTriangle}
          color="red"
        />
        <MetricCard
          label="Normal Events"
          value={normal.length.toLocaleString()}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          label="Detection Rate"
          value={batchResults.length > 0 ? `${((anomalies.length / batchResults.length) * 100).toFixed(1)}%` : '—'}
          icon={Radar}
          color="amber"
        />
      </div>

      {anomalies.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Anomalies by Severity</h3>
          <BarChart data={severityData} height={220} />
        </div>
      )}

      {liveEvents.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Live Event Stream</h3>
              {isLive && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            </div>
            <span className="text-xs text-gray-400">{liveAnomalies.length} anomalies in stream</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {liveEvents.map((evt, i) => (
              <div
                key={i}
                className={`px-6 py-3 border-b border-gray-50 flex items-center gap-4 ${
                  evt.is_anomaly ? 'bg-red-50/50' : ''
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  evt.is_anomaly ? 'bg-red-500' : 'bg-green-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-gray-800">{evt.event.user_id}</span>
                    <span className="text-xs text-gray-400">{new Date(evt.event.timestamp).toLocaleTimeString()}</span>
                    <span className="text-xs text-gray-400">{evt.event.activity}</span>
                  </div>
                  {evt.is_anomaly && evt.reasons.length > 0 && (
                    <p className="text-xs text-red-600 mt-1 truncate">{evt.reasons.join(' • ')}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-400 font-mono">{evt.event.pc_id}</span>
                  <span className="text-xs text-gray-400 font-mono">{evt.event.ip_address}</span>
                  <div className="w-16 text-right">
                    <div className={`text-sm font-bold ${
                      evt.score >= 0.8 ? 'text-red-600' :
                      evt.score >= 0.6 ? 'text-orange-600' :
                      evt.score >= 0.4 ? 'text-amber-600' : 'text-gray-400'
                    }`}>
                      {(evt.score * 100).toFixed(0)}
                    </div>
                    <div className="text-[10px] text-gray-400">score</div>
                  </div>
                  {evt.is_anomaly && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      evt.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      evt.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      evt.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {evt.severity.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {batchResults.length > 0 && anomalies.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Top Detected Anomalies</h3>
            <p className="text-xs text-gray-500 mt-0.5">Highest-scoring anomalous events from batch detection</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {anomalies.sort((a, b) => b.score - a.score).slice(0, 20).map((a, i) => (
              <div key={i} className="px-6 py-3 border-b border-gray-50 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <span className={`w-2 h-2 rounded-full ${
                      a.severity === 'critical' ? 'bg-red-500' :
                      a.severity === 'high' ? 'bg-orange-500' :
                      a.severity === 'medium' ? 'bg-amber-500' : 'bg-gray-400'
                    }`} />
                    <span className="font-mono text-sm font-medium text-gray-800">{a.event.user_id}</span>
                    <span className="text-xs text-gray-400">{new Date(a.event.timestamp).toLocaleString()}</span>
                  </div>
                  <span className="text-xs text-gray-500 flex-1 truncate">{a.reasons.join(' • ')}</span>
                  <div className="w-20 text-right">
                    <span className={`text-sm font-bold ${
                      a.score >= 0.8 ? 'text-red-600' :
                      a.score >= 0.6 ? 'text-orange-600' : 'text-amber-600'
                    }`}>
                      {(a.score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {batchResults.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => onNavigate('monitoring')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            View Monitoring Dashboard
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
