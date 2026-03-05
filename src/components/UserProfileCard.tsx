import { UserProfile } from '@/lib/user-profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet, MapPin, Activity } from 'lucide-react';

interface Props {
  profile: UserProfile;
  onClick: () => void;
}

function RiskIndicator({ score }: { score: number }) {
  const color = score < 30
    ? 'text-green-400'
    : score < 60
      ? 'text-yellow-400'
      : 'text-red-400';

  const bg = score < 30
    ? 'bg-green-400/10'
    : score < 60
      ? 'bg-yellow-400/10'
      : 'bg-red-400/10';

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${bg}`}>
      <Activity className={`h-3.5 w-3.5 ${color}`} />
      <span className={`text-sm font-bold ${color}`}>{score}</span>
    </div>
  );
}

function HourHeatmap({ hours }: { hours: number[] }) {
  const max = Math.max(...hours, 1);
  return (
    <div className="flex gap-px">
      {hours.map((count, i) => {
        const intensity = count / max;
        const bg = intensity === 0
          ? 'bg-muted/30'
          : intensity < 0.33
            ? 'bg-green-500/40'
            : intensity < 0.66
              ? 'bg-yellow-500/50'
              : 'bg-red-500/60';
        return (
          <div
            key={i}
            className={`h-3 flex-1 rounded-[1px] ${bg}`}
            title={`${i}:00 — ${count} txns`}
          />
        );
      })}
    </div>
  );
}

export function UserProfileCard({ profile, onClick }: Props) {
  return (
    <Card
      className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-200"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono truncate">{profile.userId}</CardTitle>
          <RiskIndicator score={profile.behavioralRiskScore} />
        </div>
        <p className="text-xs text-muted-foreground">{profile.transactionCount} transactions</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Amount range */}
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground font-medium">${profile.amountMin.toLocaleString()}</span>
          {' — '}
          <span className="text-foreground font-medium">${profile.amountMax.toLocaleString()}</span>
          <span className="ml-2">(avg ${profile.amountAvg.toLocaleString()})</span>
        </div>

        {/* Top devices & locations */}
        <div className="flex flex-wrap gap-1.5">
          {profile.topDevices.slice(0, 2).map(d => (
            <Badge key={d.name} variant="secondary" className="text-[10px] gap-1">
              <Monitor className="h-2.5 w-2.5" />
              {d.name}
            </Badge>
          ))}
          {profile.topLocations.slice(0, 2).map(l => (
            <Badge key={l.name} variant="outline" className="text-[10px] gap-1">
              <MapPin className="h-2.5 w-2.5" />
              {l.name}
            </Badge>
          ))}
        </div>

        {/* Heatmap */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1">Active Hours (0–23)</p>
          <HourHeatmap hours={profile.activeHours} />
        </div>
      </CardContent>
    </Card>
  );
}
