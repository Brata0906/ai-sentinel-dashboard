import { useTransactions } from '@/context/TransactionContext';
import { KPICard } from '@/components/KPICard';
import { RiskBadge } from '@/components/RiskBadge';
import { TransactionDetail } from '@/components/TransactionDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, AlertTriangle, BarChart3, Shield } from 'lucide-react';
import { useState } from 'react';
import { Transaction } from '@/lib/types';

const Dashboard = () => {
  const { transactions, kpi } = useTransactions();
  const [selected, setSelected] = useState<Transaction | null>(null);

  const recent = transactions.slice(0, 50);

  return (
    <div className="space-y-6 p-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Real-time fraud monitoring overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Transactions" value={kpi.totalTransactions.toLocaleString()} icon={Activity} />
        <KPICard title="Flagged" value={kpi.flaggedCount} icon={AlertTriangle} variant="danger" />
        <KPICard title="Fraud Rate" value={`${kpi.fraudPercentage}%`} icon={Shield} variant={kpi.fraudPercentage > 10 ? 'danger' : 'success'} />
        <KPICard title="Avg Risk Score" value={kpi.averageRiskScore} icon={BarChart3} />
      </div>

      {/* Live Feed */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Live Transaction Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Device</TableHead>
                  <TableHead className="text-xs">Risk</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((txn) => (
                  <TableRow
                    key={txn.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors text-xs"
                    onClick={() => setSelected(txn)}
                  >
                    <TableCell className="font-mono text-xs">{txn.id}</TableCell>
                    <TableCell className="font-mono text-xs">{txn.userId}</TableCell>
                    <TableCell className="font-mono text-xs">${txn.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{txn.location.name}</TableCell>
                    <TableCell className="text-xs">{txn.deviceType}</TableCell>
                    <TableCell><RiskBadge level={txn.riskLevel} score={txn.riskScore} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {txn.timestamp.toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TransactionDetail transaction={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default Dashboard;
