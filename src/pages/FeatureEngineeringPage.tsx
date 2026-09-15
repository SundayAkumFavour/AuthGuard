import { useEffect, useState } from 'react';
import { GitBranch, Cpu, Zap, ArrowRight } from 'lucide-react';
import { BarChart, RadarChart } from '@/components/charts';
import { MetricCard } from '@/components/charts';
import { getState, subscribe, computeFeatures } from '@/lib/store';
import { getFeatureDescriptions } from '@/lib/featureEngineering';
import type { PageId } from '@/lib/types';

interface FeatureEngineeringPageProps {
  onNavigate: (page: PageId) => void;
}

export function FeatureEngineeringPage({ onNavigate }: FeatureEngineeringPageProps) {
  const [state, setLocalState] = useState(getState());
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    const unsub = subscribe(() => setLocalState(getState()));
    setLocalState(getState());
    return unsub;
  }, []);

  if (!state.isGenerated) {
    return (
      <div className="text-center py-20 text-gray-400">
        <GitBranch size={48} className="mx-auto mb-4 opacity-50" />
        <p>Generate a dataset first to engineer features.</p>
      </div>
    );
  }

  function handleCompute() {
    setComputing(true);
    setTimeout(() => {
      computeFeatures();
      setComputing(false);
    }, 600);
  }

  const features = state.features;
  const descriptions = getFeatureDescriptions();

  const featureStats = features.length > 0
    ? [
        { label: 'Hour Deviation', value: features.reduce((a, f) => a + f.hour_deviation, 0) / features.length, max: 5 },
        { label: 'PC Familiarity', value: features.reduce((a, f) => a + f.pc_familiarity, 0) / features.length, max: 1 },
        { label: 'IP Familiarity', value: features.reduce((a, f) => a + f.ip_familiarity, 0) / features.length, max: 1 },
        { label: 'Off-Hours', value: features.filter(f => f.is_off_hours === 1).length / features.length, max: 1 },
        { label: 'Weekend', value: features.filter(f => f.is_weekend === 1).length / features.length, max: 1 },
        { label: 'Day Deviation', value: features.filter(f => f.day_deviation === 1).length / features.length, max: 1 },
      ]
    : [];

  const featureImportancePreview = [
    { label: 'hour_dev', value: 0.28, max: 0.3 },
    { label: 'pc_fam', value: 0.22, max: 0.3 },
    { label: 'ip_fam', value: 0.18, max: 0.3 },
    { label: 'off_hrs', value: 0.12, max: 0.3 },
    { label: 'day_dev', value: 0.10, max: 0.3 },
    { label: 'weekend', value: 0.06, max: 0.3 },
  ];

  const sampleFeatures = features.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Feature Engineering Pipeline</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              Transform raw login events into numerical feature vectors that capture behavioral patterns.
              Each feature measures a specific aspect of user behavior deviation from their established baseline.
            </p>
          </div>
          <button
            onClick={handleCompute}
            disabled={computing || features.length > 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {computing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Computing...
              </>
            ) : features.length > 0 ? (
              <>
                <Cpu size={18} />
                Features Computed
              </>
            ) : (
              <>
                <Zap size={18} />
                Compute Features
              </>
            )}
          </button>
        </div>
      </div>

      {features.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Feature Vectors" value={features.length.toLocaleString()} icon={GitBranch} color="blue" />
            <MetricCard label="Features per Vector" value={9} icon={Cpu} color="slate" />
            <MetricCard label="Anomalous Vectors" value={features.filter(f => f.is_anomaly).length} icon={Zap} color="red" />
            <MetricCard label="Normal Vectors" value={features.filter(f => !f.is_anomaly).length.toLocaleString()} icon={Cpu} color="green" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Feature Descriptions</h3>
              <div className="space-y-2.5">
                {descriptions.map((d, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50">
                    <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <code className="text-sm font-mono text-gray-800 font-medium">{d.feature}</code>
                      <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Average Feature Profile</h3>
              <RadarChart data={featureStats} size={240} color="#3b82f6" />
              <p className="text-xs text-gray-400 text-center mt-2">
                Normalized averages across all feature vectors
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Estimated Feature Importance</h3>
            <BarChart
              data={featureImportancePreview.map(f => ({ label: f.label, value: f.value }))}
              height={240}
              yLabel="Importance score"
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Sample Feature Vectors</h3>
              <p className="text-xs text-gray-500 mt-0.5">First 10 computed feature vectors</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="text-left px-3 py-2 font-medium">User</th>
                    <th className="text-right px-3 py-2 font-medium">Hour</th>
                    <th className="text-right px-3 py-2 font-medium">Day</th>
                    <th className="text-right px-3 py-2 font-medium">Off-Hrs</th>
                    <th className="text-right px-3 py-2 font-medium">Weekend</th>
                    <th className="text-right px-3 py-2 font-medium">PC-Fam</th>
                    <th className="text-right px-3 py-2 font-medium">IP-Fam</th>
                    <th className="text-right px-3 py-2 font-medium">Hr-Dev</th>
                    <th className="text-right px-3 py-2 font-medium">Day-Dev</th>
                    <th className="text-center px-3 py-2 font-medium">Anomaly</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleFeatures.map((f, i) => (
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-gray-700">{f.user_id}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{f.hour_of_day}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{f.day_of_week}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{f.is_off_hours}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{f.is_weekend}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{f.pc_familiarity.toFixed(3)}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{f.ip_familiarity.toFixed(3)}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{f.hour_deviation.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{f.day_deviation}</td>
                      <td className="px-3 py-2 text-center">
                        {f.is_anomaly ? (
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

          <div className="flex justify-end">
            <button
              onClick={() => onNavigate('model-training')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              Continue to Model Training
              <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
