"use client";

import { useState, useEffect, useCallback } from "react";
import { Bucket, Transaction, WalletState } from "@/types";
import { subscribeToTransactions } from "@/lib/supabase";
import { getFamilyWallet } from "@/lib/api";

interface UseWalletRealtimeOptions {
  accountId: string;
  onSpend?: (transaction: Transaction, newBucketBalance: number) => void;
}

export function useWalletRealtime({ accountId, onSpend }: UseWalletRealtimeOptions) {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const fetchWallet = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = (await getFamilyWallet(accountId)) as WalletState;
      setWallet(data);
      setBuckets(data.buckets);
      setTransactions(data.recent_transactions);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    let cancelled = false;
    getFamilyWallet(accountId)
      .then((data) => {
        if (cancelled) return;
        const w = data as WalletState;
        setWallet(w);
        setBuckets(w.buckets);
        setTransactions(w.recent_transactions);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load wallet");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [accountId]);

  useEffect(() => {
    const unsubscribe = subscribeToTransactions(
      accountId,
      (newTx) => {
        setTransactions((prev) => {
          if (prev.some((tx) => tx.transaction_id === newTx.transaction_id)) {
            return prev;
          }
          return [newTx, ...prev];
        });

        setBuckets((prev) => {
          const updated = prev.map((b) => {
            if (b.bucket_id !== newTx.bucket_id) return b;
            if (newTx.type === "credit") {
              const newBalance = b.balance_lkr + newTx.amount_lkr;
              return { ...b, balance_lkr: newBalance };
            }
            const newBalance = b.balance_lkr - newTx.amount_lkr;
            const newSpent = b.spent_lkr + newTx.amount_lkr;
            if (onSpend) onSpend(newTx, newBalance);
            return { ...b, balance_lkr: newBalance, spent_lkr: newSpent };
          });
          return updated;
        });

        if (newTx.type === "credit") {
          setWallet((w) =>
            w
              ? { ...w, total_balance_lkr: w.total_balance_lkr + newTx.amount_lkr }
              : w
          );
        }
      },
      setRealtimeConnected
    );

    return unsubscribe;
  }, [accountId, onSpend]);

  useEffect(() => {
    function handleDemoReset() {
      fetchWallet();
    }

    window.addEventListener("seylan:demo-reset", handleDemoReset);

    return () => {
      window.removeEventListener("seylan:demo-reset", handleDemoReset);
    };
  }, [accountId, fetchWallet]);

  useEffect(() => {
    if (realtimeConnected) return;

    const interval = window.setInterval(() => {
      fetchWallet(true);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [fetchWallet, realtimeConnected]);

  return {
    wallet,
    transactions,
    buckets,
    loading,
    error,
    realtimeConnected,
    refetch: fetchWallet,
  };
}
