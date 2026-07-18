/**
 * Daily OHLC helpers for candlestick charts (ported from Chime).
 * Client-safe sanitizers — no server imports.
 */

import type { MarketBar } from "@/lib/chime-market";

export type DailyBarPoint = {
  trade_date: string;
  /** Null when CSE omitted open — chart colors vs previous close. */
  open: number | null;
  high: number;
  low: number;
  close: number;
  volume: number | null;
};

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * Normalize a bar into a chartable candle.
 * Keep ``open`` null when missing (CSE often omits it). High/low fall back
 * to close so wicks still render.
 */
export function normalizeDailyBar(row: {
  trade_date?: unknown;
  date?: unknown;
  open?: unknown;
  high?: unknown;
  low?: unknown;
  price?: unknown;
  close?: unknown;
  volume?: unknown;
}): DailyBarPoint | null {
  const rawDate = row.trade_date ?? row.date;
  let tradeDate: string | null = null;
  if (rawDate instanceof Date) {
    tradeDate = rawDate.toISOString().slice(0, 10);
  } else if (typeof rawDate === "string") {
    tradeDate = rawDate.slice(0, 10);
  }
  if (!tradeDate || !/^\d{4}-\d{2}-\d{2}$/.test(tradeDate)) {
    // Synthetic / unlabeled spark bars — keep a stable key.
    if (typeof rawDate === "string" && rawDate.length > 0) {
      tradeDate = rawDate.slice(0, 16);
    } else {
      tradeDate = "bar";
    }
  }

  const close = toFiniteNumber(row.close ?? row.price);
  if (close == null || close <= 0) return null;

  const openRaw = toFiniteNumber(row.open);
  const open = openRaw != null && openRaw > 0 ? openRaw : null;
  let high = toFiniteNumber(row.high);
  let low = toFiniteNumber(row.low);
  if (high == null || high <= 0) high = close;
  if (low == null || low <= 0) low = close;
  const openForBound = open ?? close;
  high = Math.max(high, openForBound, close);
  low = Math.min(low, openForBound, close);

  return {
    trade_date: tradeDate,
    open,
    high,
    low,
    close,
    volume: toFiniteNumber(row.volume),
  };
}

export function marketBarsToDaily(bars: MarketBar[]): DailyBarPoint[] {
  const out: DailyBarPoint[] = [];
  for (const b of bars) {
    const n = normalizeDailyBar(b);
    if (n) out.push(n);
  }
  return out;
}

/** Body open for painting: real open, else previous close (CSE often nulls open). */
export function candleBodyOpen(bars: DailyBarPoint[], index: number): number {
  const b = bars[index];
  if (!b) return 0;
  if (b.open != null && b.open > 0) return b.open;
  if (index > 0) {
    const prev = bars[index - 1]?.close;
    if (prev != null && prev > 0) return prev;
  }
  return b.close;
}

/**
 * Downsample dense daily series into fewer OHLC candles for readable charts.
 * CSE 1Y ≈ 240 sessions — rendering all as 2px sticks looks like a barcode.
 */
export function aggregateBarsForDisplay(
  bars: DailyBarPoint[],
  maxCandles = 72,
): DailyBarPoint[] {
  if (bars.length <= maxCandles) return bars;
  const chunk = Math.ceil(bars.length / maxCandles);
  const out: DailyBarPoint[] = [];
  for (let i = 0; i < bars.length; i += chunk) {
    const slice = bars.slice(i, i + chunk);
    if (slice.length === 0) continue;
    const first = slice[0]!;
    const last = slice[slice.length - 1]!;
    const open = first.open ?? first.close;
    let high = -Infinity;
    let low = Infinity;
    let vol: number | null = null;
    for (const b of slice) {
      if (b.high > high) high = b.high;
      if (b.low < low) low = b.low;
      if (b.volume != null) vol = (vol ?? 0) + b.volume;
    }
    if (!Number.isFinite(high) || !Number.isFinite(low)) {
      high = Math.max(open, last.close);
      low = Math.min(open, last.close);
    }
    out.push({
      trade_date: last.trade_date,
      open,
      high,
      low,
      close: last.close,
      volume: vol,
    });
  }
  return out;
}

/** Build synthetic OHLC from close-only series (legacy sparkline fallback). */
export function closesToBars(closes: number[]): DailyBarPoint[] {
  const vals = closes.filter((v) => Number.isFinite(v) && v > 0);
  if (vals.length === 0) return [];
  return vals.map((close, i) => {
    const prev = i > 0 ? vals[i - 1]! : close;
    const open = prev;
    const high = Math.max(open, close);
    const low = Math.min(open, close);
    const pad = Math.max(Math.abs(high - low) * 0.15, close * 0.002, 0.01);
    return {
      trade_date: `c${String(i).padStart(3, "0")}`,
      open,
      high: high + pad * 0.35,
      low: Math.max(0.01, low - pad * 0.35),
      close,
      volume: null,
    };
  });
}
