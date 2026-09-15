import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { DataCollectionPage } from '@/pages/DataCollectionPage';
import { EDAPage } from '@/pages/EDAPage';
import { FeatureEngineeringPage } from '@/pages/FeatureEngineeringPage';
import { ModelTrainingPage } from '@/pages/ModelTrainingPage';
import { ModelEvaluationPage } from '@/pages/ModelEvaluationPage';
import { AnomalyDetectionPage } from '@/pages/AnomalyDetectionPage';
import { MonitoringPage } from '@/pages/MonitoringPage';
import type { PageId } from '@/lib/types';

function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />;
      case 'data-collection':
        return <DataCollectionPage />;
      case 'eda':
        return <EDAPage />;
      case 'feature-engineering':
        return <FeatureEngineeringPage onNavigate={setCurrentPage} />;
      case 'model-training':
        return <ModelTrainingPage onNavigate={setCurrentPage} />;
      case 'model-evaluation':
        return <ModelEvaluationPage onNavigate={setCurrentPage} />;
      case 'anomaly-detection':
        return <AnomalyDetectionPage onNavigate={setCurrentPage} />;
      case 'monitoring':
        return <MonitoringPage />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  }

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
