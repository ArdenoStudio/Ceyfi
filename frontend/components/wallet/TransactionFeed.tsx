"use client";

import { useState } from "react";
import { Transaction } from "@/types";
import { TransactionRow } from "./TransactionRow";
import { TransactionDetailSheet } from "./TransactionDetailSheet";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";

interface TransactionFeedProps {
  transactions: Transaction[];
}

export function TransactionFeed({ transactions }: TransactionFeedProps) {
  const recent = transactions.slice(0, 10);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function openDetail(tx: Transaction) {
    setSelected(tx);
    setSheetOpen(true);
  }

  return (
    <>
      <Card className="card-glass shadow-brand border-0">
        <CardContent className="p-5 sm:p-6">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ceyfi-green">
                Activity
              </p>
              <h3 className="mt-0.5 font-heading text-lg font-semibold text-ceyfi-ink dark:text-white">
                Recent Transactions
              </h3>
            </div>
            <span className="rounded-full border border-ceyfi-line bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white/40">
              Latest {recent.length || "10"}
            </span>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ceyfi-line bg-ceyfi-sprout/40 py-10 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ceyfi-line/40 dark:bg-white/[0.06]">
                <Receipt className="h-5 w-5 text-muted-foreground dark:text-white/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-ceyfi-ink dark:text-white">No transactions yet</p>
                <p className="mt-0.5 text-xs text-muted-foreground dark:text-white/40">
                  Family spending will appear here after the first remittance is used.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto scrollbar-hide">
              {recent.map((tx) => (
                <TransactionRow
                  key={tx.transaction_id}
                  transaction={tx}
                  onClick={() => openDetail(tx)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDetailSheet
        transaction={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
