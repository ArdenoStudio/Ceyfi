"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  AppetiteBandBadge,
  AppetiteMeter,
} from "@/components/market/AppetiteMeter";
import { NfaStrip } from "@/components/market/NfaStrip";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  APPETITE_BAND_LABEL,
  getMarketAppetite,
  type AppetiteBand,
  type AppetiteDay,
  type AppetitePayload,
} from "@/lib/chime-market";
import { cn } from "@/lib/utils";

function ComponentBar({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  const v =
    value != null && Number.isFinite(value)
      ? Math.max(0, Math.min(100, value))
      : null;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">
          {v != null ? v.toFixed(0) : "—"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ceyfi-canvas dark:bg-white/10">
        <div
          className="h-full rounded-full bg-ceyfi-green/80 transition-[width] duration-500"
          style={{ width: `${v ?? 0}%` }}
        />
      </div>
    </div>
  );
}

function HistoryChart({ history }: { history: AppetiteDay[] }) {
  const series = history.slice(-90);
  if (series.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">Not enough history yet.</p>
    );
  }
  const scores = series.map((d) => d.score);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const span = max !== min ? max - min : 1;
  const w = 640;
  const h = 160;
  const pad = 8;
  const pts = series
    .map((d, i) => {
      const x = pad + (i / (series.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (d.score - min) / span) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = series[series.length - 1]!;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-40 w-full"
      role="img"
      aria-label={`Appetite history, ${series.length} sessions, latest ${Math.round(last.score)}`}
    >
      <polyline
        fill="none"
        stroke="#059669"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
}

function BandTracker({ history }: { history: AppetiteDay[] }) {
  const series = history.slice(-60);
  if (!series.length) return null;
  return (
    <div
      className="flex h-3 w-full overflow-hidden rounded-md border border-ceyfi-line/70 dark:border-white/15"
      role="img"
      aria-label="Band chronology, last sessions"
    >
      {series.map((d) => (
        <div
          key={d.trade_date}
          className="h-full flex-1"
          style={{
            backgroundColor:
              d.band === "extreme_caution"
                ? "#f0b4a0"
                : d.band === "caution"
                  ? "#f0d39a"
                  : d.band === "neutral"
                    ? "#c8cdd8"
                    : d.band === "appetite"
                      ? "#a8d9c4"
                      : "#7fc9a8",
          }}
          title={`${d.trade_date}: ${APPETITE_BAND_LABEL[d.band as AppetiteBand] ?? d.band}`}
        />
      ))}
    </div>
  );
}

export default function MarketAppetitePage() {
  const { userId, loading: authLoading } = useCurrentUser();
  const [data, setData] = useState<AppetitePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await getMarketAppetite(90);
        if (!cancelled) setData(payload);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Appetite unavailable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  const latest = data?.latest ?? null;
  const band = (latest?.band || "neutral") as AppetiteBand;
  const components = useMemo(() => latest?.components ?? null, [latest]);

  return (
    <div
      data-module="market-appetite"
      className="mx-auto max-w-[900px] space-y-4 p-4 sm:p-6 lg:p-8"
    >
      <PageHeader
        eyebrow="Market · Market Appetite"
        title="CSE market appetite"
        description="Session breadth composite from Chime — how hot the tape looks, not a tip."
        action={
          <Link
            href="/market"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ArrowLeft className="mr-1.5 size-4" />
            Back to Market
          </Link>
        }
      />

      <NfaStrip text={data?.nfa || data?.disclaimer || undefined} />

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : latest ? (
        <>
          <section className="rounded-[1.25rem] border border-ceyfi-line bg-card p-5 dark:border-white/10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Headline session
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-4xl font-semibold tabular-nums">
                    {Math.round(latest.score)}
                  </span>
                  <AppetiteBandBadge band={band} />
                </div>
                <p className="mt-1 font-mono text-[12px] text-muted-foreground">
                  {latest.trade_date}
                  {data?.deltas?.d1 != null
                    ? ` · ${data.deltas.d1 > 0 ? "+" : ""}${data.deltas.d1.toFixed(1)} d1`
                    : ""}
                  {data?.days_in_band
                    ? ` · ${data.days_in_band}d in band`
                    : ""}
                </p>
              </div>
              <span className="rounded-md bg-ceyfi-canvas px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ceyfi-muted dark:bg-white/5">
                {data?.source === "chime" ? "Live Chime" : "Demo data"}
              </span>
            </div>
            <AppetiteMeter
              score={latest.score}
              band={band}
              size="lg"
              className="mt-5"
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.25rem] border border-ceyfi-line bg-card p-4 dark:border-white/10">
              <h2 className="font-heading text-base font-semibold">
                Components
              </h2>
              <div className="mt-3 space-y-3">
                <ComponentBar label="Breadth" value={components?.breadth} />
                <ComponentBar label="Intensity" value={components?.intensity} />
                <ComponentBar label="Index day" value={components?.index} />
                <ComponentBar
                  label="Participation"
                  value={components?.participation}
                />
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-ceyfi-line bg-card p-4 dark:border-white/10">
              <h2 className="font-heading text-base font-semibold">
                Session context
              </h2>
              <dl className="mt-3 space-y-2 font-mono text-[13px] tabular-nums">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Advancers</dt>
                  <dd>{latest.advancers ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Decliners</dt>
                  <dd>{latest.decliners ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Universe</dt>
                  <dd>{latest.universe_n}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">ASPI day</dt>
                  <dd>
                    {latest.aspi_change_pct != null
                      ? `${latest.aspi_change_pct > 0 ? "+" : ""}${latest.aspi_change_pct.toFixed(2)}%`
                      : "n/a"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Δ 5 sessions</dt>
                  <dd>
                    {data?.deltas?.d5 != null
                      ? `${data.deltas.d5 > 0 ? "+" : ""}${data.deltas.d5.toFixed(1)}`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="rounded-[1.25rem] border border-ceyfi-line bg-card p-4 dark:border-white/10">
            <h2 className="font-heading text-base font-semibold">
              History (recent sessions)
            </h2>
            <div className="mt-3">
              <HistoryChart history={data?.history ?? []} />
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Band chronology
            </p>
            <div className="mt-2">
              <BandTracker history={data?.history ?? []} />
            </div>
          </section>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No appetite rows yet.</p>
      )}
    </div>
  );
}
