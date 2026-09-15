import { useState, useEffect } from 'react';
import {
  ShieldCheck, Database, BarChart3, GitBranch, Brain,
  Target, Radar, Activity, AlertTriangle, Menu, X
} from 'lucide-react';
import type { PageId } from '@/lib/types';
import { getState, subscribe } from '@/lib/store';

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof ShieldCheck;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: ShieldCheck, description: 'System overview' },
  { id: 'data-collection', label: 'Data Collection', icon: Database, description: 'Dataset generation' },
  { id: 'eda', label: 'Exploratory Analysis', icon: BarChart3, description: 'Data exploration' },
  { id: 'feature-engineering', label: 'Feature Engineering', icon: GitBranch, description: 'Feature extraction' },
  { id: 'model-training', label: 'Model Training', icon: Brain, description: 'Train ML models' },
  { id: 'model-evaluation', label: 'Model Evaluation', icon: Target, description: 'Performance metrics' },
  { id: 'anomaly-detection', label: 'Anomaly Detection', icon: Radar, description: 'Real-time detection' },
  { id: 'monitoring', label: 'Monitoring', icon: Activity, description: 'Alerts & monitoring' },
];

interface LayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  children: React.ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsub = subscribe(() => {
      const s = getState();
      setAlertCount(s.alerts.filter(a => !a.acknowledged).length);
      setIsReady(s.isGenerated);
    });
    setAlertCount(getState().alerts.filter(a => !a.acknowledged).length);
    setIsReady(getState().isGenerated);
    return unsub;
  }, []);

  const currentNav = NAV_ITEMS.find(n => n.id === currentPage);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">AuthGuard ML</h1>
            <p className="text-[10px] text-slate-400">Anomaly Detection System</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_ITEMS.map(item => {
            const active = item.id === currentPage;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all text-left ${
                  active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-slate-500'} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.label}</div>
                  <div className={`text-[10px] ${active ? 'text-blue-200' : 'text-slate-600'} truncate`}>{item.description}</div>
                </div>
                {item.id === 'monitoring' && alertCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-400' : 'bg-amber-400'} animate-pulse`} />
            <span className="text-slate-400">{isReady ? 'System Active' : 'Awaiting Data'}</span>
          </div>
          <p className="text-[10px] text-slate-600 mt-1">CMU Insider Threat Dataset</p>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{currentNav?.label}</h2>
              <p className="text-xs text-gray-500">{currentNav?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {alertCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium">
                <AlertTriangle size={16} />
                {alertCount} Active Alert{alertCount > 1 ? 's' : ''}
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Live
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
