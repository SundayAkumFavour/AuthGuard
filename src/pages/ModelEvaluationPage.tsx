import { useEffect, useState } from 'react';
import { Target, TrendingUp, ArrowRight } from 'lucide-react';
import { MetricCard, BarChart, ConfusionMatrix, RadarChart, GaugeChart } from '@/components/charts';
import { getState, subscribe } from '@/lib/store';
import type { ModelResult, PageId } from '@/lib/types';

interface ModelEvaluationPageProps {
  onNavigate: (page: PageId) => void;
}

export function ModelEvaluationPage({ onNavigate }: ModelEvaluationPageProps) {
  const [state, setLocalState] = useState(getState());
  const [selectedModel, setSelectedModel] = useState(0);

  useEffect(() => {
    const unsub = subscribe(() => setLocalState(getState()));
    setLocalState(getState());
    return unsub;
  }, []);

  if (state.modelResults.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Target size={48} className="mx-auto mb-4 opacity-50" />
        <p>Train models first to view evaluation metrics.</p>
      </div>
    );
  }

  const models = state.modelResults;
  const model = models[selectedModel];

  const comparisonData = ['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc'] as const;
  const metricLabels: Record<string, string> = {
    accuracy: 'Accuracy',
    precision: 'Precision',
    recall: 'Recall',
    f1_score: 'F1 Score',
    roc_auc: 'ROC-AUC',
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Select Model to Evaluate</h3>
        <div className="flex flex-wrap gap-2">
          {models.map((m, i) => (
            <button
              key={i}
              onClick={() => setSelectedModel(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedModel === i
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m.model_name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Accuracy" value={`${(model.accuracy * 100).toFixed(1)}%`} icon={Target} color="blue" />
        <MetricCard label="Precision" value={`${(model.precision * 100).toFixed(1)}%`} icon={Target} color="green" />
        <MetricCard label="Recall" value={`${(model.recall * 100).toFixed(1)}%`} icon={Target} color="amber" />
        <MetricCard label="F1 Score" value={`${(model.f1_score * 100).toFixed(1)}%`} icon={Target} color="slate" />
        <MetricCard label="ROC-AUC" value={`${(model.roc_auc * 100).toFixed(1)}%`} icon={Target} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">Confusion Matrix</h3>
          <div className="flex justify-center">
            <ConfusionMatrix
              tp={model.confusion_matrix.tp}
              fp={model.confusion_matrix.fp}
              tn={model.confusion_matrix.tn}
              fn={model.confusion_matrix.fn}
            />
          </div>
        </div>

        <div className="lg:col-span-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">Performance Gauges</h3>
          <div className="grid grid-cols-2 gap-4">
            <GaugeChart value={model.accuracy} label="Accuracy" color="#3b82f6" />
            <GaugeChart value={model.precision} label="Precision" color="#10b981" />
            <GaugeChart value={model.recall} label="Recall" color="#f59e0b" />
            <GaugeChart value={model.f1_score} label="F1 Score" color="#6366f1" />
          </div>
        </div>

        <div className="lg:col-span-1 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">Metric Profile</h3>
          <RadarChart
            data={[
              { label: 'Acc', value: model.accuracy, max: 1 },
              { label: 'Prec', value: model.precision, max: 1 },
              { label: 'Rec', value: model.recall, max: 1 },
              { label: 'F1', value: model.f1_score, max: 1 },
              { label: 'AUC', value: model.roc_auc, max: 1 },
            ]}
            size={220}
            color="#3b82f6"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-1">Feature Importance</h3>
        <p className="text-xs text-gray-500 mb-4">Relative contribution of each feature to anomaly detection</p>
        <BarChart
          data={model.feature_importance.map(f => ({
            label: f.feature,
            value: f.importance * 100,
          }))}
          height={240}
          yLabel="Importance (%)"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-gray-400" />
          <h3 className="font-semibold text-gray-900">Cross-Model Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="text-left px-4 py-2.5 font-medium">Model</th>
                {comparisonData.map(m => (
                  <th key={m} className="text-right px-4 py-2.5 font-medium">{metricLabels[m]}</th>
                ))}
                <th className="text-right px-4 py-2.5 font-medium">TP</th>
                <th className="text-right px-4 py-2.5 font-medium">FP</th>
                <th className="text-right px-4 py-2.5 font-medium">FN</th>
                <th className="text-right px-4 py-2.5 font-medium">TN</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m, i) => (
                <tr
                  key={i}
                  className={`border-t border-gray-50 ${i === selectedModel ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-2.5 font-medium text-gray-800">{m.model_name}</td>
                  {comparisonData.map(metric => (
                    <td key={metric} className="px-4 py-2.5 text-right text-gray-600">
                      {(m[metric] * 100).toFixed(1)}%
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right text-green-600 font-medium">{m.confusion_matrix.tp}</td>
                  <td className="px-4 py-2.5 text-right text-amber-600 font-medium">{m.confusion_matrix.fp}</td>
                  <td className="px-4 py-2.5 text-right text-red-600 font-medium">{m.confusion_matrix.fn}</td>
                  <td className="px-4 py-2.5 text-right text-green-600 font-medium">{m.confusion_matrix.tn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onNavigate('anomaly-detection')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          Deploy to Anomaly Detection
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
