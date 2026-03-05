import { Transaction } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function RiskBadge({ level, score }: { level: Transaction['riskLevel']; score: number }) {
  return (
    <Badge
      className={cn(
        'font-mono text-xs',
        level === 'safe' && 'bg-success/15 text-success border-success/30',
        level === 'medium' && 'bg-warning/15 text-warning border-warning/30',
        level === 'high' && 'bg-destructive/15 text-destructive border-destructive/30 animate-pulse-glow',
      )}
      variant="outline"
    >
      {score}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: Transaction['status'] }) {
  return (
    <Badge
      className={cn(
        'text-xs',
        status === 'pending' && 'bg-muted text-muted-foreground border-border',
        status === 'confirmed_fraud' && 'bg-destructive/15 text-destructive border-destructive/30',
        status === 'cleared' && 'bg-success/15 text-success border-success/30',
      )}
      variant="outline"
    >
      {status === 'confirmed_fraud' ? 'Confirmed' : status === 'cleared' ? 'Cleared' : 'Pending'}
    </Badge>
  );
}
