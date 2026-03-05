import { useTransactions } from '@/context/TransactionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

const COLORS = {
  safe: 'hsl(142, 72%, 42%)',
  medium: 'hsl(38, 92%, 50%)',
  high: 'hsl(0, 72%, 51%)',
};

const Analytics = () => {
  const { transactions } = useTransactions();

  const riskDistribution = useMemo(() => [
    { name: 'Safe', value: transactions.filter(t => t.riskLevel === 'safe').length, fill: COLORS.safe },
    { name: 'Medium', value: transactions.filter(t => t.riskLevel === 'medium').length, fill: COLORS.medium },
    { name: 'High', value: transactions.filter(t => t.riskLevel === 'high').length, fill: COLORS.high },
  ], [transactions]);

  const topLocations = useMemo(() => {
    const counts: Record<string, number> = {};
    transactions.filter(t => t.riskLevel === 'high').forEach(t => {
      counts[t.location.name] = (counts[t.location.name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [transactions]);

  const trendData = useMemo(() => {
    // Group by 30-second buckets
    const buckets: Record<number, { total: number; flagged: number }> = {};
    transactions.forEach(t => {
      const bucket = Math.floor(t.timestamp.getTime() / 30000) * 30000;
      if (!buckets[bucket]) buckets[bucket] = { total: 0, flagged: 0 };
      buckets[bucket].total++;
      if (t.riskLevel === 'high') buckets[bucket].flagged++;
    });
    return Object.entries(buckets)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .slice(-20)
      .map(([ts, data]) => ({
        time: new Date(Number(ts)).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
        ...data,
      }));
  }, [transactions]);

  const amountBuckets = useMemo(() => {
    const ranges = [
      { label: '$0-100', min: 0, max: 100 },
      { label: '$100-500', min: 100, max: 500 },
      { label: '$500-1K', min: 500, max: 1000 },
      { label: '$1K-5K', min: 1000, max: 5000 },
      { label: '$5K-10K', min: 5000, max: 10000 },
      { label: '$10K+', min: 10000, max: Infinity },
    ];
    return ranges.map(r => ({
      name: r.label,
      count: transactions.filter(t => t.amount >= r.min && t.amount < r.max).length,
    }));
  }, [transactions]);

  return (
    <div className="space-y-6 p-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Transaction patterns and fraud trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 47%, 9%)', border: '1px solid hsl(220, 30%, 18%)', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 text-xs">
              {riskDistribution.map(r => (
                <div key={r.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.fill }} />
                  {r.name}: {r.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fraud Trends */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fraud Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 30%, 18%)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 47%, 9%)', border: '1px solid hsl(220, 30%, 18%)', borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="total" stroke="hsl(174, 72%, 46%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="flagged" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Fraud Locations */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Fraud Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topLocations} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 30%, 18%)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 47%, 9%)', border: '1px solid hsl(220, 30%, 18%)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Amount Distribution */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Amount Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={amountBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 30%, 18%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222, 47%, 9%)', border: '1px solid hsl(220, 30%, 18%)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="hsl(174, 72%, 46%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
