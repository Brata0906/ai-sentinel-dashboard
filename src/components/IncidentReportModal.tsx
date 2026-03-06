import { useMemo, useState } from 'react';
import { Transaction } from '@/lib/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, AlertTriangle, MapPin, Download, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { generateIncidentPDF } from '@/lib/incident-report-pdf';
import { buildReportHtml } from '@/lib/incident-report-email';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onClose: () => void;
  flagged: Transaction[];
}

export function IncidentReportModal({ open, onClose, flagged }: Props) {
  const { toast } = useToast();
  const [emailTo, setEmailTo] = useState('');
  const [sending, setSending] = useState(false);

  const sorted = useMemo(
    () => [...flagged].sort((a, b) => b.riskScore - a.riskScore),
    [flagged]
  );

  const confirmedFraud = flagged.filter(t => t.status === 'confirmed_fraud');
  const confirmedAmount = confirmedFraud.reduce((s, t) => s + t.amount, 0);
  const pendingCount = flagged.filter(t => t.status === 'pending').length;

  const topLocations = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of flagged) {
      map.set(t.location.name, (map.get(t.location.name) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [flagged]);

  const top3 = sorted.slice(0, 3);
  const now = new Date();

  const buildPlainText = () => {
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════');
    lines.push('         AI SENTINEL — INCIDENT REPORT');
    lines.push(`         Generated: ${format(now, 'PPpp')}`);
    lines.push('═══════════════════════════════════════════');
    lines.push('');
    lines.push('── EXECUTIVE SUMMARY ──');
    lines.push(`  Total Flagged:        ${flagged.length}`);
    lines.push(`  Confirmed Fraud:      ${confirmedFraud.length}`);
    lines.push(`  Pending Review:       ${pendingCount}`);
    lines.push(`  Confirmed Fraud $:    $${confirmedAmount.toLocaleString()}`);
    lines.push(`  Top Risk Locations:   ${topLocations.map(([n, c]) => `${n} (${c})`).join(', ')}`);
    lines.push('');
    lines.push('── FLAGGED TRANSACTIONS (by risk score) ──');
    lines.push(`${'ID'.padEnd(14)} ${'User'.padEnd(12)} ${'Amount'.padEnd(10)} ${'Location'.padEnd(16)} ${'Risk'.padEnd(5)} Status`);
    lines.push('─'.repeat(75));
    for (const t of sorted) {
      lines.push(
        `${t.id.padEnd(14)} ${t.userId.padEnd(12)} ${'$' + t.amount.toLocaleString().padEnd(9)} ${t.location.name.padEnd(16)} ${String(t.riskScore).padEnd(5)} ${t.status}`
      );
    }
    lines.push('');
    lines.push('── RECOMMENDED ACTIONS ──');
    top3.forEach((t, i) => {
      lines.push(`  ${i + 1}. [IMMEDIATE] ${t.id} — $${t.amount.toLocaleString()} from ${t.location.name} (Score: ${t.riskScore})`);
      lines.push(`     User: ${t.userId} | Device: ${t.deviceType} | Status: ${t.status}`);
      if (t.riskFactors.filter(f => f.triggered).length > 0) {
        lines.push(`     Triggers: ${t.riskFactors.filter(f => f.triggered).map(f => f.name).join(', ')}`);
      }
    });
    lines.push('');
    lines.push('═══════════════════════════════════════════');
    return lines.join('\n');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildPlainText());
    toast({ title: 'Report copied to clipboard' });
  };

  const handleDownloadPDF = () => {
    const doc = generateIncidentPDF(flagged);
    doc.save(`incident-report-${format(now, 'yyyy-MM-dd-HHmm')}.pdf`);
    toast({ title: 'PDF downloaded' });
  };

  const handleSendEmail = async () => {
    if (!emailTo.trim()) {
      toast({ title: 'Enter recipient email(s)', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const recipients = emailTo.split(',').map(e => e.trim()).filter(Boolean);
      const { data, error } = await supabase.functions.invoke('send-incident-report', {
        body: {
          to: recipients,
          subject: `[AI Sentinel] Incident Report — ${format(now, 'PP')} — ${flagged.length} flagged`,
          reportHtml: buildReportHtml(flagged),
          reportText: buildPlainText(),
        },
      });
      if (error) throw error;
      toast({ title: `Report sent to ${recipients.length} recipient(s)` });
      setEmailTo('');
    } catch (err: any) {
      toast({ title: 'Failed to send', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Incident Report
          </DialogTitle>
          <DialogDescription className="text-xs">
            Generated {format(now, 'PPpp')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Executive Summary */}
            <div className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Executive Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SummaryStat label="Total Flagged" value={flagged.length} />
                <SummaryStat label="Confirmed Fraud" value={confirmedFraud.length} />
                <SummaryStat label="Pending Review" value={pendingCount} />
                <SummaryStat label="Fraud Amount" value={`$${confirmedAmount.toLocaleString()}`} />
              </div>
              {topLocations.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Top Risk Locations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topLocations.map(([name, count]) => (
                      <Badge key={name} variant="outline" className="text-[10px] gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {name} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Flagged Transactions Table */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Flagged Transactions ({sorted.length})
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">User</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs">Location</TableHead>
                      <TableHead className="text-xs">Risk</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">{t.id}</TableCell>
                        <TableCell className="font-mono text-xs">{t.userId}</TableCell>
                        <TableCell className="text-xs">${t.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{t.location.name}</TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-[10px]">{t.riskScore}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={t.status === 'confirmed_fraud' ? 'destructive' : t.status === 'cleared' ? 'outline' : 'secondary'}
                            className="text-[10px] capitalize"
                          >
                            {t.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Recommended Actions */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Recommended Actions
              </h3>
              <div className="space-y-2">
                {top3.map((t, i) => (
                  <div key={t.id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <div className="flex items-start gap-2">
                      <Badge variant="destructive" className="text-[10px] shrink-0 mt-0.5">
                        #{i + 1}
                      </Badge>
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-medium">
                          <span className="font-mono">{t.id}</span> — ${t.amount.toLocaleString()} from {t.location.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          User: {t.userId} · Device: {t.deviceType} · Score: {t.riskScore}
                        </p>
                        {t.riskFactors.filter(f => f.triggered).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {t.riskFactors.filter(f => f.triggered).map(f => (
                              <Badge key={f.name} variant="outline" className="text-[9px]">
                                {f.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Send */}
            <div className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Send via Email</h3>
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="email-to" className="text-xs text-muted-foreground">Recipients (comma-separated)</Label>
                  <Input
                    id="email-to"
                    placeholder="security@company.com, ciso@company.com"
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <Button onClick={handleSendEmail} disabled={sending} className="self-end gap-2 h-9">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
          <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={handleCopy} variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            Copy Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
