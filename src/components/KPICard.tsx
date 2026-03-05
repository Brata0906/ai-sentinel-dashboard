import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'danger' | 'success';
}

export function KPICard({ title, value, subtitle, icon: Icon, variant = 'default' }: KPICardProps) {
  return (
    <Card className={cn(
      'border-border/50 transition-all hover:border-border',
      variant === 'danger' && 'border-destructive/30 hover:border-destructive/50',
      variant === 'success' && 'border-success/30 hover:border-success/50',
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className={cn(
              'text-2xl font-bold font-mono',
              variant === 'danger' && 'text-destructive',
              variant === 'success' && 'text-success',
            )}>
              {value}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            variant === 'danger' ? 'bg-destructive/10' : variant === 'success' ? 'bg-success/10' : 'bg-primary/10',
          )}>
            <Icon className={cn(
              'h-5 w-5',
              variant === 'danger' ? 'text-destructive' : variant === 'success' ? 'text-success' : 'text-primary',
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
