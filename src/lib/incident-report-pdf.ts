import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '@/lib/types';
import { format } from 'date-fns';

export function generateIncidentPDF(flagged: Transaction[]) {
  const doc = new jsPDF();
  const now = new Date();
  const sorted = [...flagged].sort((a, b) => b.riskScore - a.riskScore);
  const confirmedFraud = flagged.filter(t => t.status === 'confirmed_fraud');
  const confirmedAmount = confirmedFraud.reduce((s, t) => s + t.amount, 0);
  const pendingCount = flagged.filter(t => t.status === 'pending').length;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('AI SENTINEL — INCIDENT REPORT', 14, 22);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${format(now, 'PPpp')}`, 14, 30);

  // Executive Summary
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 14, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const summaryData = [
    ['Total Flagged', String(flagged.length)],
    ['Confirmed Fraud', String(confirmedFraud.length)],
    ['Pending Review', String(pendingCount)],
    ['Confirmed Fraud Amount', `$${confirmedAmount.toLocaleString()}`],
  ];

  autoTable(doc, {
    startY: 46,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38] },
    margin: { left: 14 },
    tableWidth: 100,
  });

  // Flagged Transactions Table
  const tableY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Flagged Transactions (${sorted.length})`, 14, tableY);

  autoTable(doc, {
    startY: tableY + 4,
    head: [['ID', 'User', 'Amount', 'Location', 'Risk', 'Status']],
    body: sorted.map(t => [
      t.id,
      t.userId,
      `$${t.amount.toLocaleString()}`,
      t.location.name,
      String(t.riskScore),
      t.status.replace('_', ' '),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] },
    styles: { fontSize: 8 },
    margin: { left: 14 },
  });

  // Recommended Actions
  const top3 = sorted.slice(0, 3);
  const actionsY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommended Actions', 14, actionsY);

  let y = actionsY + 8;
  doc.setFontSize(9);
  top3.forEach((t, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text(`${i + 1}. [IMMEDIATE] ${t.id} — $${t.amount.toLocaleString()} from ${t.location.name} (Score: ${t.riskScore})`, 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`User: ${t.userId} | Device: ${t.deviceType} | Status: ${t.status}`, 18, y);
    y += 5;
    const triggers = t.riskFactors.filter(f => f.triggered).map(f => f.name);
    if (triggers.length > 0) {
      doc.text(`Triggers: ${triggers.join(', ')}`, 18, y);
      y += 5;
    }
    y += 3;
  });

  return doc;
}
