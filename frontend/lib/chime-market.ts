/**
 * Ceyfi Market client — talks to Ceyfi backend `/api/market/*`
 * (mock Chime payloads, or live proxy when CHIME_API_BASE is set on the backend).
 */
import { authHeaders } from "@/lib/auth";
import { API_BASE, ApiError } from "@/lib/api";

export type MarketActivity = "quiet" | "active" | "noisy";

export type MarketBar = {
  trade_date: string;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  volume?: number | null;
};

export type MarketWatchItem = {
  symbol: string;
  name?: string | null;
  price?: number | null;
  change_pct?: number | null;
  volume?: number | null;
  alert_count?: number;
  fire_count?: number;
  activity?: MarketActivity;
  /** Close-only series (legacy / fallback). */
  sparkline?: number[];
  /** OHLC bars for Chime-style candle sparklines. */
  spark_bars?: MarketBar[];
  last_fire?: {
    id?: string;
    type?: string;
    fired_at?: string;
    title?: string;
  } | null;
};

export type MarketAlert = {
  id: string;
  symbol: string;
  type: string;
  threshold?: number | null;
  active?: boolean;
  created_at?: string;
};

export type MarketFire = {
  id: string;
  alert_id?: string;
  symbol: string;
  type: string;
  title?: string;
  message?: string;
  price?: number | null;
  fired_at?: string;
  delivery_status?: string;
};

export type MarketFireDepth = {
  status: "still_true" | "cooled_off" | "informational" | string;
  reason: string;
  hours_ago?: number | null;
  threshold?: number | null;
  last_price?: number | null;
  gap_to_threshold?: number | null;
};

export type MarketDisclosure = {
  id?: string | number;
  title?: string;
  category?: string;
  published_at?: string;
  pdf_url?: string | null;
  url?: string | null;
  brief?: string | null;
  brief_status?: string | null;
};

export type MarketPathPoint = {
  date: string;
  close?: number | null;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  volume?: number | null;
  threshold?: number | null;
  is_fire_day?: boolean;
};

export type MarketFireCard = MarketFire & {
  depth?: MarketFireDepth;
  alert?: MarketAlert | null;
  disclosure_snippet?: {
    title?: string;
    brief?: string | null;
    brief_status?: string | null;
    published_at?: string;
  } | null;
  path?: {
    threshold?: number | null;
    fire_date?: string | null;
    closes?: number[];
    bars?: MarketBar[];
    points?: MarketPathPoint[];
  } | null;
};

async function marketRequest<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...authHeaders() },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new ApiError(res.status, text);
  }
  return res.json();
}

export function shortSymbol(symbol: string): string {
  return symbol.replace(/\.(N|X)0000$/i, "");
}

/** Share of liquid cash one share represents — framing only, not advice. */
export function cashSharePct(
  price: number | null | undefined,
  liquidLkr: number | null | undefined,
): number | null {
  if (price == null || liquidLkr == null || liquidLkr <= 0) return null;
  return (price / liquidLkr) * 100;
}

export async function getMarketOverview() {
  return marketRequest<{
    source: string;
    nfa: string;
    persona_blurb?: string;
    watchlist: MarketWatchItem[];
    alerts: MarketAlert[];
    fires: MarketFireCard[];
    focus_fire?: MarketFireCard | null;
    as_of: string;
  }>("/api/market/overview");
}

export async function getMarketWatchlist() {
  return marketRequest<{
    source: string;
    nfa: string;
    persona_blurb?: string;
    items: MarketWatchItem[];
  }>("/api/market/watchlist");
}

export async function getMarketAlerts() {
  return marketRequest<{
    source: string;
    nfa: string;
    items: MarketAlert[];
  }>("/api/market/alerts");
}

export async function getMarketFires() {
  return marketRequest<{
    source: string;
    nfa: string;
    items: MarketFire[];
  }>("/api/market/fires");
}

export async function getMarketFireDetail(fireId: string) {
  return marketRequest<{
    source: string;
    nfa: string;
    fire: MarketFire;
    alert?: MarketAlert | null;
    depth?: MarketFireDepth;
    disclosures?: MarketDisclosure[];
    user_id: string;
    broker_cta: { label: string; hint: string };
  }>(`/api/market/fires/${encodeURIComponent(fireId)}`);
}

export async function getMarketSymbolBars(symbol: string, limit = 60) {
  return marketRequest<{
    source: string;
    nfa: string;
    symbol: string;
    count: number;
    bars: MarketBar[];
    candle_ok: boolean;
    preferred_chart: "candles" | "line" | string;
    disclaimer: string;
  }>(`/api/market/symbols/${encodeURIComponent(symbol)}/bars?limit=${limit}`);
}

export async function getMarketSymbolDisclosures(symbol: string, limit = 5) {
  return marketRequest<{
    source: string;
    nfa: string;
    symbol: string;
    items: MarketDisclosure[];
  }>(
    `/api/market/symbols/${encodeURIComponent(symbol)}/disclosures?limit=${limit}`,
  );
}

export async function getMarketSymbolPath(
  symbol: string,
  opts?: { fireId?: string; limit?: number },
) {
  const params = new URLSearchParams();
  if (opts?.fireId) params.set("fire_id", opts.fireId);
  params.set("limit", String(opts?.limit ?? 60));
  return marketRequest<{
    source: string;
    nfa: string;
    symbol: string;
    threshold?: number | null;
    fire_id?: string | null;
    fire_date?: string | null;
    candle_ok: boolean;
    preferred_chart: "candles" | "line" | string;
    points: MarketPathPoint[];
    disclaimer: string;
  }>(
    `/api/market/symbols/${encodeURIComponent(symbol)}/path?${params.toString()}`,
  );
}
