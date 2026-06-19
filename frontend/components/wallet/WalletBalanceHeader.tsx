"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { formatLKR } from "@/lib/utils";

interface WalletBalanceHeaderProps {
  totalBalance: number;
  accountHolder?: string;
  isLive?: boolean;
}

export function WalletBalanceHeader({
  totalBalance,
  accountHolder,
  isLive = true,
}: WalletBalanceHeaderProps) {
  return (
    <Card className="card-glass shadow-brand border-0 overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-ceyfi-green via-ceyfi-mint to-ceyfi-green/30" />
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ceyfi-green">
              Family wallet balance
            </p>
            {isLive && <LiveIndicator />}
          </div>
          <div className="mt-2 font-heading text-3xl font-bold tabular-nums text-ceyfi-ink dark:text-white sm:text-4xl">
            {formatLKR(totalBalance)}
          </div>
          {accountHolder ? (
            <p className="mt-1 text-xs text-muted-foreground dark:text-white/40">
              Held by {accountHolder}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-ceyfi-line/70 bg-ceyfi-sprout/50 px-4 py-3 text-xs text-ceyfi-muted dark:border-white/10 dark:bg-white/5 dark:text-white/50">
          Buckets update in real time when family spends at home.
        </div>
      </CardContent>
    </Card>
  );
}
