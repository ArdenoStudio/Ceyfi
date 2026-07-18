"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ActivityBadge } from "@/components/market/ActivityBadge";
import { NfaStrip } from "@/components/market/NfaStrip";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  getMarketWatchlist,
  shortSymbol,
  type MarketWatchItem,
} from "@/lib/chime-market";
import { cn, formatLKR } from "@/lib/utils";

export default function MarketWatchlistPage() {
  const { userId, loading: authLoading } = useCurrentUser();
  const [items, setItems] = useState<MarketWatchItem[]>([]);
  const [nfa, setNfa] = useState("");
  const [blurb, setBlurb] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getMarketWatchlist();
        if (cancelled) return;
        setItems(data.items ?? []);
        setNfa(data.nfa);
        setBlurb(data.persona_blurb ?? "");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Market"
        title="Watchlist"
        description={
          blurb ||
          "Symbols mirrored from Chime. Open a name for path, candles, and filings."
        }
        action={
          <Link
            href="/market"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to Market
          </Link>
        }
      />
      <NfaStrip text={nfa || undefined} />
      <div className="overflow-hidden rounded-[1.25rem] border border-ceyfi-line bg-card dark:border-white/10">
        <div className="hidden grid-cols-[minmax(0,1.2fr)_5.5rem_4.5rem_4.5rem_minmax(0,1fr)] gap-2 border-b border-ceyfi-line px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:grid dark:border-white/10">
          <span>Symbol</span>
          <span className="text-right">Price</span>
          <span className="text-right">Chg</span>
          <span className="text-right">Alerts</span>
          <span>Last fire</span>
        </div>
        {loading ? (
          <p className="px-4 py-8 text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground">
            No watched symbols.
          </p>
        ) : (
          <ul className="divide-y divide-ceyfi-line/70 dark:divide-white/10">
            {items.map((row) => (
              <li key={row.symbol}>
                <Link
                  href={`/market/symbol/${encodeURIComponent(row.symbol)}`}
                  className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-ceyfi-sprout/30 sm:grid-cols-[minmax(0,1.2fr)_5.5rem_4.5rem_4.5rem_minmax(0,1fr)] sm:items-center dark:hover:bg-white/[0.04]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-semibold">
                        {shortSymbol(row.symbol)}
                      </p>
                      <ActivityBadge activity={row.activity} />
                    </div>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {row.name ?? row.symbol}
                    </p>
                  </div>
                  <p className="font-mono text-sm tabular-nums sm:text-right">
                    {row.price != null ? formatLKR(row.price) : "—"}
                  </p>
                  <p className="font-mono text-sm tabular-nums sm:text-right">
                    {row.change_pct != null
                      ? `${row.change_pct > 0 ? "+" : ""}${row.change_pct.toFixed(2)}%`
                      : "—"}
                  </p>
                  <p className="font-mono text-sm tabular-nums sm:text-right">
                    {row.alert_count ?? 0}
                  </p>
                  <div className="min-w-0 text-[12px] text-muted-foreground">
                    {row.last_fire ? (
                      <>
                        <p className="truncate text-foreground/90">
                          {row.last_fire.title ?? row.last_fire.type}
                        </p>
                        <p>{row.last_fire.fired_at?.slice(0, 10)}</p>
                      </>
                    ) : (
                      <p>No recent fires</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
