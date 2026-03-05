import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Transaction, KPIData } from '@/lib/types';
import { generateTransaction } from '@/lib/fraud-engine';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TransactionContextType {
  transactions: Transaction[];
  kpi: KPIData;
  updateTransactionStatus: (id: string, status: 'confirmed_fraud' | 'cleared') => void;
  isRunning: boolean;
  toggleSimulation: () => void;
}

const TransactionContext = createContext<TransactionContextType | null>(null);

function txnToRow(txn: Transaction) {
  return {
    id: txn.id,
    user_id_field: txn.userId,
    amount: txn.amount,
    location_name: txn.location.name,
    location_country: txn.location.country,
    location_lat: txn.location.lat,
    location_lng: txn.location.lng,
    device_type: txn.deviceType,
    risk_score: txn.riskScore,
    risk_level: txn.riskLevel,
    risk_factors: JSON.parse(JSON.stringify(txn.riskFactors)),
    status: txn.status,
  };
}

function rowToTxn(row: any): Transaction {
  return {
    id: row.id,
    userId: row.user_id_field,
    amount: Number(row.amount),
    location: {
      name: row.location_name,
      country: row.location_country,
      lat: Number(row.location_lat),
      lng: Number(row.location_lng),
    },
    deviceType: row.device_type,
    timestamp: new Date(row.created_at),
    riskScore: row.risk_score,
    riskLevel: row.risk_level as 'safe' | 'medium' | 'high',
    riskFactors: (row.risk_factors as any[]) || [],
    status: row.status as 'pending' | 'confirmed_fraud' | 'cleared',
  };
}

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Load existing transactions from DB on mount
  useEffect(() => {
    const loadTransactions = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (data && data.length > 0) {
        setTransactions(data.map(rowToTxn));
      }
    };
    loadTransactions();
  }, []);

  const addTransaction = useCallback(async () => {
    const txn = generateTransaction();
    
    // Add to local state immediately
    setTransactions(prev => [txn, ...prev].slice(0, 500));

    // Persist to database
    await supabase.from('transactions').insert(txnToRow(txn));

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
    
    // Generate initial transactions only if DB was empty
    if (transactions.length === 0) {
      const initTxns: Transaction[] = [];
      for (let i = 0; i < 15; i++) {
        const txn = generateTransaction();
        initTxns.push(txn);
      }
      setTransactions(initTxns);
      // Persist initial batch
      supabase.from('transactions').insert(initTxns.map(txnToRow));
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

  const updateTransactionStatus = useCallback(async (id: string, status: 'confirmed_fraud' | 'cleared') => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    // Persist status update to DB
    await supabase.from('transactions').update({ status }).eq('id', id);
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
