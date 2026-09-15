import type { LoginEvent } from './types';

const USERS = ['USR0001', 'USR0002', 'USR0003', 'USR0004', 'USR0005',
  'USR0006', 'USR0007', 'USR0008', 'USR0009', 'USR0010',
  'USR0011', 'USR0012', 'USR0013', 'USR0014', 'USR0015'];

const PCS = ['PC-001', 'PC-002', 'PC-003', 'PC-004', 'PC-005',
  'PC-006', 'PC-007', 'PC-008', 'PC-009', 'PC-010'];

const ACTIVITIES = ['Logon', 'Logoff', 'HTTP', 'File', 'Email'];

function randomIP(): string {
  return `${10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function gaussian(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

interface UserProfile {
  user_id: string;
  typical_hour: number;
  typical_std: number;
  typical_days: number[];
  typical_pcs: string[];
  typical_ip: string;
  sessions_per_day: number;
}

function buildProfiles(): UserProfile[] {
  return USERS.map((userId, i) => {
    const typicalHour = 8 + Math.floor(Math.random() * 3);
    const typicalStd = 1.5 + Math.random();
    const days: number[] = [1, 2, 3, 4, 5];
    if (Math.random() > 0.7) days.push(6);
    if (Math.random() > 0.9) days.push(0);
    const numPcs = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...PCS].sort(() => Math.random() - 0.5);
    const typicalPcs = shuffled.slice(0, numPcs);
    return {
      user_id: userId,
      typical_hour: typicalHour,
      typical_std: typicalStd,
      typical_days: days,
      typical_pcs: typicalPcs,
      typical_ip: randomIP(),
      sessions_per_day: 2 + Math.floor(Math.random() * 6),
    };
  });
}

export interface GeneratedData {
  events: LoginEvent[];
  profiles: UserProfile[];
  stats: {
    total_events: number;
    total_users: number;
    anomaly_count: number;
    normal_count: number;
    date_range: [string, string];
  };
}

export function generateLoginEvents(numDays = 30): GeneratedData {
  const profiles = buildProfiles();
  const events: LoginEvent[] = [];
  const now = new Date('2026-08-15T00:00:00Z');
  let eventCounter = 0;

  for (let day = 0; day < numDays; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (numDays - day));
    const dow = date.getDay();

    for (const profile of profiles) {
      const isTypicalDay = profile.typical_days.includes(dow);
      if (!isTypicalDay && Math.random() > 0.15) continue;

      const numSessions = Math.max(1, Math.round(gaussian(profile.sessions_per_day, 1)));

      for (let s = 0; s < numSessions; s++) {
        const hour = clamp(Math.round(gaussian(profile.typical_hour, profile.typical_std)), 0, 23);
        const minute = Math.floor(Math.random() * 60);
        const ts = new Date(date);
        ts.setHours(hour, minute, Math.floor(Math.random() * 60));

        const isWeekend = dow === 0 || dow === 6;
        const isOffHours = hour < 7 || hour > 19;

        const pc = profile.typical_pcs[Math.floor(Math.random() * profile.typical_pcs.length)];
        const activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];

        events.push({
          id: `evt-${eventCounter++}`,
          user_id: profile.user_id,
          timestamp: ts.toISOString(),
          day_of_week: dow,
          hour_of_day: hour,
          pc_id: pc,
          ip_address: profile.typical_ip,
          activity,
          is_off_hours: isOffHours,
          is_weekend: isWeekend,
          is_anomaly: false,
          anomaly_score: 0,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  const anomalyFraction = 0.05;
  const numAnomalies = Math.floor(events.length * anomalyFraction);
  const indices = [...Array(events.length).keys()].sort(() => Math.random() - 0.5).slice(0, numAnomalies);

  for (const idx of indices) {
    const evt = events[idx];
    const attackType = Math.floor(Math.random() * 4);

    switch (attackType) {
      case 0: {
        evt.hour_of_day = Math.random() > 0.5
          ? Math.floor(Math.random() * 4)
          : 22 + Math.floor(Math.random() * 2);
        evt.is_off_hours = true;
        const ts = new Date(evt.timestamp);
        ts.setHours(evt.hour_of_day, Math.floor(Math.random() * 60));
        evt.timestamp = ts.toISOString();
        break;
      }
      case 1: {
        const newPcs = PCS.filter(p => !profiles.find(p2 => p2.user_id === evt.user_id)?.typical_pcs.includes(p));
        if (newPcs.length > 0) {
          evt.pc_id = newPcs[Math.floor(Math.random() * newPcs.length)];
        }
        break;
      }
      case 2: {
        evt.ip_address = randomIP();
        break;
      }
      case 3: {
        evt.is_weekend = true;
        const ts = new Date(evt.timestamp);
        ts.setDate(ts.getDate() + (6 - ts.getDay()));
        evt.timestamp = ts.toISOString();
        evt.day_of_week = ts.getDay();
        break;
      }
    }

    evt.is_anomaly = true;
    evt.anomaly_score = 0.7 + Math.random() * 0.3;
  }

  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const anomalyCount = events.filter(e => e.is_anomaly).length;
  const timestamps = events.map(e => e.timestamp).sort();

  return {
    events,
    profiles,
    stats: {
      total_events: events.length,
      total_users: USERS.length,
      anomaly_count: anomalyCount,
      normal_count: events.length - anomalyCount,
      date_range: [timestamps[0], timestamps[timestamps.length - 1]],
    },
  };
}

export function generateSingleEvent(profiles: UserProfile[]): LoginEvent {
  const profile = profiles[Math.floor(Math.random() * profiles.length)];
  const now = new Date();
  const dow = now.getDay();
  const hour = now.getHours();
  const isWeekend = dow === 0 || dow === 6;
  const isOffHours = hour < 7 || hour > 19;

  const isAnomaly = Math.random() < 0.15;

  let pcId = profile.typical_pcs[Math.floor(Math.random() * profile.typical_pcs.length)];
  let ipAddress = profile.typical_ip;
  let eventHour = hour;

  if (isAnomaly) {
    const attackType = Math.floor(Math.random() * 3);
    if (attackType === 0) {
      eventHour = Math.random() > 0.5 ? Math.floor(Math.random() * 4) : 22 + Math.floor(Math.random() * 2);
    } else if (attackType === 1) {
      const newPcs = PCS.filter(p => !profile.typical_pcs.includes(p));
      if (newPcs.length > 0) pcId = newPcs[Math.floor(Math.random() * newPcs.length)];
    } else {
      ipAddress = randomIP();
    }
  }

  return {
    id: `evt-live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: profile.user_id,
    timestamp: now.toISOString(),
    day_of_week: dow,
    hour_of_day: eventHour,
    pc_id: pcId,
    ip_address: ipAddress,
    activity: ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)],
    is_off_hours: isOffHours,
    is_weekend: isWeekend,
    is_anomaly: isAnomaly,
    anomaly_score: isAnomaly ? 0.7 + Math.random() * 0.3 : 0,
    created_at: now.toISOString(),
  };
}

export { USERS, PCS, ACTIVITIES };
export type { UserProfile };
