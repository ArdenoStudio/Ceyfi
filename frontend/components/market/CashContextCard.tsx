"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";

import { cashSharePct } from "@/lib/chime-market";
import { formatLKR } from "@/lib/utils";

export function CashContextCard({
  liquidLkr,
  signalPrice,
  label,
  loading,
}: {
  liquidLkr: number | null;
  /** Last price of the signal — shown as %% of liquid cash (framing only). */
  signalPrice?: number | null;
  label?: string;
  loading?: boolean;
}) {
  const share = cashSharePct(signalPrice, liquidLkr);

  return (
    <section className="rounded-[1.25rem] border border-ceyfi-line bg-card p-4 shadow-sm dark:border-white/10">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-ceyfi-sprout text-ceyfi-green dark:bg-ceyfi-green/15">
          <Wallet className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ceyfi-muted">
            Cash context
          </p>
          <p className="mt-1 font-heading text-2xl font-semibold tabular-nums text-ceyfi-ink dark:text-white">
            {loading
              ? "…"
              : liquidLkr != null
                ? formatLKR(liquidLkr)
                : "Unavailable"}
          </p>
          {share != null ? (
            <p className="mt-1 text-[13px] leading-snug text-foreground/90">
              This ping is ~{share < 0.01 ? share.toFixed(3) : share.toFixed(2)}%
              of your liquid estimate
              {signalPrice != null ? (
                <span className="text-muted-foreground">
                  {" "}
                  (one share ≈ {formatLKR(signalPrice)})
                </span>
              ) : null}
              .
            </p>
          ) : null}
          <p className="mt-1 text-[12px] text-muted-foreground">
            {label ??
              "Liquid estimate from your Ceyfi snapshot — framing only, not a buy signal."}
          </p>
          <Link
            href="/wallet"
            className="mt-3 inline-flex text-sm font-medium text-ceyfi-green underline-offset-2 hover:underline"
          >
            Review cash in Wallet
          </Link>
        </div>
      </div>
    </section>
  );
}
