"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { DisclosureList } from "@/components/market/DisclosureList";
import { NfaStrip } from "@/components/market/NfaStrip";
import { PathToAlertChart } from "@/components/market/PathToAlertChart";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  getMarketSymbolBars,
  getMarketSymbolDisclosures,
  getMarketSymbolPath,
  getMarketWatchlist,
  shortSymbol,
  type MarketDisclosure,
  type MarketPathPoint,
  type MarketWatchItem,
} from "@/lib/chime-market";
import { cn, formatLKR } from "@/lib/utils";

export default function MarketSymbolPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = decodeURIComponent(params.symbol ?? "").toUpperCase();
  const { userId, loading: authLoading } = useCurrentUser();
  const [row, setRow] = useState<MarketWatchItem | null>(null);
  const [points, setPoints] = useState<MarketPathPoint[]>([]);
  const [candleOk, setCandleOk] = useState(false);
  const [preferredChart, setPreferredChart] = useState("candles");
  const [disclosures, setDisclosures] = useState<MarketDisclosure[]>([]);
  const [nfa, setNfa] = useState("");
  const [source, setSource] = useState("mock");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !userId || !symbol) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [watch, path, discs, bars] = await Promise.all([
          getMarketWatchlist().catch(() => null),
          getMarketSymbolPath(symbol, { limit: 80 }),
          getMarketSymbolDisclosures(symbol, 6),
          getMarketSymbolBars(symbol, 80).catch(() => null),
        ]);
        if (cancelled) return;
        const hit =
          watch?.items?.find((w) => w.symbol.toUpperCase() === symbol) ?? null;
        setRow(hit);
        setPoints(path.points ?? []);
        setCandleOk(Boolean(path.candle_ok ?? bars?.candle_ok));
        setPreferredChart(
          path.preferred_chart || bars?.preferred_chart || "candles",
        );
        setDisclosures(discs.items ?? []);
        setNfa(path.nfa || discs.nfa);
        setSource(path.source || bars?.source || "mock");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Symbol unavailable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, symbol]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Market · symbol"
        title={shortSymbol(symbol)}
        description={
          row?.name ||
          "Daily path and filings via Chime — research context inside Ceyfi, not a broker desk."
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/market/watchlist"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Watchlist
            </Link>
            <Link
              href="/market"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Market home
            </Link>
          </div>
        }
        meta={
          <p className="text-xs text-muted-foreground">
            Data source: {source === "chime" ? "Live Chime" : "Demo mock"} ·{" "}
            {row?.price != null ? formatLKR(row.price) : "—"}
            {row?.change_pct != null
              ? ` (${row.change_pct > 0 ? "+" : ""}${row.change_pct.toFixed(2)}%)`
              : ""}
          </p>
        }
      />
      <NfaStrip text={nfa || undefined} />

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading chart…</p>
      ) : (
        <PathToAlertChart
          points={points}
          candleOk={candleOk}
          preferredChart={preferredChart}
          symbolLabel={shortSymbol(symbol)}
        />
      )}

      <section className="rounded-[1.25rem] border border-ceyfi-line bg-card p-5 dark:border-white/10">
        <h2 className="mb-1 font-heading text-lg font-semibold">
          Filings &amp; PDF briefs
        </h2>
        <p className="mb-3 text-[12px] text-muted-foreground">
          Titles and Chime-extracted briefs from CSE disclosures. Prefer PDF
          when linked. Not advice.
        </p>
        <DisclosureList items={disclosures} />
      </section>
    </div>
  );
}
