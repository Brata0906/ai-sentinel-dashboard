import { useTransactions } from '@/context/TransactionContext';
import { KPICard } from '@/components/KPICard';
import { RiskBadge, StatusBadge } from '@/components/RiskBadge';
import { TransactionDetail } from '@/components/TransactionDetail';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, ShieldAlert, XCircle, Network, Monitor, MapPin, DollarSign, Clock, FileText } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Transaction } from '@/lib/types';
import { detectFraudRings, FraudRing } from '@/lib/fraud-rings';
import { FraudRingGraph } from '@/components/FraudRingGraph';
import { IncidentReportModal } from '@/components/IncidentReportModal';

const ATTR_ICON: Record<string, React.ReactNode> = {
  device: <Monitor className="h-3 w-3" />,
  location: <MapPin className="h-3 w-3" />,
  amount: <DollarSign className="h-3 w-3" />,
  timing: <Clock className="h-3 w-3" />,
};

function ConfidenceBadge({ score }: { score: number }) {
  const variant = score >= 70 ? 'destructive' : score >= 40 ? 'secondary' : 'outline';
  return <Badge variant={variant} className="text-[10px] font-bold">{score}%</Badge>;
}

const Admin = () => {
  const { transactions, updateTransactionStatus } = useTransactions();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const flagged = useMemo(() =>
    transactions.filter(t => t.riskLevel === 'high'),
    [transactions]
  );

  const rings = useMemo(() => detectFraudRings(transactions), [transactions]);

  const pending = flagged.filter(t => t.status === 'pending').length;
  const confirmed = flagged.filter(t => t.status === 'confirmed_fraud').length;
  const cleared = flagged.filter(t => t.status === 'cleared').length;

  return (
    <div className="space-y-6 p-6 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Review and manage flagged transactions</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setReportOpen(true)}>
          <FileText className="h-4 w-4" />
          Generate Incident Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Pending Review" value={pending} icon={AlertTriangle} variant="danger" />
        <KPICard title="Confirmed Fraud" value={confirmed} icon={ShieldAlert} variant="danger" />
        <KPICard title="Cleared" value={cleared} icon={CheckCircle} variant="success" />
      </div>

      {/* Fraud Ring Detection */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Fraud Ring Detection</CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs">{rings.length} clusters</Badge>
          </div>
          <CardDescription>
            Clusters of flagged transactions sharing device, location, amount range, or timing patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No fraud rings detected yet — need more flagged transactions with shared attributes
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {rings.map(ring => (
                <Card key={ring.id} className="border-border/30 bg-card/50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold">{ring.id}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</span>
                        <ConfidenceBadge score={ring.confidence} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{ring.transactions.length} nodes · {ring.edges.length} links</span>
                      <span className="text-muted-foreground">·</span>
                      <div className="flex gap-1">
                        {ring.sharedAttributes.map(attr => (
                          <span key={attr} className="flex items-center gap-0.5 text-[10px] text-muted-foreground" title={attr}>
                            {ATTR_ICON[attr]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="h-[220px] rounded-md bg-background/50 border border-border/30 overflow-hidden">
                      <FraudRingGraph ring={ring} />
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-destructive inline-block" /> Confirmed
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-warning inline-block" /> Pending
                      </span>
                      {ring.sharedAttributes.map(attr => (
                        <span key={attr} className="flex items-center gap-1 capitalize">
                          {ATTR_ICON[attr]} {attr}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
      <IncidentReportModal open={reportOpen} onClose={() => setReportOpen(false)} flagged={flagged} />
    </div>
  );
};

export default Admin;
