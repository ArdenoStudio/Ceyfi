"use client";

import { useMemo } from "react";

import { CHART_COLORS } from "@/lib/chartUtils";
import type { MarketBar } from "@/lib/chime-market";
import {
  aggregateBarsForDisplay,
  candleBodyOpen,
  closesToBars,
  marketBarsToDaily,
  type DailyBarPoint,
} from "@/lib/daily-bars";
import { cn } from "@/lib/utils";

/**
 * Tiny Chime-style candlestick spark for Market home (focus + watchlist).
 * Fixed slot width so dense series stay thick — not a barcode / line path.
 */
export function CandleSpark({
  bars,
  closes,
  className,
  width = 72,
  height = 28,
  maxCandles,
}: {
  bars?: MarketBar[] | null;
  /** Legacy close-only fallback when OHLC is absent. */
  closes?: number[] | null;
  className?: string;
  width?: number;
  height?: number;
  maxCandles?: number;
}) {
  const layout = useMemo(() => {
    let raw: DailyBarPoint[] = marketBarsToDaily(bars ?? []);
    if (raw.length < 2 && closes && closes.length >= 2) {
      raw = closesToBars(closes);
    }
    if (raw.length < 2) return null;

    const cap =
      maxCandles ??
      Math.max(8, Math.min(28, Math.floor(width / 4)));
    const series = aggregateBarsForDisplay(raw, cap);
    const n = series.length;

    const padX = 1;
    const padY = 2;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;
    const slot = plotW / n;
    const bodyW = Math.max(Math.min(slot * 0.62, 5.5), 1.75);
    const wickW = Math.max(Math.min(slot * 0.18, 1.5), 0.75);

    let barMin = Infinity;
    let barMax = -Infinity;
    for (let i = 0; i < n; i++) {
      const b = series[i]!;
      const o = candleBodyOpen(series, i);
      barMin = Math.min(barMin, b.low, b.close, o);
      barMax = Math.max(barMax, b.high, b.close, o);
    }
    if (!Number.isFinite(barMin) || !Number.isFinite(barMax)) return null;
    const span =
      barMax > barMin
        ? barMax - barMin
        : Math.max(Math.abs(barMax) * 0.02, 0.02);
    const min = Math.max(0, barMin - span * 0.08);
    const max = barMax + span * 0.08;
    const ySpan = max > min ? max - min : 1;
    const yFor = (price: number) =>
      padY + (1 - (price - min) / ySpan) * plotH;

    return { series, n, slot, bodyW, wickW, padX, yFor, span: ySpan };
  }, [bars, closes, width, height, maxCandles]);

  if (!layout) {
    return (
      <span
        className={cn("inline-block text-[10px] text-muted-foreground", className)}
        aria-hidden
      >
        —
      </span>
    );
  }

  const { series, n, slot, bodyW, wickW, padX, yFor, span } = layout;
  const last = series[n - 1]!;
  const firstOpen = candleBodyOpen(series, 0);
  const upOverall = last.close >= firstOpen;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={
        upOverall
          ? "Candlestick spark, net up"
          : "Candlestick spark, net down"
      }
    >
      {series.map((b, i) => {
        const bodyOpen = candleBodyOpen(series, i);
        const cx = padX + slot * i + slot / 2;
        const yH = yFor(b.high);
        const yL = yFor(b.low);
        const yO = yFor(bodyOpen);
        const yC = yFor(b.close);
        const eps = span * 1e-6;
        const up = b.close > bodyOpen + eps;
        const down = b.close < bodyOpen - eps;
        const color = up
          ? CHART_COLORS.green
          : down
            ? CHART_COLORS.rose
            : CHART_COLORS.slate;

        if (!up && !down) {
          const tickH = Math.max(2, Math.min(bodyW * 0.45, 3.5));
          return (
            <g key={`${b.trade_date}-${i}`}>
              <line
                x1={cx}
                x2={cx}
                y1={yH}
                y2={yL}
                stroke={color}
                strokeWidth={wickW}
                strokeLinecap="round"
              />
              <rect
                x={cx - bodyW / 2}
                y={yC - tickH / 2}
                width={bodyW}
                height={tickH}
                rx={0.75}
                fill={color}
              />
            </g>
          );
        }

        const naturalH = Math.abs(yC - yO);
        const bodyH = Math.max(naturalH, 2);
        const bodyTop = Math.min(yO, yC) - (bodyH - naturalH) / 2;

        return (
          <g key={`${b.trade_date}-${i}`}>
            <line
              x1={cx}
              x2={cx}
              y1={yH}
              y2={yL}
              stroke={color}
              strokeWidth={wickW}
              strokeLinecap="round"
            />
            <rect
              x={cx - bodyW / 2}
              y={bodyTop}
              width={bodyW}
              height={bodyH}
              rx={0.75}
              fill={color}
            />
          </g>
        );
      })}
    </svg>
  );
}
