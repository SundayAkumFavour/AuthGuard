export interface LoginEvent {
  id: string;
  user_id: string;
  timestamp: string;
  day_of_week: number;
  hour_of_day: number;
  pc_id: string;
  ip_address: string;
  activity: string;
  is_off_hours: boolean;
  is_weekend: boolean;
  is_anomaly: boolean;
  anomaly_score: number;
  created_at: string;
}

export interface DetectedAnomaly {
  id: string;
  user_id: string;
  event_id: string;
  timestamp: string;
  anomaly_score: number;
  reason: string;
  features: Record<string, number | string | boolean>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigated' | 'resolved';
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  anomaly_id: string;
  timestamp: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  created_at: string;
}

export interface ModelMetric {
  id: string;
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  false_positives: number;
  false_negatives: number;
  true_positives: number;
  true_negatives: number;
  trained_at: string;
  created_at: string;
}

export interface UserBehaviorProfile {
  user_id: string;
  typical_hours: [number, number];
  typical_days: number[];
  typical_pcs: string[];
  typical_ips: string[];
  avg_sessions_per_day: number;
  total_events: number;
  anomaly_count: number;
}

export interface FeatureVector {
  user_id: string;
  hour_of_day: number;
  day_of_week: number;
  is_off_hours: number;
  is_weekend: number;
  pc_familiarity: number;
  ip_familiarity: number;
  hour_deviation: number;
  day_deviation: number;
  activity_frequency: number;
  is_anomaly: boolean;
}

export interface ModelResult {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  feature_importance: { feature: string; importance: number }[];
}

export type PageId =
  | 'dashboard'
  | 'data-collection'
  | 'eda'
  | 'feature-engineering'
  | 'model-training'
  | 'model-evaluation'
  | 'anomaly-detection'
  | 'monitoring';
