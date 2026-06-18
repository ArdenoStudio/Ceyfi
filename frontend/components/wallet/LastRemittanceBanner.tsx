"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatLKR } from "@/lib/utils";
import { WalletState } from "@/types";
import { ArrowRight, TrendingUp, CalendarDays, Building2 } from "lucide-react";

interface LastRemittanceBannerProps {
  wallet: WalletState;
  onSendAgain: () => void;
}

export function LastRemittanceBanner({
  wallet,
  onSendAgain,
}: LastRemittanceBannerProps) {
  const { last_remittance } = wallet;
  const currencyCode = last_remittance.currency_code ?? "GBP";
  const corridor = last_remittance.corridor ?? "GBP → LKR";

  return (
    <Card className="card-glass shadow-brand border-0 overflow-hidden">
      {/* Warm accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-seylan-red via-seylan-gold to-seylan-red/30" />

      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: amounts */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-seylan-red">
              Last remittance
            </p>

            {/* £ → Rs flow */}
            <div className="mt-2 flex items-center gap-3">
              <div>
                <span className="font-heading text-3xl font-bold text-seylan-charcoal dark:text-white tabular-nums leading-none">
                  {formatLKR(last_remittance.amount_lkr)}
                </span>
              </div>
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <div className="flex items-center gap-1">
                  <div className="h-px w-6 bg-seylan-border dark:bg-white/20" />
                  <ArrowRight className="h-3 w-3 text-muted-foreground dark:text-white/40" />
                </div>
              </div>
              <div>
                <span className="text-lg font-semibold text-muted-foreground dark:text-white/50 tabular-nums">
                  {currencyCode} {last_remittance.amount_gbp}
                </span>
              </div>
            </div>

            {/* Meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground dark:text-white/40">
                <CalendarDays className="h-3 w-3 shrink-0" />
                {last_remittance.date}
              </span>
              <span className="text-seylan-border dark:text-white/20">·</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground dark:text-white/40">
                <Building2 className="h-3 w-3 shrink-0" />
                {last_remittance.provider}
              </span>
            </div>
          </div>

          {/* Right: actions */}
          <Button
            className="rounded-full shrink-0 self-start sm:self-center"
            size="sm"
            onClick={onSendAgain}
          >
            Send Again
          </Button>
        </div>

        {/* FX rate pill */}
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-seylan-border/70 bg-seylan-mist/50 px-4 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-seylan-charcoal dark:text-white/60">
              {corridor}
            </span>
            <span className="font-heading text-base font-bold text-seylan-charcoal dark:text-white tabular-nums">
              {last_remittance.fx_rate}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5">
            <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">+0.4% this week</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
