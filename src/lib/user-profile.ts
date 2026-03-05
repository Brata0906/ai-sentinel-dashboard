import { Transaction } from '@/lib/types';

export interface UserProfile {
  userId: string;
  transactionCount: number;
  amountMin: number;
  amountAvg: number;
  amountMax: number;
  topDevices: { name: string; count: number }[];
  topLocations: { name: string; count: number }[];
  activeHours: number[]; // 24 slots
  behavioralRiskScore: number;
  transactions: Transaction[];
}

function countOccurrences(items: string[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    map.set(item, (map.get(item) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function calculateBehavioralRisk(txns: Transaction[]): number {
  if (txns.length < 3) return 0;

  const amounts = txns.map(t => t.amount);
  const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;

  const allLocations = new Set(txns.map(t => t.location.name));
  const allDevices = new Set(txns.map(t => t.deviceType));

  const recent = txns.slice(0, Math.min(10, txns.length));
  const baseline = txns.slice(10);

  // Amount deviation score (0-40)
  const recentAmounts = recent.map(t => t.amount);
  const amountDeviations = recentAmounts.filter(a => a > avg * 2).length;
  const amountScore = Math.min(40, (amountDeviations / recent.length) * 80);

  // Location novelty score (0-30)
  const baselineLocations = new Set(baseline.map(t => t.location.name));
  const recentLocations = recent.map(t => t.location.name);
  const newLocations = baselineLocations.size > 0
    ? recentLocations.filter(l => !baselineLocations.has(l)).length
    : 0;
  const locationScore = Math.min(30, (newLocations / recent.length) * 60);

  // Device novelty score (0-30)
  const baselineDevices = new Set(baseline.map(t => t.deviceType));
  const recentDevices = recent.map(t => t.deviceType);
  const newDevices = baselineDevices.size > 0
    ? recentDevices.filter(d => !baselineDevices.has(d)).length
    : 0;
  const deviceScore = Math.min(30, (newDevices / recent.length) * 60);

  return Math.round(amountScore + locationScore + deviceScore);
}

export function computeUserProfiles(transactions: Transaction[]): Map<string, UserProfile> {
  const grouped = new Map<string, Transaction[]>();

  for (const txn of transactions) {
    const existing = grouped.get(txn.userId) || [];
    existing.push(txn);
    grouped.set(txn.userId, existing);
  }

  const profiles = new Map<string, UserProfile>();

  for (const [userId, txns] of grouped) {
    // Sort by timestamp descending (recent first)
    const sorted = [...txns].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const amounts = sorted.map(t => t.amount);
    const sum = amounts.reduce((s, a) => s + a, 0);

    const activeHours = new Array(24).fill(0);
    for (const t of sorted) {
      activeHours[new Date(t.timestamp).getHours()]++;
    }

    profiles.set(userId, {
      userId,
      transactionCount: sorted.length,
      amountMin: Math.min(...amounts),
      amountAvg: Math.round(sum / amounts.length),
      amountMax: Math.max(...amounts),
      topDevices: countOccurrences(sorted.map(t => t.deviceType)),
      topLocations: countOccurrences(sorted.map(t => t.location.name)),
      activeHours,
      behavioralRiskScore: calculateBehavioralRisk(sorted),
      transactions: sorted,
    });
  }

  return profiles;
}
