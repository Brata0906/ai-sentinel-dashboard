import { useTransactions } from '@/context/TransactionContext';
import { KPICard } from '@/components/KPICard';
import { RiskBadge, StatusBadge } from '@/components/RiskBadge';
import { TransactionDetail } from '@/components/TransactionDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, ShieldAlert, XCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Transaction } from '@/lib/types';

const Admin = () => {
  const { transactions, updateTransactionStatus } = useTransactions();
  const [selected, setSelected] = useState<Transaction | null>(null);

  const flagged = useMemo(() =>
    transactions.filter(t => t.riskLevel === 'high'),
    [transactions]
  );

  const pending = flagged.filter(t => t.status === 'pending').length;
  const confirmed = flagged.filter(t => t.status === 'confirmed_fraud').length;
  const cleared = flagged.filter(t => t.status === 'cleared').length;

  return (
    <div className="space-y-6 p-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Review and manage flagged transactions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Pending Review" value={pending} icon={AlertTriangle} variant="danger" />
        <KPICard title="Confirmed Fraud" value={confirmed} icon={ShieldAlert} variant="danger" />
        <KPICard title="Cleared" value={cleared} icon={CheckCircle} variant="success" />
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Flagged Transactions ({flagged.length})</CardTitle>
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
                  <TableHead className="text-xs">Risk</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flagged.map((txn) => (
                  <TableRow
                    key={txn.id}
                    className="hover:bg-muted/30 transition-colors text-xs"
                  >
                    <TableCell
                      className="font-mono text-xs cursor-pointer text-primary hover:underline"
                      onClick={() => setSelected(txn)}
                    >
                      {txn.id}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{txn.userId}</TableCell>
                    <TableCell className="font-mono text-xs">${txn.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{txn.location.name}</TableCell>
                    <TableCell><RiskBadge level={txn.riskLevel} score={txn.riskScore} /></TableCell>
                    <TableCell><StatusBadge status={txn.status} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() => updateTransactionStatus(txn.id, 'confirmed_fraud')}
                          disabled={txn.status !== 'pending'}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Fraud
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-success/30 text-success hover:bg-success/10"
                          onClick={() => updateTransactionStatus(txn.id, 'cleared')}
                          disabled={txn.status !== 'pending'}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Safe
                        </Button>
                      </div>
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

export default Admin;
