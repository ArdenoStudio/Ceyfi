"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, LineChart, List } from "lucide-react";

import { ActivityBadge } from "@/components/market/ActivityBadge";
import { AppetiteStrip } from "@/components/market/AppetiteStrip";
import { CashContextCard } from "@/components/market/CashContextCard";
import { FocusFireCard } from "@/components/market/FocusFireCard";
import { NfaStrip } from "@/components/market/NfaStrip";
import { CandleSpark } from "@/components/market/CandleSpark";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getFinancialSnapshot } from "@/lib/api";
import {
  cashSharePct,
  getMarketOverview,
  shortSymbol,
  type AppetitePayload,
  type MarketAlert,
  type MarketFireCard,
  type MarketWatchItem,
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

type Selection =
  | { kind: "fire"; id: string }
  | { kind: "watch"; symbol: string }
  | null;

export default function MarketPage() {
  const { userId, loading: authLoading } = useCurrentUser();
  const [watch, setWatch] = useState<MarketWatchItem[]>([]);
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [fires, setFires] = useState<MarketFireCard[]>([]);
  const [focus, setFocus] = useState<MarketFireCard | null>(null);
  const [appetite, setAppetite] = useState<AppetitePayload | null>(null);
  const [nfa, setNfa] = useState<string>("");
  const [blurb, setBlurb] = useState<string>("");
  const [source, setSource] = useState<string>("mock");
  const [liquid, setLiquid] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);

  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [overview, snap] = await Promise.all([
          getMarketOverview(),
          getFinancialSnapshot(userId).catch(() => null),
        ]);
        if (cancelled) return;
        setWatch(overview.watchlist ?? []);
        setAlerts(overview.alerts ?? []);
        setFires(overview.fires ?? []);
        setFocus(overview.focus_fire ?? overview.fires?.[0] ?? null);
        setAppetite(overview.appetite ?? null);
        setNfa(overview.nfa);
        setBlurb(overview.persona_blurb ?? "");
        setSource(overview.source);
        if (overview.focus_fire?.id || overview.fires?.[0]?.id) {
          setSelection({
            kind: "fire",
            id: String(overview.focus_fire?.id ?? overview.fires?.[0]?.id),
          });
        }
        if (snap) {
          setLiquid(
            Number(snap.current_balance ?? snap.balance_lkr ?? snap.savings_balance) ||
              null,
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Market unavailable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  const selectedSignalPrice = useMemo(() => {
    if (selection?.kind === "fire") {
      const f = fires.find((x) => String(x.id) === selection.id) ?? focus;
      return f?.depth?.last_price ?? f?.price ?? null;
    }
    if (selection?.kind === "watch") {
      const w = watch.find((x) => x.symbol === selection.symbol);
      return w?.price ?? null;
    }
    return focus?.depth?.last_price ?? focus?.price ?? null;
  }, [selection, fires, watch, focus]);

  const selectedLabel = useMemo(() => {
    if (selection?.kind === "fire") {
      const f = fires.find((x) => String(x.id) === selection.id) ?? focus;
      if (!f) return undefined;
      const share = cashSharePct(f.depth?.last_price ?? f.price, liquid);
      return share != null
        ? `Framing for ${shortSymbol(f.symbol)} fire — ~${share < 0.01 ? share.toFixed(3) : share.toFixed(2)}% of liquid. Not a buy signal.`
        : `Framing for ${shortSymbol(f.symbol)} fire — not a buy signal.`;
    }
    if (selection?.kind === "watch") {
      const w = watch.find((x) => x.symbol === selection.symbol);
      if (!w) return undefined;
      return `Framing for watched ${shortSymbol(w.symbol)} — one share vs liquid cash. Not a buy signal.`;
    }
    return undefined;
  }, [selection, fires, watch, focus, liquid]);

  return (
    <div
      data-module="market"
      className="mx-auto max-w-[1400px] space-y-4 p-4 sm:p-6 lg:p-8"
    >
      <PageHeader
        eyebrow="Market · powered by Chime"
        title="CSE watch & alerts"
        description={
          blurb ||
          "See names you care about and recent Chime pings next to your Ceyfi cash. You still trade with your licensed broker."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                source === "chime"
                  ? "bg-ceyfi-sprout text-ceyfi-green"
                  : "bg-ceyfi-canvas text-ceyfi-muted",
              )}
            >
              {source === "chime" ? "Live Chime" : "Demo data"}
            </span>
            <Link
              href="/market/watchlist"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <List className="mr-1.5 size-4" />
              Watchlist
            </Link>
            <Link
              href="/market/alerts"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <Bell className="mr-1.5 size-4" />
              Alerts
            </Link>
          </div>
        }
      />

      <NfaStrip text={nfa || undefined} />

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <AppetiteStrip appetite={appetite} loading={loading} />

      {!loading && focus ? (
        <FocusFireCard
          fire={focus}
          liquidLkr={liquid}
          selected={selection?.kind === "fire" && selection.id === String(focus.id)}
          onSelect={() => setSelection({ kind: "fire", id: String(focus.id) })}
        />
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.75fr)]">
        <section className="space-y-4">
          <div className="rounded-[1.25rem] border border-ceyfi-line bg-card p-4 dark:border-white/10">
            <div className="mb-3 flex items-center gap-2">
              <LineChart className="size-4 text-ceyfi-green" aria-hidden />
              <h2 className="font-heading text-lg font-semibold">Watchlist</h2>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : watch.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No watched symbols yet. Alerts attach to your Chime watchlist.
              </p>
            ) : (
              <ul className="divide-y divide-ceyfi-line/70 dark:divide-white/10">
                {watch.map((row) => {
                  const selected =
                    selection?.kind === "watch" && selection.symbol === row.symbol;
                  return (
                    <li key={row.symbol}>
                      <div
                        className={cn(
                          "flex items-center gap-3 py-2.5 transition-colors",
                          selected && "bg-ceyfi-sprout/30 dark:bg-white/[0.04]",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setSelection({ kind: "watch", symbol: row.symbol })
                          }
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          aria-pressed={selected}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-mono text-sm font-semibold">
                                {shortSymbol(row.symbol)}
                              </p>
                              <ActivityBadge activity={row.activity} />
                            </div>
                            <p className="truncate text-[12px] text-muted-foreground">
                              {row.name ?? row.symbol}
                              {row.alert_count
                                ? ` · ${row.alert_count} alert${row.alert_count === 1 ? "" : "s"}`
                                : ""}
                            </p>
                          </div>
                          <CandleSpark
                            bars={row.spark_bars}
                            closes={row.sparkline}
                            width={80}
                            height={30}
                            maxCandles={16}
                          />
                          <div className="w-[4.5rem] shrink-0 text-right">
                            <p className="font-mono text-sm tabular-nums">
                              {row.price != null ? formatLKR(row.price) : "—"}
                            </p>
                            <p
                              className={
                                (row.change_pct ?? 0) >= 0
                                  ? "font-mono text-[11px] text-emerald-700 dark:text-emerald-400"
                                  : "font-mono text-[11px] text-red-600 dark:text-red-400"
                              }
                            >
                              {row.change_pct != null
                                ? `${row.change_pct > 0 ? "+" : ""}${row.change_pct.toFixed(2)}%`
                                : "—"}
                            </p>
                          </div>
                        </button>
                        <Link
                          href={`/market/symbol/${encodeURIComponent(row.symbol)}`}
                          className="shrink-0 text-[11px] font-medium text-ceyfi-green underline-offset-2 hover:underline"
                        >
                          Open
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-[1.25rem] border border-ceyfi-line bg-card p-4 dark:border-white/10">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-heading text-lg font-semibold">Recent fires</h2>
              <Link
                href="/market/alerts"
                className="text-xs font-medium text-ceyfi-green underline-offset-2 hover:underline"
              >
                All alerts
              </Link>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : fires.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent Chime fires. Active rules: {alerts.length}.
              </p>
            ) : (
              <ul className="space-y-2">
                {fires.map((f, idx) => {
                  const selected =
                    selection?.kind === "fire" && selection.id === String(f.id);
                  const depth = f.depth;
                  const price = depth?.last_price ?? f.price;
                  const share = cashSharePct(price, liquid);
                  return (
                    <li key={f.id}>
                      <div
                        className={cn(
                          "rounded-xl border px-3 py-2.5 transition-colors dark:border-white/10",
                          selected
                            ? "border-ceyfi-green/45 bg-ceyfi-sprout/35 dark:bg-white/[0.05]"
                            : "border-ceyfi-line/70 hover:bg-ceyfi-sprout/25 dark:hover:bg-white/[0.03]",
                        )}
                      >
                        <button
                          type="button"
                          data-demo-target={idx === 0 ? "market-fire" : undefined}
                          onClick={() =>
                            setSelection({ kind: "fire", id: String(f.id) })
                          }
                          className="w-full text-left"
                          aria-pressed={selected}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm font-semibold">
                                {shortSymbol(f.symbol || "")}
                              </span>
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
                            <span className="text-[11px] text-muted-foreground">
                              {f.fired_at?.slice(0, 16)?.replace("T", " ") ?? ""}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[13px] text-foreground/90">
                            {f.title ?? f.message ?? f.type}
                          </p>
                          <p className="mt-1 text-[12px] text-muted-foreground">
                            {depth?.threshold != null && price != null
                              ? `${formatLKR(depth.threshold)} → ${formatLKR(price)}${
                                  depth.gap_to_threshold != null
                                    ? ` · ${depth.gap_to_threshold > 0 ? "+" : ""}${depth.gap_to_threshold.toFixed(2)}`
                                    : ""
                                }`
                              : depth?.reason ?? ""}
                            {share != null
                              ? ` · ~${share < 0.01 ? share.toFixed(3) : share.toFixed(2)}% of liquid`
                              : ""}
                          </p>
                          {f.disclosure_snippet?.brief ||
                          f.disclosure_snippet?.title ? (
                            <p className="mt-1 line-clamp-2 text-[12px] text-foreground/80">
                              {f.disclosure_snippet.title}
                              {f.disclosure_snippet.brief
                                ? ` — ${f.disclosure_snippet.brief}`
                                : ""}
                            </p>
                          ) : null}
                        </button>
                        <Link
                          href={`/market/alerts/${encodeURIComponent(f.id)}`}
                          className="mt-2 inline-flex text-[12px] font-medium text-ceyfi-green underline-offset-2 hover:underline"
                        >
                          Open detail
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <CashContextCard
          liquidLkr={liquid}
          signalPrice={selectedSignalPrice}
          label={selectedLabel}
          loading={loading}
        />
      </div>
    </div>
  );
}
