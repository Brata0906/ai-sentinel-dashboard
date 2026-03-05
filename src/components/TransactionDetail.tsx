import { Transaction } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RiskBadge, StatusBadge } from './RiskBadge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Props {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

export function TransactionDetail({ transaction, open, onClose }: Props) {
  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-mono">
            {transaction.id}
            <RiskBadge level={transaction.riskLevel} score={transaction.riskScore} />
            <StatusBadge status={transaction.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">User</p>
              <p className="font-mono">{transaction.userId}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Amount</p>
              <p className="font-mono font-semibold">${transaction.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Location</p>
              <p>{transaction.location.name}, {transaction.location.country}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Device</p>
              <p>{transaction.deviceType}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">Time</p>
              <p className="font-mono text-xs">{transaction.timestamp.toLocaleString()}</p>
            </div>
          </div>

          {/* Risk Breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Risk Factor Analysis
            </h4>
            {transaction.riskFactors.map((factor) => (
              <div key={factor.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={cn(
                    'font-medium',
                    factor.triggered ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {factor.triggered ? '⚠' : '✓'} {factor.name}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {factor.triggered ? `+${Math.round(factor.contribution)}` : '0'}/{factor.weight}
                  </span>
                </div>
                <Progress
                  value={factor.triggered ? (factor.contribution / factor.weight) * 100 : 0}
                  className="h-1.5"
                />
                <p className="text-[10px] text-muted-foreground">{factor.description}</p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-semibold">Total Risk Score</span>
            <span className={cn(
              'text-2xl font-bold font-mono',
              transaction.riskLevel === 'safe' && 'text-success',
              transaction.riskLevel === 'medium' && 'text-warning',
              transaction.riskLevel === 'high' && 'text-destructive',
            )}>
              {transaction.riskScore}/100
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
