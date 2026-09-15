import { supabase } from './supabase';
import { generateLoginEvents } from './dataGenerator';
import { engineerFeatures } from './featureEngineering';
import { detectAnomalies, trainModels } from './anomalyDetector';
import type { LoginEvent, FeatureVector, ModelResult, DetectedAnomaly, Alert } from './types';
import type { UserProfile, GeneratedData } from './dataGenerator';

export interface AppState {
  events: LoginEvent[];
  profiles: UserProfile[];
  features: FeatureVector[];
  modelResults: ModelResult[];
  anomalies: DetectedAnomaly[];
  alerts: Alert[];
  isGenerated: boolean;
  isTrained: boolean;
  stats: GeneratedData['stats'] | null;
}

let state: AppState = {
  events: [],
  profiles: [],
  features: [],
  modelResults: [],
  anomalies: [],
  alerts: [],
  isGenerated: false,
  isTrained: false,
  stats: null,
};

const listeners = new Set<() => void>();

export function getState(): AppState {
  return state;
}

export function setState(updates: Partial<AppState>) {
  state = { ...state, ...updates };
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function generateAndStoreData(): Promise<void> {
  const data = generateLoginEvents(30);

  const rows = data.events.map(evt => ({
    user_id: evt.user_id,
    timestamp: evt.timestamp,
    day_of_week: evt.day_of_week,
    hour_of_day: evt.hour_of_day,
    pc_id: evt.pc_id,
    ip_address: evt.ip_address,
    activity: evt.activity,
    is_off_hours: evt.is_off_hours,
    is_weekend: evt.is_weekend,
    is_anomaly: evt.is_anomaly,
    anomaly_score: evt.anomaly_score,
  }));

  const batchSize = 500;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await supabase.from('login_events').insert(batch);
  }

  setState({
    events: data.events,
    profiles: data.profiles,
    isGenerated: true,
    stats: data.stats,
  });
}

export async function loadDataFromDB(): Promise<void> {
  const { data, error } = await supabase
    .from('login_events')
    .select('*')
    .order('timestamp', { ascending: true })
    .limit(5000);

  if (error || !data || data.length === 0) return;

  const events: LoginEvent[] = data.map(d => ({
    id: d.id,
    user_id: d.user_id,
    timestamp: d.timestamp,
    day_of_week: d.day_of_week,
    hour_of_day: d.hour_of_day,
    pc_id: d.pc_id,
    ip_address: d.ip_address,
    activity: d.activity,
    is_off_hours: d.is_off_hours,
    is_weekend: d.is_weekend,
    is_anomaly: d.is_anomaly,
    anomaly_score: d.anomaly_score ?? 0,
    created_at: d.created_at,
  }));

  const profiles = buildProfilesFromEvents(events);

  setState({
    events,
    profiles,
    isGenerated: true,
    stats: {
      total_events: events.length,
      total_users: new Set(events.map(e => e.user_id)).size,
      anomaly_count: events.filter(e => e.is_anomaly).length,
      normal_count: events.filter(e => !e.is_anomaly).length,
      date_range: [events[0].timestamp, events[events.length - 1].timestamp],
    },
  });
}

function buildProfilesFromEvents(events: LoginEvent[]): UserProfile[] {
  const userMap = new Map<string, LoginEvent[]>();
  for (const evt of events) {
    if (!userMap.has(evt.user_id)) userMap.set(evt.user_id, []);
    userMap.get(evt.user_id)!.push(evt);
  }

  const profiles: UserProfile[] = [];
  for (const [userId, userEvents] of userMap) {
    const hours = userEvents.map(e => e.hour_of_day);
    const mean = hours.reduce((a, b) => a + b, 0) / hours.length;
    const variance = hours.reduce((a, b) => a + (b - mean) ** 2, 0) / hours.length;
    const std = Math.sqrt(variance) || 1.5;
    const days = [...new Set(userEvents.map(e => e.day_of_week))];
    const pcs = [...new Set(userEvents.map(e => e.pc_id))];
    const ips = [...new Set(userEvents.map(e => e.ip_address))];

    profiles.push({
      user_id: userId,
      typical_hour: Math.round(mean),
      typical_std: std,
      typical_days: days,
      typical_pcs: pcs,
      typical_ip: ips[0] || '10.0.0.1',
      sessions_per_day: Math.round(userEvents.length / 30),
    });
  }
  return profiles;
}

export function computeFeatures(): void {
  if (state.events.length === 0) return;
  const features = engineerFeatures(state.events, state.profiles);
  setState({ features });
}

export function runTraining(): ModelResult[] {
  if (state.features.length === 0) {
    computeFeatures();
  }
  const features = getState().features;
  if (features.length === 0) return [];

  const results = trainModels(features);
  setState({ modelResults: results, isTrained: true });

  for (const result of results) {
    supabase.from('model_metrics').insert({
      model_name: result.model_name,
      accuracy: result.accuracy,
      precision: result.precision,
      recall: result.recall,
      f1_score: result.f1_score,
      roc_auc: result.roc_auc,
      false_positives: result.confusion_matrix.fp,
      false_negatives: result.confusion_matrix.fn,
      true_positives: result.confusion_matrix.tp,
      true_negatives: result.confusion_matrix.tn,
      trained_at: new Date().toISOString(),
    }).then();
  }

  return results;
}

export function runAnomalyDetection(): DetectedAnomaly[] {
  if (state.events.length === 0) return [];
  const results = detectAnomalies(state.events, state.profiles);
  const anomalies: DetectedAnomaly[] = results
    .filter(r => r.is_anomaly)
    .map(r => ({
      id: `anom-${r.event.id}`,
      user_id: r.event.user_id,
      event_id: r.event.id,
      timestamp: r.event.timestamp,
      anomaly_score: r.score,
      reason: r.reasons.join('; '),
      features: {
        hour_of_day: r.event.hour_of_day,
        day_of_week: r.event.day_of_week,
        pc_id: r.event.pc_id,
        ip_address: r.event.ip_address,
        is_off_hours: r.event.is_off_hours,
        is_weekend: r.event.is_weekend,
      },
      severity: r.severity,
      status: 'open' as const,
      created_at: new Date().toISOString(),
    }));

  setState({ anomalies });
  return anomalies;
}

export function generateAlerts(): Alert[] {
  const alerts: Alert[] = state.anomalies.map(a => ({
    id: `alert-${a.id}`,
    user_id: a.user_id,
    anomaly_id: a.id,
    timestamp: a.timestamp,
    message: `Anomaly detected for ${a.user_id}: ${a.reason}`,
    severity: a.severity,
    acknowledged: false,
    created_at: new Date().toISOString(),
  }));

  setState({ alerts });
  return alerts;
}

export function acknowledgeAlert(alertId: string): void {
  const alerts = state.alerts.map(a =>
    a.id === alertId ? { ...a, acknowledged: true } : a
  );
  setState({ alerts });
}
