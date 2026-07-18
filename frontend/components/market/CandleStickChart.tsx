"use client";

import { useMemo } from "react";

import { CHART_COLORS } from "@/lib/chartUtils";
import type { MarketBar } from "@/lib/chime-market";
import {
  aggregateBarsForDisplay,
  candleBodyOpen,
  marketBarsToDaily,
  type DailyBarPoint,
} from "@/lib/daily-bars";
import { cn, formatters } from "@/lib/utils";

function formatPrice(n: number): string {
  return formatters
    .currency({ number: n, maxFractionDigits: 2 })
    .replace("LKR ", "");
}

function barTooltip(b: DailyBarPoint, bodyOpen: number): string {
  const vol =
    b.volume != null && Number.isFinite(b.volume)
      ? ` · Vol ${Math.round(b.volume).toLocaleString("en-LK")}`
      : "";
  return `${b.trade_date} · O ${formatPrice(b.open ?? bodyOpen)} H ${formatPrice(
    b.high,
  )} L ${formatPrice(b.low)} C ${formatPrice(b.close)}${vol}`;
}

/**
 * Chime-style SVG candlesticks: fixed slot width, aggregation for dense
 * series, missing open → prior close. Optional threshold + fire-day marker.
 */
export function CandleStickChart({
  bars: rawInput,
  threshold,
  fireDate,
  height = 260,
  maxCandles = 72,
  className,
}: {
  bars: MarketBar[];
  threshold?: number | null;
  fireDate?: string | null;
  height?: number;
  maxCandles?: number;
  className?: string;
}) {
  const rawBars = useMemo(() => marketBarsToDaily(rawInput), [rawInput]);

  const priceMax = Math.max(...rawBars.map((b) => b.close), 0);
  const adaptiveMax =
    maxCandles >= 200
      ? maxCandles
      : priceMax > 0 && priceMax < 2
        ? Math.min(maxCandles, 40)
        : maxCandles;
  const bars = useMemo(
    () => aggregateBarsForDisplay(rawBars, adaptiveMax),
    [rawBars, adaptiveMax],
  );

  if (bars.length < 2) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Need at least two bars for a candlestick chart.
      </p>
    );
  }

  const padL = 14;
  const padR = 52;
  const padT = 16;
  const padB = 32;
  const slot = 18;
  const bodyW = 13;
  const wickW = 2;
  const n = bars.length;
  const plotW = n * slot;
  const w = padL + padR + plotW;
  const h = Math.max(height + 40, 320);
  const plotH = h - padT - padB;

  let barMin = Infinity;
  let barMax = -Infinity;
  for (const b of bars) {
    if (Number.isFinite(b.low)) barMin = Math.min(barMin, b.low);
    if (Number.isFinite(b.high)) barMax = Math.max(barMax, b.high);
    barMin = Math.min(barMin, b.close);
    barMax = Math.max(barMax, b.close);
    if (b.open != null) {
      barMin = Math.min(barMin, b.open);
      barMax = Math.max(barMax, b.open);
    }
  }
  if (threshold != null && Number.isFinite(threshold)) {
    barMin = Math.min(barMin, Number(threshold));
    barMax = Math.max(barMax, Number(threshold));
  }
  if (!Number.isFinite(barMin) || !Number.isFinite(barMax)) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Invalid price range for chart.
      </p>
    );
  }

  const barSpan =
    barMax > barMin
      ? barMax - barMin
      : Math.max(Math.abs(barMax) * 0.02, 0.02);
  const min = Math.max(0, barMin - barSpan * 0.12);
  const max = barMax + barSpan * 0.12;
  const span = max > min ? max - min : 1;
  const yFor = (price: number) =>
    padT + (1 - (price - min) / span) * plotH;

  const first = bars[0]!;
  const last = bars[n - 1]!;
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => padT + t * plotH);
  const aggregated = rawBars.length > bars.length;
  const lastBodyOpen = candleBodyOpen(bars, n - 1);
  const lastUp = last.close > lastBodyOpen;
  const lastDown = last.close < lastBodyOpen;

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div
        className="relative w-full overflow-x-auto overflow-y-hidden rounded-xl border border-ceyfi-line/70 bg-ceyfi-canvas/40 dark:border-white/10 dark:bg-white/[0.03]"
        ref={(el) => {
          if (!el) return;
          requestAnimationFrame(() => {
            el.scrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
          });
        }}
      >
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMinYMid meet"
          style={{
            width: w,
            height: Math.min(height, 460),
            maxWidth: "none",
            display: "block",
          }}
          className="max-w-none"
          role="img"
          aria-label={`Candles from ${first.trade_date} to ${last.trade_date}, close ${formatPrice(last.close)}`}
        >
          {gridYs.map((gy, gi) => (
            <g key={gy}>
              <line
                x1={padL}
                x2={w - padR}
                y1={gy}
                y2={gy}
                stroke="#e5f0eb"
                strokeWidth={1}
              />
              <text
                x={w - 10}
                y={gy}
                textAnchor="end"
                dominantBaseline={
                  gi === 0
                    ? "hanging"
                    : gi === gridYs.length - 1
                      ? "auto"
                      : "middle"
                }
                className="fill-ceyfi-muted"
                fontSize={11}
                fontFamily="ui-monospace, monospace"
              >
                {formatPrice(max - (gi / (gridYs.length - 1)) * span)}
              </text>
            </g>
          ))}
          {threshold != null ? (
            <line
              x1={padL}
              x2={w - padR}
              y1={yFor(Number(threshold))}
              y2={yFor(Number(threshold))}
              stroke={CHART_COLORS.amber}
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
          ) : null}
          {bars.map((b, i) => {
            const bodyOpen = candleBodyOpen(bars, i);
            const cx = padL + slot * i + slot / 2;
            const yH = yFor(b.high);
            const yL = yFor(b.low);
            const yO = yFor(bodyOpen);
            const yC = yFor(b.close);
            const eps = span * 1e-6;
            const up = b.close > bodyOpen + eps;
            const down = b.close < bodyOpen - eps;
            const isFire = Boolean(fireDate && b.trade_date === fireDate);
            const color = isFire
              ? CHART_COLORS.rose
              : up
                ? CHART_COLORS.green
                : down
                  ? CHART_COLORS.rose
                  : CHART_COLORS.slate;

            if (!up && !down) {
              const tickH = 4;
              const wickPad = 7;
              return (
                <g key={`${b.trade_date}-${i}`}>
                  <title>{barTooltip(b, bodyOpen)}</title>
                  <rect
                    x={cx - slot / 2}
                    y={padT}
                    width={slot}
                    height={plotH}
                    fill="transparent"
                  />
                  <line
                    x1={cx}
                    x2={cx}
                    y1={yC - wickPad}
                    y2={yC + wickPad}
                    stroke={color}
                    strokeWidth={wickW}
                    strokeLinecap="round"
                  />
                  <rect
                    x={cx - bodyW / 2}
                    y={yC - tickH / 2}
                    width={bodyW}
                    height={tickH}
                    rx={1}
                    fill={color}
                  />
                  {isFire ? (
                    <circle
                      cx={cx}
                      cy={yC}
                      r={4}
                      fill={CHART_COLORS.rose}
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  ) : null}
                </g>
              );
            }

            const naturalH = Math.abs(yC - yO);
            const bodyH = Math.max(naturalH, 5);
            const bodyTop = Math.min(yO, yC) - (bodyH - naturalH) / 2;

            return (
              <g key={`${b.trade_date}-${i}`}>
                <title>{barTooltip(b, bodyOpen)}</title>
                <rect
                  x={cx - slot / 2}
                  y={padT}
                  width={slot}
                  height={plotH}
                  fill="transparent"
                />
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
                  rx={1.25}
                  fill={color}
                />
                {isFire ? (
                  <circle
                    cx={cx}
                    cy={yC}
                    r={4}
                    fill={CHART_COLORS.rose}
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                ) : null}
              </g>
            );
          })}
          {/* Last-close reference (TradingView-style) */}
          <g aria-hidden>
            <line
              x1={padL}
              x2={w - padR}
              y1={yFor(last.close)}
              y2={yFor(last.close)}
              strokeDasharray="3 3"
              strokeWidth={1}
              stroke={
                lastUp
                  ? CHART_COLORS.green
                  : lastDown
                    ? CHART_COLORS.rose
                    : CHART_COLORS.slate
              }
              strokeOpacity={0.55}
            />
            <text
              x={w - 10}
              y={yFor(last.close)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={600}
              fontFamily="ui-monospace, monospace"
              fill={
                lastUp
                  ? CHART_COLORS.green
                  : lastDown
                    ? CHART_COLORS.rose
                    : CHART_COLORS.slate
              }
            >
              {formatPrice(last.close)}
            </text>
          </g>
          <text
            x={padL}
            y={h - 12}
            className="fill-ceyfi-muted"
            fontSize={11}
          >
            {first.trade_date}
          </text>
          <text
            x={w - padR}
            y={h - 12}
            textAnchor="end"
            className="fill-ceyfi-muted"
            fontSize={11}
          >
            {last.trade_date}
          </text>
        </svg>
      </div>
      <p className="mt-2 shrink-0 text-[11px] leading-relaxed text-muted-foreground">
        {rawBars.length} sessions
        {aggregated ? ` → ${n} candles` : ""} · close {formatPrice(first.close)}{" "}
        → {formatPrice(last.close)}
        {threshold != null ? ` · alert ${formatPrice(Number(threshold))}` : ""}
        {" · research only"}
      </p>
    </div>
  );
}
