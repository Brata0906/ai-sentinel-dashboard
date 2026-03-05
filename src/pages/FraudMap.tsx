import { useTransactions } from '@/context/TransactionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

// Simplified world map projection (Mercator-ish)
function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 100;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = 50 - (mercN / Math.PI) * 50;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(5, Math.min(95, y)) };
}

const FraudMap = () => {
  const { transactions } = useTransactions();

  const hotspots = useMemo(() => {
    const counts: Record<string, { city: string; country: string; lat: number; lng: number; count: number; total: number }> = {};
    transactions.forEach(t => {
      const key = t.location.name;
      if (!counts[key]) {
        counts[key] = { city: t.location.name, country: t.location.country, lat: t.location.lat, lng: t.location.lng, count: 0, total: 0 };
      }
      counts[key].total++;
      if (t.riskLevel === 'high') counts[key].count++;
    });
    return Object.values(counts);
  }, [transactions]);

  const maxCount = Math.max(1, ...hotspots.map(h => h.count));

  return (
    <div className="space-y-6 p-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold">Fraud Heatmap</h1>
        <p className="text-sm text-muted-foreground">Global fraud hotspot visualization</p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Global Fraud Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full aspect-[2/1] bg-secondary/30 rounded-lg overflow-hidden">
            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {[20, 40, 60, 80].map(x => (
                <line key={`v${x}`} x1={x} y1={0} x2={x} y2={100} stroke="hsl(220, 30%, 15%)" strokeWidth="0.2" />
              ))}
              {[20, 40, 60, 80].map(y => (
                <line key={`h${y}`} x1={0} y1={y} x2={100} y2={y} stroke="hsl(220, 30%, 15%)" strokeWidth="0.2" />
              ))}
            </svg>

            {/* Hotspot bubbles */}
            {hotspots.map((spot) => {
              const { x, y } = project(spot.lat, spot.lng);
              const size = Math.max(8, (spot.count / maxCount) * 40);
              const opacity = 0.3 + (spot.count / maxCount) * 0.6;
              const hasHighRisk = spot.count > 0;

              return (
                <div
                  key={spot.city}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  {/* Glow */}
                  {hasHighRisk && (
                    <div
                      className="absolute rounded-full animate-pulse"
                      style={{
                        width: size * 2,
                        height: size * 2,
                        left: -size / 2,
                        top: -size / 2,
                        background: `radial-gradient(circle, hsl(0 72% 51% / ${opacity * 0.3}), transparent)`,
                      }}
                    />
                  )}
                  {/* Dot */}
                  <div
                    className="rounded-full border transition-transform group-hover:scale-150"
                    style={{
                      width: Math.max(6, size),
                      height: Math.max(6, size),
                      marginLeft: -Math.max(6, size) / 2,
                      marginTop: -Math.max(6, size) / 2,
                      backgroundColor: hasHighRisk
                        ? `hsl(0 72% 51% / ${opacity})`
                        : `hsl(174 72% 46% / 0.4)`,
                      borderColor: hasHighRisk
                        ? `hsl(0 72% 51% / ${opacity + 0.2})`
                        : `hsl(174 72% 46% / 0.6)`,
                    }}
                  />
                  {/* Label */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-card border border-border rounded px-2 py-0.5 text-[10px] z-10">
                    {spot.city}: {spot.count} flagged / {spot.total} total
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-primary/40 border border-primary/60" />
              No high-risk
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-destructive/50 border border-destructive/70" />
              Low fraud
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-destructive/80 border border-destructive" />
              High fraud
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FraudMap;
