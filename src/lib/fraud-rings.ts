import { Transaction } from '@/lib/types';

export interface FraudRing {
  id: string;
  transactions: Transaction[];
  sharedAttributes: ('device' | 'location' | 'amount' | 'timing')[];
  confidence: number;
  edges: { from: string; to: string; reason: string }[];
}

function amountBucket(amount: number): string {
  if (amount < 500) return '<500';
  if (amount < 2000) return '500-2k';
  if (amount < 5000) return '2k-5k';
  if (amount < 10000) return '5k-10k';
  return '10k+';
}

function withinMinutes(a: Date, b: Date, mins: number): boolean {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) <= mins * 60 * 1000;
}

export function detectFraudRings(transactions: Transaction[]): FraudRing[] {
  const flagged = transactions.filter(t => t.riskLevel === 'high' || t.status === 'confirmed_fraud');
  if (flagged.length < 2) return [];

  // Build adjacency via shared attributes
  const adjacency = new Map<string, Map<string, Set<string>>>();

  for (let i = 0; i < flagged.length; i++) {
    for (let j = i + 1; j < flagged.length; j++) {
      const a = flagged[i], b = flagged[j];
      const reasons: string[] = [];

      if (a.deviceType === b.deviceType) reasons.push('device');
      if (a.location.name === b.location.name) reasons.push('location');
      if (amountBucket(a.amount) === amountBucket(b.amount)) reasons.push('amount');
      if (withinMinutes(a.timestamp, b.timestamp, 10)) reasons.push('timing');

      if (reasons.length >= 2) {
        if (!adjacency.has(a.id)) adjacency.set(a.id, new Map());
        if (!adjacency.has(b.id)) adjacency.set(b.id, new Map());
        adjacency.get(a.id)!.set(b.id, new Set(reasons));
        adjacency.get(b.id)!.set(a.id, new Set(reasons));
      }
    }
  }

  // BFS to find connected components
  const visited = new Set<string>();
  const clusters: { ids: Set<string>; edges: { from: string; to: string; reason: string }[] }[] = [];

  for (const nodeId of adjacency.keys()) {
    if (visited.has(nodeId)) continue;
    const cluster: Set<string> = new Set();
    const edges: { from: string; to: string; reason: string }[] = [];
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      cluster.add(current);

      const neighbors = adjacency.get(current);
      if (neighbors) {
        for (const [neighbor, reasons] of neighbors) {
          for (const r of reasons) {
            edges.push({ from: current, to: neighbor, reason: r });
          }
          if (!visited.has(neighbor)) queue.push(neighbor);
        }
      }
    }

    if (cluster.size >= 2) {
      clusters.push({ ids: cluster, edges });
    }
  }

  // Deduplicate edges
  const txnMap = new Map(flagged.map(t => [t.id, t]));

  return clusters.map((cluster, idx) => {
    const txns = Array.from(cluster.ids).map(id => txnMap.get(id)!).filter(Boolean);
    
    // Deduplicate edges (a->b and b->a)
    const edgeSet = new Set<string>();
    const uniqueEdges = cluster.edges.filter(e => {
      const key = [e.from, e.to].sort().join('|') + '|' + e.reason;
      if (edgeSet.has(key)) return false;
      edgeSet.add(key);
      return true;
    });

    // Shared attributes across cluster
    const allReasons = new Set(uniqueEdges.map(e => e.reason));
    const sharedAttributes = Array.from(allReasons) as FraudRing['sharedAttributes'];

    // Confidence: based on attribute variety and cluster density
    const maxEdges = (txns.length * (txns.length - 1)) / 2;
    const uniquePairs = new Set(uniqueEdges.map(e => [e.from, e.to].sort().join('|')));
    const density = maxEdges > 0 ? uniquePairs.size / maxEdges : 0;
    const attributeBonus = sharedAttributes.length * 15;
    const confidence = Math.min(100, Math.round(density * 60 + attributeBonus));

    return {
      id: `RING-${String(idx + 1).padStart(3, '0')}`,
      transactions: txns,
      sharedAttributes,
      confidence,
      edges: uniqueEdges,
    };
  }).sort((a, b) => b.confidence - a.confidence);
}
