import { useEffect, useRef, useMemo } from 'react';
import { FraudRing } from '@/lib/fraud-rings';

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  status: string;
  label: string;
}

interface Edge {
  from: string;
  to: string;
  reason: string;
}

const REASON_COLORS: Record<string, string> = {
  device: 'hsl(174, 72%, 46%)',
  location: 'hsl(38, 92%, 50%)',
  amount: 'hsl(270, 60%, 55%)',
  timing: 'hsl(200, 70%, 50%)',
};

export function FraudRingGraph({ ring }: { ring: FraudRing }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);

  const width = 320;
  const height = 220;
  const cx = width / 2;
  const cy = height / 2;

  // Initialize nodes in a circle
  useMemo(() => {
    const count = ring.transactions.length;
    nodesRef.current = ring.transactions.map((t, i) => {
      const angle = (2 * Math.PI * i) / count;
      const r = Math.min(width, height) * 0.3;
      return {
        id: t.id,
        x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 10,
        y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 10,
        vx: 0,
        vy: 0,
        status: t.status,
        label: `$${(t.amount / 1000).toFixed(1)}k`,
      };
    });
  }, [ring]);

  useEffect(() => {
    const nodes = nodesRef.current;
    const edges = ring.edges;
    let frame = 0;

    const tick = () => {
      frame++;
      // Simple force simulation
      for (const node of nodes) {
        // Center gravity
        node.vx += (cx - node.x) * 0.005;
        node.vy += (cy - node.y) * 0.005;

        // Repulsion between all nodes
        for (const other of nodes) {
          if (node.id === other.id) continue;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 80) {
            const force = 2 / dist;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }
      }

      // Attraction along edges
      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      const seen = new Set<string>();
      for (const edge of edges) {
        const key = [edge.from, edge.to].sort().join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        const a = nodeMap.get(edge.from);
        const b = nodeMap.get(edge.to);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const target = 60;
        const force = (dist - target) * 0.01;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      }

      // Apply velocity with damping
      for (const node of nodes) {
        node.vx *= 0.85;
        node.vy *= 0.85;
        node.x += node.vx;
        node.y += node.vy;
        // Bounds
        node.x = Math.max(20, Math.min(width - 20, node.x));
        node.y = Math.max(20, Math.min(height - 20, node.y));
      }

      // Render
      const svg = svgRef.current;
      if (!svg) return;

      // Update edges
      const edgeEls = svg.querySelectorAll<SVGLineElement>('.edge-line');
      const uniqueEdges: Edge[] = [];
      const edgeSeen = new Set<string>();
      for (const e of edges) {
        const k = [e.from, e.to].sort().join('|') + e.reason;
        if (edgeSeen.has(k)) continue;
        edgeSeen.add(k);
        uniqueEdges.push(e);
      }

      edgeEls.forEach((el, i) => {
        const e = uniqueEdges[i];
        if (!e) return;
        const a = nodeMap.get(e.from);
        const b = nodeMap.get(e.to);
        if (a && b) {
          el.setAttribute('x1', String(a.x));
          el.setAttribute('y1', String(a.y));
          el.setAttribute('x2', String(b.x));
          el.setAttribute('y2', String(b.y));
        }
      });

      // Update nodes
      const nodeEls = svg.querySelectorAll<SVGGElement>('.node-group');
      nodeEls.forEach((el, i) => {
        const n = nodes[i];
        if (n) el.setAttribute('transform', `translate(${n.x},${n.y})`);
      });

      if (frame < 120) {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [ring]);

  // Deduplicated edges for rendering
  const uniqueEdges = useMemo(() => {
    const seen = new Set<string>();
    return ring.edges.filter(e => {
      const k = [e.from, e.to].sort().join('|') + e.reason;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [ring]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
    >
      {/* Edges */}
      {uniqueEdges.map((e, i) => (
        <line
          key={i}
          className="edge-line"
          stroke={REASON_COLORS[e.reason] || 'hsl(var(--muted-foreground))'}
          strokeWidth={1.5}
          strokeOpacity={0.4}
          x1={cx} y1={cy} x2={cx} y2={cy}
        />
      ))}
      {/* Nodes */}
      {nodesRef.current.map((node, i) => (
        <g key={node.id} className="node-group" transform={`translate(${node.x},${node.y})`}>
          <circle
            r={12}
            fill={node.status === 'confirmed_fraud' ? 'hsl(0, 72%, 51%)' : 'hsl(38, 92%, 50%)'}
            fillOpacity={0.8}
            stroke={node.status === 'confirmed_fraud' ? 'hsl(0, 72%, 65%)' : 'hsl(38, 92%, 65%)'}
            strokeWidth={1.5}
          />
          <text
            y={1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize={7}
            fontWeight={600}
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
