import { useTransactions } from '@/context/TransactionContext';
import { RiskBadge, StatusBadge } from '@/components/RiskBadge';
import { TransactionDetail } from '@/components/TransactionDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo } from 'react';
import { Transaction } from '@/lib/types';
import { Search } from 'lucide-react';

const Transactions = () => {
  const { transactions } = useTransactions();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = !search || t.id.toLowerCase().includes(search.toLowerCase()) ||
        t.userId.toLowerCase().includes(search.toLowerCase()) ||
        t.location.name.toLowerCase().includes(search.toLowerCase());
      const matchesRisk = riskFilter === 'all' || t.riskLevel === riskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [transactions, search, riskFilter]);

  return (
    <div className="space-y-6 p-6 animate-slide-in">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground">Browse and filter all transactions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, user, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="safe">🟢 Safe</SelectItem>
            <SelectItem value="medium">🟡 Medium</SelectItem>
            <SelectItem value="high">🔴 High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{filtered.length.toLocaleString()} Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Device</TableHead>
                  <TableHead className="text-xs">Risk</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 100).map((txn) => (
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
                    <TableCell><StatusBadge status={txn.status} /></TableCell>
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

export default Transactions;
