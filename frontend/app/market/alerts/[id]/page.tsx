"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { CashContextCard } from "@/components/market/CashContextCard";
import { DisclosureList } from "@/components/market/DisclosureList";
import { NfaStrip } from "@/components/market/NfaStrip";
import { PathToAlertChart } from "@/components/market/PathToAlertChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getFinancialSnapshot } from "@/lib/api";
import {
  getMarketFireDetail,
  getMarketSymbolPath,
  shortSymbol,
  type MarketDisclosure,
  type MarketFire,
  type MarketFireDepth,
  type MarketPathPoint,
} from "@/lib/chime-market";
import { cn, formatLKR } from "@/lib/utils";

function statusStyles(status?: string) {
  if (status === "still_true") {
    return "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200";
  }
  if (status === "cooled_off") {
    return "bg-ceyfi-canvas text-ceyfi-muted dark:bg-white/5 dark:text-white/55";
  }
  return "bg-ceyfi-sprout text-ceyfi-green dark:bg-ceyfi-green/15 dark:text-ceyfi-mint";
}

export default function MarketAlertDetailPage() {
  const params = useParams<{ id: string }>();
  const fireId = decodeURIComponent(params.id ?? "");
  const { userId, loading: authLoading } = useCurrentUser();
  const [fire, setFire] = useState<MarketFire | null>(null);
  const [depth, setDepth] = useState<MarketFireDepth | null>(null);
  const [disclosures, setDisclosures] = useState<MarketDisclosure[]>([]);
  const [pathPoints, setPathPoints] = useState<MarketPathPoint[]>([]);
  const [candleOk, setCandleOk] = useState(false);
  const [preferredChart, setPreferredChart] = useState("path");
  const [nfa, setNfa] = useState("");
  const [brokerHint, setBrokerHint] = useState("");
  const [liquid, setLiquid] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !userId || !fireId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [detail, snap] = await Promise.all([
          getMarketFireDetail(fireId),
          getFinancialSnapshot(userId).catch(() => null),
        ]);
        if (cancelled) return;
        setFire(detail.fire);
        setDepth(detail.depth ?? null);
        setDisclosures(detail.disclosures ?? []);
        setNfa(detail.nfa);
        setBrokerHint(detail.broker_cta?.hint ?? "");
        if (snap) {
          setLiquid(
            Number(snap.current_balance ?? snap.balance_lkr ?? snap.savings_balance) ||
              null,
          );
        }
        if (detail.fire?.symbol) {
          const path = await getMarketSymbolPath(detail.fire.symbol, {
            fireId,
            limit: 60,
          }).catch(() => null);
          if (!cancelled && path) {
            setPathPoints(path.points ?? []);
            setCandleOk(Boolean(path.candle_ok));
            setPreferredChart(path.preferred_chart || "path");
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Fire not found");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, fireId]);

  const statusLabel =
    depth?.status === "still_true"
      ? "Still true"
      : depth?.status === "cooled_off"
        ? "Cooled off"
        : "Informational";

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Alert fire"
        title={
          fire
            ? `${shortSymbol(fire.symbol || "")} · ${fire.type}`
            : "Alert detail"
        }
        description="What moved (Chime) + whether your rupees are ready (Ceyfi). No order is placed here."
        action={
          <div className="flex flex-wrap gap-2">
            {fire?.symbol ? (
              <Link
                href={`/market/symbol/${encodeURIComponent(fire.symbol)}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Symbol view
              </Link>
            ) : null}
            <Link
              href="/market/alerts"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              All alerts
            </Link>
          </div>
        }
      />
      <NfaStrip text={nfa || undefined} />

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.25rem] border border-ceyfi-line bg-card p-5 dark:border-white/10">
          {loading || !fire ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Market signal
                </p>
                {depth ? (
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                      statusStyles(depth.status),
                    )}
                  >
                    {statusLabel}
                  </span>
                ) : null}
              </div>
              <h2 className="font-heading text-xl font-semibold">
                {fire.title ?? "Alert fired"}
              </h2>
              <p className="text-sm leading-relaxed text-foreground/90">
                {fire.message}
              </p>
              {depth?.reason ? (
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {depth.reason}
                  {depth.hours_ago != null
                    ? ` · ${depth.hours_ago < 24 ? `${depth.hours_ago.toFixed(1)}h ago` : `${(depth.hours_ago / 24).toFixed(1)}d ago`}`
                    : ""}
                </p>
              ) : null}
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border border-ceyfi-line/70 px-3 py-2 dark:border-white/10">
                  <dt className="text-[11px] text-muted-foreground">Symbol</dt>
                  <dd className="font-mono font-semibold">{fire.symbol}</dd>
                </div>
                <div className="rounded-lg border border-ceyfi-line/70 px-3 py-2 dark:border-white/10">
                  <dt className="text-[11px] text-muted-foreground">Last price</dt>
                  <dd className="font-mono tabular-nums">
                    {(depth?.last_price ?? fire.price) != null
                      ? formatLKR(Number(depth?.last_price ?? fire.price))
                      : "—"}
                  </dd>
                </div>
                <div className="rounded-lg border border-ceyfi-line/70 px-3 py-2 dark:border-white/10">
                  <dt className="text-[11px] text-muted-foreground">Threshold</dt>
                  <dd className="font-mono tabular-nums">
                    {depth?.threshold != null
                      ? formatLKR(depth.threshold)
                      : "—"}
                  </dd>
                </div>
                <div className="rounded-lg border border-ceyfi-line/70 px-3 py-2 dark:border-white/10">
                  <dt className="text-[11px] text-muted-foreground">Gap</dt>
                  <dd className="font-mono tabular-nums">
                    {depth?.gap_to_threshold != null
                      ? `${depth.gap_to_threshold > 0 ? "+" : ""}${depth.gap_to_threshold.toFixed(2)}`
                      : "—"}
                  </dd>
                </div>
              </dl>
              <p className="text-[11px] text-muted-foreground">
                Fired {fire.fired_at?.replace("T", " ").replace("Z", " UTC")}
              </p>
            </div>
          )}
        </section>

        <div className="space-y-4">
          <CashContextCard
            liquidLkr={liquid}
            signalPrice={depth?.last_price ?? fire?.price}
            loading={loading}
          />
          <section className="rounded-[1.25rem] border border-dashed border-ceyfi-line bg-ceyfi-paper/50 p-4 dark:border-white/15 dark:bg-white/[0.03]">
            <p className="text-sm font-medium text-ceyfi-ink dark:text-white">
              Ready to act?
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              {brokerHint ||
                "Ceyfi does not place CSE orders. Use your licensed stockbroker."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/wallet"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Review wallet
              </Link>
              <span
                data-demo-target="broker-cta"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "pointer-events-none inline-flex items-center gap-1.5 opacity-70",
                )}
                aria-disabled
              >
                Open my broker
                <ExternalLink className="size-3.5" aria-hidden />
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Broker handoff is Phase 4 with a licensed partner — button stays
              disabled on purpose. No Buy.
            </p>
          </section>
        </div>
      </div>

      {pathPoints.length > 0 ? (
        <PathToAlertChart
          points={pathPoints}
          candleOk={candleOk}
          preferredChart={preferredChart}
          symbolLabel={fire ? shortSymbol(fire.symbol) : undefined}
        />
      ) : null}

      {(fire?.type === "disclosure" || disclosures.length > 0) && (
        <section className="rounded-[1.25rem] border border-ceyfi-line bg-card p-5 dark:border-white/10">
          <h2 className="mb-3 font-heading text-lg font-semibold">
            Filings &amp; briefs
          </h2>
          <DisclosureList items={disclosures} />
        </section>
      )}
    </div>
  );
}
