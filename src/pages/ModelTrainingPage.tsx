import { useEffect, useState } from 'react';
import { Brain, Cpu, Play, CheckCircle, ArrowRight, Layers } from 'lucide-react';
import { MetricCard, BarChart } from '@/components/charts';
import { getState, subscribe, computeFeatures, runTraining } from '@/lib/store';
import type { ModelResult, PageId } from '@/lib/types';

interface ModelTrainingPageProps {
  onNavigate: (page: PageId) => void;
}

const MODEL_DESCRIPTIONS = [
  { name: 'Isolation Forest', desc: 'Tree-based ensemble that isolates anomalies through random partitioning', icon: Layers },
  { name: 'One-Class SVM', desc: 'Support Vector Machine that learns the boundary of normal behavior', icon: Cpu },
  { name: 'Local Outlier Factor', desc: 'Density-based method comparing local reachability of neighbors', icon: Layers },
  { name: 'Autoencoder', desc: 'Neural network that reconstructs input; high reconstruction error = anomaly', icon: Brain },
  { name: 'Robust Z-Score', desc: 'Statistical method using median and MAD for robust outlier detection', icon: Cpu },
];

export function ModelTrainingPage({ onNavigate }: ModelTrainingPageProps) {
  const [state, setLocalState] = useState(getState());
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trainedModels, setTrainedModels] = useState<ModelResult[]>([]);

  useEffect(() => {
    const unsub = subscribe(() => setLocalState(getState()));
    setLocalState(getState());
    return unsub;
  }, []);

  if (!state.isGenerated) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Brain size={48} className="mx-auto mb-4 opacity-50" />
        <p>Generate a dataset first to train models.</p>
      </div>
    );
  }

  async function handleTrain() {
    setTraining(true);
    setProgress(0);

    if (state.features.length === 0) {
      computeFeatures();
      await new Promise(r => setTimeout(r, 300));
    }

    const steps = [
      'Preparing feature vectors...',
      'Training Isolation Forest...',
      'Training One-Class SVM...',
      'Training Local Outlier Factor...',
      'Training Autoencoder...',
      'Training Robust Z-Score...',
      'Evaluating models...',
      'Computing metrics...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setProgress(((i + 1) / steps.length) * 100);
      await new Promise(r => setTimeout(r, 250));
    }

    const results = runTraining();
    setTrainedModels(results);
    setTraining(false);
  }

  const bestModel = trainedModels.length > 0
    ? trainedModels.reduce((best, m) => m.f1_score > best.f1_score ? m : best)
    : null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Model Training Pipeline</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              Train multiple unsupervised anomaly detection algorithms on the engineered features.
              Each model learns normal user behavior patterns and flags deviations as anomalies.
            </p>
          </div>
          <button
            onClick={handleTrain}
            disabled={training}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {training ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Training...
              </>
            ) : (
              <>
                <Play size={18} />
                {trainedModels.length > 0 ? 'Retrain Models' : 'Start Training'}
              </>
            )}
          </button>
        </div>

        {training && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Training in progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODEL_DESCRIPTIONS.map((m, i) => {
          const result = trainedModels.find(r => r.model_name === m.name);
          const Icon = m.icon;
          return (
            <div
              key={i}
              className={`rounded-xl border p-5 transition-all ${
                result
                  ? 'border-green-200 bg-green-50/50'
                  : 'border-gray-200 bg-white'
              } ${training ? 'animate-pulse' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  result ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon size={20} />
                </div>
                {result && <CheckCircle size={20} className="text-green-500" />}
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{m.name}</h4>
              <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
              {result && (
                <div className="mt-3 pt-3 border-t border-green-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">F1:</span>
                    <span className="font-bold text-gray-900 ml-1">{(result.f1_score * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">AUC:</span>
                    <span className="font-bold text-gray-900 ml-1">{(result.roc_auc * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {trainedModels.length > 0 && bestModel && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Best Model" value={bestModel.model_name} icon={Brain} color="blue" subtitle={`F1: ${(bestModel.f1_score * 100).toFixed(1)}%`} />
            <MetricCard label="Best Accuracy" value={`${(bestModel.accuracy * 100).toFixed(1)}%`} icon={CheckCircle} color="green" />
            <MetricCard label="Best Recall" value={`${(bestModel.recall * 100).toFixed(1)}%`} icon={CheckCircle} color="amber" />
            <MetricCard label="Models Trained" value={trainedModels.length} icon={Layers} color="slate" />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Model Comparison: F1 Scores</h3>
            <BarChart
              data={trainedModels.map(m => ({
                label: m.model_name.split(' ').map(w => w.slice(0, 4)).join(' '),
                value: m.f1_score * 100,
                color: m === bestModel ? 'blue' : 'slate',
              }))}
              height={260}
              yLabel="F1 Score (%)"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onNavigate('model-evaluation')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              View Detailed Evaluation
              <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
