import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Transaction, KPIData } from '@/lib/types';
import { generateTransaction } from '@/lib/fraud-engine';
import { useToast } from '@/hooks/use-toast';

interface TransactionContextType {
  transactions: Transaction[];
  kpi: KPIData;
  updateTransactionStatus: (id: string, status: 'confirmed_fraud' | 'cleared') => void;
  isRunning: boolean;
  toggleSimulation: () => void;
}

const TransactionContext = createContext<TransactionContextType | null>(null);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const addTransaction = useCallback(() => {
    const txn = generateTransaction();
    setTransactions(prev => {
      const updated = [txn, ...prev].slice(0, 500); // keep last 500
      return updated;
    });

    if (txn.riskLevel === 'high') {
      toastRef.current({
        variant: 'destructive',
        title: '⚠ High Risk Transaction Detected',
        description: `${txn.id} — $${txn.amount.toLocaleString()} from ${txn.location.name} (Score: ${txn.riskScore})`,
      });
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    // Generate a few initial transactions
    for (let i = 0; i < 15; i++) {
      const txn = generateTransaction();
      setTransactions(prev => [txn, ...prev]);
    }

    const interval = setInterval(() => {
      addTransaction();
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [isRunning, addTransaction]);

  const kpi: KPIData = React.useMemo(() => {
    const total = transactions.length;
    const flagged = transactions.filter(t => t.riskLevel === 'high').length;
    const avgScore = total > 0 ? Math.round(transactions.reduce((s, t) => s + t.riskScore, 0) / total) : 0;
    return {
      totalTransactions: total,
      flaggedCount: flagged,
      fraudPercentage: total > 0 ? Math.round((flagged / total) * 1000) / 10 : 0,
      averageRiskScore: avgScore,
    };
  }, [transactions]);

  const updateTransactionStatus = useCallback((id: string, status: 'confirmed_fraud' | 'cleared') => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }, []);

  const toggleSimulation = useCallback(() => setIsRunning(prev => !prev), []);

  return (
    <TransactionContext.Provider value={{ transactions, kpi, updateTransactionStatus, isRunning, toggleSimulation }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionProvider');
  return ctx;
}
