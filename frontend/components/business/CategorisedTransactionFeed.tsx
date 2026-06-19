"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ErrorState";
import { Transaction } from "@/types";
import { getBusinessAccount, postCategorize } from "@/lib/api";
import { formatLKR } from "@/lib/utils";
import { CategoryBadge } from "./CategoryBadge";

interface CategorisedTransactionFeedProps {
  userId: string;
  extraTransactions?: Transaction[];
}

export function CategorisedTransactionFeed({
  userId,
  extraTransactions = [],
}: CategorisedTransactionFeedProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await getBusinessAccount(userId)) as {
        transactions: Transaction[];
      };
      const txs = data.transactions ?? [];

      try {
        const ids = txs.map((t) => t.transaction_id);
        const categories = (await postCategorize({ transaction_ids: ids })) as Record<
          string,
          { category_en: string; category_si: string; subcategory: string }
        >;
        const merged = txs.map((t) => ({
          ...t,
          ...categories[t.transaction_id],
        }));
        setTransactions(merged);
      } catch {
        setTransactions(txs);
      }
    } catch (err) {
      setTransactions([]);
      setError(
        err instanceof Error ? err.message : "Failed to load transactions"
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      try {
        const data = (await getBusinessAccount(userId)) as {
          transactions: Transaction[];
        };
        if (cancelled) return;

        const txs = data.transactions ?? [];

        try {
          const ids = txs.map((t) => t.transaction_id);
          const categories = (await postCategorize({
            transaction_ids: ids,
          })) as Record<
            string,
            { category_en: string; category_si: string; subcategory: string }
          >;
          if (cancelled) return;
          const merged = txs.map((t) => ({
            ...t,
            ...categories[t.transaction_id],
          }));
          setTransactions(merged);
        } catch {
          if (!cancelled) setTransactions(txs);
        }
      } catch (err) {
        if (!cancelled) {
          setTransactions([]);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load transactions"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const allTxs = [...extraTransactions, ...transactions];

  const filtered =
    tab === "all"
      ? allTxs
      : tab === "income"
      ? allTxs.filter((t) => t.type === "credit")
      : allTxs.filter((t) => t.type === "debit");

  const groupedByDay = filtered.reduce<Record<string, Transaction[]>>(
    (acc, tx) => {
      const day = new Date(tx.timestamp).toLocaleDateString("en-LK", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      if (!acc[day]) acc[day] = [];
      acc[day].push(tx);
      return acc;
    },
    {}
  );

  if (loading) {
    return (
      <Card className="border-ceyfi-line">
        <CardContent className="p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error && transactions.length === 0) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <Card className="card-glass shadow-brand border-0">
      <CardContent className="p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ceyfi-green">
            AI categorised feed
          </p>
          <h3 className="font-heading text-lg font-semibold text-ceyfi-ink dark:text-white">
            Transactions needing review
          </h3>
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value={tab}>
            <div className="max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent]">
              {Object.entries(groupedByDay).map(([day, txs]) => {
                const dayNet = txs.reduce(
                  (sum, t) =>
                    sum + (t.type === "credit" ? t.amount_lkr : -t.amount_lkr),
                  0
                );
                return (
                  <div key={day} className="mb-4">
                    <div className="sticky top-0 bg-white/95 dark:bg-[#04241a]/95 z-10 flex justify-between items-center py-2 border-b border-ceyfi-line dark:border-white/[0.08] mb-2 backdrop-blur">
                      <span className="text-xs font-medium text-ceyfi-ink dark:text-white/70">
                        {day}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          dayNet >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        Net: {dayNet >= 0 ? "+" : ""}
                        {formatLKR(dayNet)}
                      </span>
                    </div>
                    {txs.map((tx) => (
                      <div
                        key={tx.transaction_id}
                        className="flex items-center justify-between py-2 border-b border-ceyfi-line/50 dark:border-white/[0.06] last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-ceyfi-ink dark:text-white/80 truncate">
                            {tx.description ?? tx.merchant}
                          </div>
                          {tx.category_en && (
                            <CategoryBadge
                              categoryEn={tx.category_en}
                              categorySi={tx.category_si}
                            />
                          )}
                        </div>
                        <span
                          className={`text-sm font-medium ml-2 ${
                            tx.type === "credit"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {tx.type === "credit" ? "+" : "-"}
                          {formatLKR(tx.amount_lkr)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground dark:text-white/30 text-center py-4">
                  No transactions
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
