"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CandleStickChart } from "@/components/market/CandleStickChart";
import { CHART_COLORS, CHART_VARIANTS } from "@/lib/chartUtils";
import type { MarketPathPoint } from "@/lib/chime-market";
import { cn, formatters } from "@/lib/utils";

type Mode = "path" | "candles";

export function PathToAlertChart({
  points,
  candleOk,
  preferredChart,
  symbolLabel,
  className,
}: {
  points: MarketPathPoint[];
  candleOk?: boolean;
  preferredChart?: string;
  symbolLabel?: string;
  className?: string;
}) {
  const defaultMode: Mode =
    candleOk && preferredChart === "candles" ? "candles" : "path";
  const [mode, setMode] = useState<Mode>(defaultMode);
  const theme = CHART_VARIANTS.light;

  const data = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        label: (p.date || "").slice(5),
        close: Number(p.close ?? 0),
      })),
    [points],
  );

  const firePoint = data.find((p) => p.is_fire_day);
  const threshold = data.find((p) => p.threshold != null)?.threshold ?? null;

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No price path yet for this symbol.
      </p>
    );
  }

  return (
    <section
      className={cn(
        "rounded-[1.25rem] border border-ceyfi-line bg-card p-4 dark:border-white/10",
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Path to alert
          </p>
          <p className="font-heading text-base font-semibold">
            {symbolLabel ?? "Price path"}
          </p>
        </div>
        <div className="flex rounded-lg border border-ceyfi-line/80 p-0.5 text-xs dark:border-white/10">
          <button
            type="button"
            onClick={() => setMode("path")}
            className={cn(
              "rounded-md px-2.5 py-1 font-medium transition-colors",
              mode === "path"
                ? "bg-ceyfi-sprout text-ceyfi-ink dark:bg-ceyfi-green/20 dark:text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Line
          </button>
          <button
            type="button"
            disabled={!candleOk}
            onClick={() => candleOk && setMode("candles")}
            title={
              candleOk
                ? "Daily OHLC candles from Chime"
                : "Candles need clean daily high/low from Chime"
            }
            className={cn(
              "rounded-md px-2.5 py-1 font-medium transition-colors",
              mode === "candles"
                ? "bg-ceyfi-sprout text-ceyfi-ink dark:bg-ceyfi-green/20 dark:text-white"
                : "text-muted-foreground hover:text-foreground",
              !candleOk && "cursor-not-allowed opacity-40",
            )}
          >
            Candles
          </button>
        </div>
      </div>

      {mode === "candles" && candleOk ? (
        <CandleStickChart
          bars={points.map((p) => ({
            trade_date: p.date,
            open: p.open,
            high: p.high,
            low: p.low,
            close: p.close,
            volume: p.volume,
          }))}
          threshold={threshold}
          fireDate={firePoint?.date}
          height={260}
        />
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="marketPathFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={CHART_COLORS.green}
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="100%"
                    stopColor={CHART_COLORS.green}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke={theme.grid}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: theme.axis, fontSize: 10 }}
                minTickGap={28}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={48}
                tick={{ fill: theme.axis, fontSize: 10 }}
                tickFormatter={(v) =>
                  formatters.currency({
                    number: Number(v),
                    maxFractionDigits: 0,
                  }).replace("LKR ", "")
                }
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #D8E8DC",
                  fontSize: 12,
                }}
                formatter={(value) => [
                  formatters.currency({
                    number: Number(value ?? 0),
                    maxFractionDigits: 2,
                  }),
                  "Close",
                ]}
                labelFormatter={(_, payload) =>
                  String(payload?.[0]?.payload?.date ?? "")
                }
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke="none"
                fill="url(#marketPathFill)"
                isAnimationActive
                animationDuration={700}
              />
              <Line
                type="monotone"
                dataKey="close"
                stroke={CHART_COLORS.green}
                strokeWidth={2}
                dot={false}
                isAnimationActive
                animationDuration={700}
              />
              {threshold != null ? (
                <ReferenceLine
                  y={Number(threshold)}
                  stroke={CHART_COLORS.amber}
                  strokeDasharray="4 4"
                  label={{
                    value: `Alert ${threshold}`,
                    position: "insideTopRight",
                    fill: CHART_COLORS.amber,
                    fontSize: 10,
                  }}
                />
              ) : null}
              {firePoint ? (
                <ReferenceDot
                  x={firePoint.label}
                  y={firePoint.close}
                  r={5}
                  fill={CHART_COLORS.rose}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        {firePoint
          ? "Rose marker = fire day. Amber dashed line = alert threshold."
          : "Area shows recent closes from Chime daily bars (or demo path)."}{" "}
        Research only — not a trade signal.
      </p>
    </section>
  );
}
