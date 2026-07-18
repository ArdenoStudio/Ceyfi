"use client";

import Link from "next/link";

import {
  AppetiteBandBadge,
  AppetiteMeter,
} from "@/components/market/AppetiteMeter";
import {
  APPETITE_BAND_LABEL,
  type AppetiteBand,
  type AppetiteDay,
  type AppetitePayload,
} from "@/lib/chime-market";
import { cn } from "@/lib/utils";

function AppetiteMiniSpark({ historyAsc }: { historyAsc: AppetiteDay[] }) {
  const series = historyAsc.slice(-60);
  if (series.length < 2) return null;
  const scores = series.map((d) => d.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const span = max !== min ? max - min : 1;
  const w = 180;
  const h = 44;
  const pad = 3;
  const pts = series
    .map((d, i) => {
      const x = pad + (i / (series.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (d.score - min) / span) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const up = scores[scores.length - 1]! >= scores[0]!;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-11 w-full"
      role="img"
      aria-label={`Appetite spark, ${series.length} sessions`}
    >
      <polyline
        fill="none"
        stroke={up ? "#059669" : "#b45309"}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
}

function fmtDelta(d: number | null | undefined): string {
  if (d == null || !Number.isFinite(d)) return "—";
  const r = Math.round(d * 10) / 10;
  return `${r > 0 ? "+" : ""}${r.toFixed(1)}`;
}

/**
 * Market home strip — score + spectrum + spark (Chime Market Appetite).
 */
export function AppetiteStrip({
  appetite,
  loading,
  className,
}: {
  appetite: AppetitePayload | null;
  loading?: boolean;
  className?: string;
}) {
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-[1.25rem] border border-ceyfi-line bg-card px-4 py-4 dark:border-white/10",
          className,
        )}
        role="status"
      >
        <p className="text-sm text-muted-foreground">Loading Market Appetite…</p>
      </div>
    );
  }

  const latest = appetite?.latest ?? null;
  if (!latest) {
    return (
      <div
        className={cn(
          "rounded-[1.25rem] border border-dashed border-ceyfi-line/80 bg-ceyfi-paper/60 px-4 py-3 dark:border-white/15 dark:bg-white/[0.03]",
          className,
        )}
        role="status"
        data-demo-target="market-appetite"
      >
        <p className="text-sm text-muted-foreground">
          Market Appetite not available yet. Demo fixtures load offline; live
          Chime needs appetite-backfill.
        </p>
      </div>
    );
  }

  const band = (latest.band || "neutral") as AppetiteBand;
  const delta1 = appetite?.deltas?.d1 ?? null;
  const history = appetite?.history ?? [];

  return (
    <section
      data-demo-target="market-appetite"
      className={cn(
        "rounded-[1.25rem] border border-ceyfi-line bg-card px-4 py-4 shadow-sm dark:border-white/10",
        className,
      )}
      aria-labelledby="market-appetite-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            id="market-appetite-heading"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          >
            Market Appetite · Chime
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-ceyfi-ink dark:text-white">
              {Math.round(latest.score)}
            </span>
            <AppetiteBandBadge band={band} />
            <span
              className={cn(
                "font-mono text-xs tabular-nums",
                (delta1 ?? 0) > 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : (delta1 ?? 0) < 0
                    ? "text-rose-700 dark:text-rose-400"
                    : "text-muted-foreground",
              )}
            >
              {fmtDelta(delta1)} vs prior session
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
            Session {latest.trade_date}
            {latest.advancers != null && latest.decliners != null
              ? ` · ${latest.advancers}↑ ${latest.decliners}↓`
              : null}
            {` · universe ${latest.universe_n}`}
            {appetite?.days_in_band
              ? ` · ${appetite.days_in_band}d in ${APPETITE_BAND_LABEL[band]}`
              : null}
          </p>
        </div>
        <div className="w-full max-w-[12rem] sm:w-44">
          <AppetiteMiniSpark historyAsc={history} />
        </div>
      </div>
      <AppetiteMeter
        score={latest.score}
        band={band}
        size="md"
        className="mt-4"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-xl text-[11px] leading-relaxed text-muted-foreground">
          {appetite?.disclaimer ??
            "Research composite — not financial advice, not a buy/sell signal."}
        </p>
        <Link
          href="/market/appetite"
          className="shrink-0 text-xs font-medium text-ceyfi-green underline-offset-2 hover:underline"
        >
          Full history →
        </Link>
      </div>
    </section>
  );
}
