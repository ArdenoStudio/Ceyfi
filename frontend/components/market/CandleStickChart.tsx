"use client";

import { useId, useMemo } from "react";

import { CHART_COLORS } from "@/lib/chartUtils";
import type { MarketBar } from "@/lib/chime-market";
import { formatters } from "@/lib/utils";

type Row = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  up: boolean;
  isFire: boolean;
};

function normalize(
  bars: MarketBar[],
  fireDate?: string | null,
): Row[] {
  return bars
    .filter((b) => b.close != null)
    .map((b) => {
      const open = Number(b.open ?? b.close);
      const close = Number(b.close);
      const high = Number(b.high ?? Math.max(open, close));
      const low = Number(b.low ?? Math.min(open, close));
      return {
        date: b.trade_date,
        open,
        high,
        low,
        close,
        up: close >= open,
        isFire: Boolean(fireDate && b.trade_date === fireDate),
      };
    });
}

export function CandleStickChart({
  bars,
  threshold,
  fireDate,
  height = 260,
}: {
  bars: MarketBar[];
  threshold?: number | null;
  fireDate?: string | null;
  height?: number;
}) {
  const gid = useId();
  const rows = useMemo(
    () => normalize(bars, fireDate),
    [bars, fireDate],
  );

  const layout = useMemo(() => {
    if (rows.length === 0) return null;
    const padL = 44;
    const padR = 12;
    const padT = 12;
    const padB = 28;
    const width = 640;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;
    const lows = rows.map((r) => r.low);
    const highs = rows.map((r) => r.high);
    if (threshold != null) {
      lows.push(Number(threshold));
      highs.push(Number(threshold));
    }
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const span = Math.max(max - min, 0.01);
    const yOf = (v: number) => padT + ((max - v) / span) * innerH;
    const slot = innerW / rows.length;
    const bodyW = Math.max(Math.min(slot * 0.55, 14), 3);
    return { padL, padR, padT, padB, width, innerW, innerH, min, max, yOf, slot, bodyW };
  }, [rows, threshold, height]);

  if (!layout || rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No OHLC bars available.</p>
    );
  }

  const { padL, padT, width, yOf, slot, bodyW, min, max } = layout;
  const ticks = [max, (max + min) / 2, min];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[260px] w-full min-w-[320px]"
        role="img"
        aria-label="Daily candlestick chart"
      >
        <defs>
          <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8F7EE" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#E8F7EE" stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect
          x={padL}
          y={padT}
          width={layout.innerW}
          height={layout.innerH}
          fill={`url(#${gid}-bg)`}
        />
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              x2={padL + layout.innerW}
              y1={yOf(t)}
              y2={yOf(t)}
              stroke="#e5f0eb"
              strokeDasharray="3 3"
            />
            <text
              x={padL - 6}
              y={yOf(t) + 3}
              textAnchor="end"
              className="fill-ceyfi-muted"
              fontSize={10}
              fontFamily="ui-monospace, monospace"
            >
              {formatters
                .currency({ number: t, maxFractionDigits: 0 })
                .replace("LKR ", "")}
            </text>
          </g>
        ))}
        {threshold != null ? (
          <line
            x1={padL}
            x2={padL + layout.innerW}
            y1={yOf(Number(threshold))}
            y2={yOf(Number(threshold))}
            stroke={CHART_COLORS.amber}
            strokeDasharray="4 4"
            strokeWidth={1.5}
          />
        ) : null}
        {rows.map((row, i) => {
          const cx = padL + slot * i + slot / 2;
          const color = row.isFire
            ? CHART_COLORS.rose
            : row.up
              ? CHART_COLORS.green
              : CHART_COLORS.rose;
          const yHigh = yOf(row.high);
          const yLow = yOf(row.low);
          const yOpen = yOf(row.open);
          const yClose = yOf(row.close);
          const yTop = Math.min(yOpen, yClose);
          const yBot = Math.max(yOpen, yClose);
          return (
            <g key={row.date} className="transition-opacity hover:opacity-90">
              <title>
                {`${row.date} O ${row.open.toFixed(2)} H ${row.high.toFixed(2)} L ${row.low.toFixed(2)} C ${row.close.toFixed(2)}`}
              </title>
              <line
                x1={cx}
                x2={cx}
                y1={yHigh}
                y2={yLow}
                stroke={color}
                strokeWidth={1.5}
              />
              <rect
                x={cx - bodyW / 2}
                y={yTop}
                width={bodyW}
                height={Math.max(yBot - yTop, 1.5)}
                fill={color}
                rx={1}
              />
              {row.isFire ? (
                <circle
                  cx={cx}
                  cy={yClose}
                  r={4}
                  fill={CHART_COLORS.rose}
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              ) : null}
            </g>
          );
        })}
        {/* sparse x labels */}
        {rows
          .filter((_, i) => i % Math.ceil(rows.length / 6) === 0)
          .map((row) => {
            const i = rows.indexOf(row);
            const cx = padL + slot * i + slot / 2;
            return (
              <text
                key={`lbl-${row.date}`}
                x={cx}
                y={height - 8}
                textAnchor="middle"
                className="fill-ceyfi-muted"
                fontSize={10}
                fontFamily="ui-monospace, monospace"
              >
                {row.date.slice(5)}
              </text>
            );
          })}
      </svg>
    </div>
  );
}
