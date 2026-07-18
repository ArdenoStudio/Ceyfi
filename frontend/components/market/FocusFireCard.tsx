"use client";

import Link from "next/link";

import { CandleSpark } from "@/components/market/CandleSpark";
import { buttonVariants } from "@/components/ui/button";
import {
  cashSharePct,
  shortSymbol,
  type MarketFireCard,
} from "@/lib/chime-market";
import { cn, formatLKR } from "@/lib/utils";

function statusLabel(status?: string) {
  if (status === "still_true") return "Still true";
  if (status === "cooled_off") return "Cooled off";
  return "Informational";
}

function statusStyles(status?: string) {
  if (status === "still_true") {
    return "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200";
  }
  if (status === "cooled_off") {
    return "bg-ceyfi-canvas text-ceyfi-muted dark:bg-white/5 dark:text-white/55";
  }
  return "bg-ceyfi-sprout text-ceyfi-green dark:bg-ceyfi-green/15 dark:text-ceyfi-mint";
}

export function FocusFireCard({
  fire,
  liquidLkr,
  selected,
  onSelect,
}: {
  fire: MarketFireCard;
  liquidLkr: number | null;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const depth = fire.depth;
  const price = depth?.last_price ?? fire.price;
  const share = cashSharePct(price, liquidLkr);
  const bars =
    fire.path?.bars ??
    (fire.path?.points ?? []).map((p) => ({
      trade_date: p.date ?? "",
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }));
  const closes = fire.path?.closes ?? [];
  const threshold = depth?.threshold;

  return (
    <section
      data-demo-target="market-focus-fire"
      className={cn(
        "rounded-[1.35rem] border bg-card p-4 shadow-sm transition-colors dark:border-white/10",
        selected
          ? "border-ceyfi-green/50 ring-2 ring-ceyfi-green/15"
          : "border-ceyfi-line",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left"
        aria-pressed={selected}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Focus fire
              </p>
              {depth ? (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                    statusStyles(depth.status),
                  )}
                >
                  {statusLabel(depth.status)}
                </span>
              ) : null}
            </div>
            <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">
              {shortSymbol(fire.symbol)} · {fire.title ?? fire.type}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {depth?.reason ?? fire.message}
              {depth?.hours_ago != null
                ? ` · ${
                    depth.hours_ago < 24
                      ? `${depth.hours_ago.toFixed(1)}h ago`
                      : `${(depth.hours_ago / 24).toFixed(1)}d ago`
                  }`
                : ""}
            </p>
            <dl className="mt-3 flex flex-wrap gap-3 text-[12px]">
              {threshold != null && price != null ? (
                <div className="rounded-lg border border-ceyfi-line/70 px-2.5 py-1.5 font-mono tabular-nums dark:border-white/10">
                  <span className="text-muted-foreground">Alert </span>
                  {formatLKR(threshold)}
                  <span className="text-muted-foreground"> → </span>
                  {formatLKR(price)}
                  {depth?.gap_to_threshold != null ? (
                    <span className="text-muted-foreground">
                      {" "}
                      ({depth.gap_to_threshold > 0 ? "+" : ""}
                      {depth.gap_to_threshold.toFixed(2)})
                    </span>
                  ) : null}
                </div>
              ) : null}
              {share != null ? (
                <div className="rounded-lg border border-ceyfi-line/70 px-2.5 py-1.5 dark:border-white/10">
                  ~{share < 0.01 ? share.toFixed(3) : share.toFixed(2)}% of liquid
                </div>
              ) : null}
              {fire.disclosure_snippet?.title ? (
                <div className="max-w-md truncate rounded-lg border border-ceyfi-line/70 px-2.5 py-1.5 dark:border-white/10">
                  {fire.disclosure_snippet.title}
                  {fire.disclosure_snippet.brief
                    ? ` — ${fire.disclosure_snippet.brief}`
                    : ""}
                </div>
              ) : null}
            </dl>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
            <CandleSpark
              bars={bars}
              closes={closes}
              width={132}
              height={48}
              maxCandles={22}
            />
            {threshold != null ? (
              <p className="text-[10px] text-muted-foreground">
                Candles · alert {formatLKR(threshold)}
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground">Recent candles</p>
            )}
          </div>
        </div>
      </button>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/market/alerts/${encodeURIComponent(fire.id)}`}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Open detail
        </Link>
        <Link
          href={`/market/symbol/${encodeURIComponent(fire.symbol)}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Symbol view
        </Link>
      </div>
    </section>
  );
}
