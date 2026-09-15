import type { LoginEvent, FeatureVector } from './types';
import type { UserProfile } from './dataGenerator';

export function engineerFeatures(events: LoginEvent[], profiles: UserProfile[]): FeatureVector[] {
  const userStats = new Map<string, { hours: number[]; days: Set<number>; pcs: Set<string>; ips: Set<string> }>();

  for (const evt of events) {
    if (!userStats.has(evt.user_id)) {
      userStats.set(evt.user_id, { hours: [], days: new Set(), pcs: new Set(), ips: new Set() });
    }
    const stats = userStats.get(evt.user_id)!;
    stats.hours.push(evt.hour_of_day);
    stats.days.add(evt.day_of_week);
    stats.pcs.add(evt.pc_id);
    stats.ips.add(evt.ip_address);
  }

  const userHourMean = new Map<string, number>();
  const userHourStd = new Map<string, number>();
  const userPcFreq = new Map<string, Map<string, number>>();
  const userIpFreq = new Map<string, Map<string, number>>();
  const userDaySet = new Map<string, Set<number>>();

  for (const [userId, stats] of userStats) {
    const mean = stats.hours.reduce((a, b) => a + b, 0) / stats.hours.length;
    const variance = stats.hours.reduce((a, b) => a + (b - mean) ** 2, 0) / stats.hours.length;
    userHourMean.set(userId, mean);
    userHourStd.set(userId, Math.sqrt(variance) || 1);

    const pcFreq = new Map<string, number>();
    const ipFreq = new Map<string, number>();
    for (const evt of events.filter(e => e.user_id === userId)) {
      pcFreq.set(evt.pc_id, (pcFreq.get(evt.pc_id) || 0) + 1);
      ipFreq.set(evt.ip_address, (ipFreq.get(evt.ip_address) || 0) + 1);
    }
    userPcFreq.set(userId, pcFreq);
    userIpFreq.set(userId, ipFreq);
    userDaySet.set(userId, stats.days);
  }

  const userEventCount = new Map<string, number>();
  for (const evt of events) {
    userEventCount.set(evt.user_id, (userEventCount.get(evt.user_id) || 0) + 1);
  }

  return events.map(evt => {
    const hourMean = userHourMean.get(evt.user_id) ?? 9;
    const hourStd = userHourStd.get(evt.user_id) ?? 2;
    const pcFreq = userPcFreq.get(evt.user_id);
    const ipFreq = userIpFreq.get(evt.user_id);
    const totalForUser = userEventCount.get(evt.user_id) ?? 1;
    const days = userDaySet.get(evt.user_id) ?? new Set();

    const pcCount = pcFreq?.get(evt.pc_id) ?? 0;
    const ipCount = ipFreq?.get(evt.ip_address) ?? 0;

    return {
      user_id: evt.user_id,
      hour_of_day: evt.hour_of_day,
      day_of_week: evt.day_of_week,
      is_off_hours: evt.is_off_hours ? 1 : 0,
      is_weekend: evt.is_weekend ? 1 : 0,
      pc_familiarity: pcCount / totalForUser,
      ip_familiarity: ipCount / totalForUser,
      hour_deviation: Math.abs(evt.hour_of_day - hourMean) / (hourStd || 1),
      day_deviation: days.has(evt.day_of_week) ? 0 : 1,
      activity_frequency: totalForUser,
      is_anomaly: evt.is_anomaly,
    };
  });
}

export function getFeatureDescriptions(): { feature: string; description: string }[] {
  return [
    { feature: 'hour_of_day', description: 'Hour when login occurred (0-23)' },
    { feature: 'day_of_week', description: 'Day of week (0=Sunday, 6=Saturday)' },
    { feature: 'is_off_hours', description: '1 if login outside 7am-7pm, 0 otherwise' },
    { feature: 'is_weekend', description: '1 if login on Saturday/Sunday, 0 otherwise' },
    { feature: 'pc_familiarity', description: 'Ratio of logins from this PC vs total for user' },
    { feature: 'ip_familiarity', description: 'Ratio of logins from this IP vs total for user' },
    { feature: 'hour_deviation', description: 'Standard deviations from user\'s typical login hour' },
    { feature: 'day_deviation', description: '1 if login on atypical day, 0 otherwise' },
    { feature: 'activity_frequency', description: 'Total events for this user in dataset' },
  ];
}
