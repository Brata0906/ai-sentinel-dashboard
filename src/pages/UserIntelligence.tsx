import { useMemo, useState } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { computeUserProfiles, UserProfile } from '@/lib/user-profile';
import { UserProfileCard } from '@/components/UserProfileCard';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

export default function UserIntelligence() {
  const { transactions } = useTransactions();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const profiles = useMemo(() => computeUserProfiles(transactions), [transactions]);

  const filtered = useMemo(() => {
    const all = Array.from(profiles.values());
    if (!search.trim()) return all;
    return all.filter(p => p.userId.toLowerCase().includes(search.toLowerCase()));
  }, [profiles, search]);

  const chartData = useMemo(() => {
    if (!selectedUser) return [];
    return [...selectedUser.transactions]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(t => ({
        time: format(new Date(t.timestamp), 'HH:mm:ss'),
        amount: t.amount,
        risk: t.riskScore,
      }));
  }, [selectedUser]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            User Intelligence
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Behavioral profiles for {profiles.size} unique users
          </p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search user ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(profile => (
          <UserProfileCard
            key={profile.userId}
            profile={profile}
            onClick={() => setSelectedUser(profile)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No users found matching "{search}"
        </div>
      )}

      {/* Detail drawer */}
      <Sheet open={!!selectedUser} onOpenChange={open => !open && setSelectedUser(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedUser && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono text-base">{selectedUser.userId}</SheetTitle>
                <SheetDescription>
                  {selectedUser.transactionCount} transactions · Behavioral risk: {selectedUser.behavioralRiskScore}/100
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Timeline chart */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Transaction Timeline</h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="time" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                        <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary) / 0.15)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Transaction table */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Transaction History</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Time</TableHead>
                          <TableHead className="text-xs">Amount</TableHead>
                          <TableHead className="text-xs">Location</TableHead>
                          <TableHead className="text-xs">Device</TableHead>
                          <TableHead className="text-xs">Risk</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUser.transactions.slice(0, 50).map(t => (
                          <TableRow key={t.id}>
                            <TableCell className="text-xs font-mono">
                              {format(new Date(t.timestamp), 'HH:mm:ss')}
                            </TableCell>
                            <TableCell className="text-xs">${t.amount.toLocaleString()}</TableCell>
                            <TableCell className="text-xs">{t.location.name}</TableCell>
                            <TableCell className="text-xs">{t.deviceType}</TableCell>
                            <TableCell>
                              <Badge
                                variant={t.riskLevel === 'high' ? 'destructive' : t.riskLevel === 'medium' ? 'secondary' : 'outline'}
                                className="text-[10px]"
                              >
                                {t.riskScore}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
