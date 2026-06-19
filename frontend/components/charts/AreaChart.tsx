"use client";

import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { CeyfiTooltip } from "@/components/charts/CeyfiTooltip";
import {
  CHART_BRAND,
  CHART_VARIANTS,
  getYDomain,
  lkrAxisTick,
  seriesColor,
  type ChartVariant,
} from "@/lib/chartUtils";
import { cn, formatters } from "@/lib/utils";

export interface AreaChartSeries {
  key: string;
  name?: string;
  color?: string;
}

interface AreaChartProps {
  data: Record<string, string | number>[];
  index: string;
  categories: string[];
  colors?: string[];
  series?: AreaChartSeries[];
  height?: number;
  variant?: ChartVariant;
  showLegend?: boolean;
  showGrid?: boolean;
  valueFormatter?: (value: number) => string;
  yAxisFormatter?: (value: number) => string;
  className?: string;
  sparkline?: boolean;
  stacked?: boolean;
}

function DarkTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: TooltipContentProps<number, string>["payload"];
  label?: TooltipContentProps<number, string>["label"];
  valueFormatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const format =
    valueFormatter ??
    ((v: number) => `${Math.round(v).toLocaleString()}ms`);

  return (
    <div className={CHART_BRAND.tooltipClass}>
      <p className="mb-1.5 font-semibold text-white/60">{label}</p>
      {payload.map((entry, i) => (
        <div key={String(entry.dataKey ?? i)} className="flex items-center gap-2 py-0.5">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: entry.color ?? CHART_BRAND.primary }}
          />
          <span className="truncate text-white/50">{entry.name}</span>
          <span className="ml-auto pl-2 font-mono font-semibold text-white">
            {format(Number(entry.value ?? 0))}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AreaChart({
  data,
  index,
  categories,
  colors,
  series,
  height = 240,
  variant = "light",
  showLegend = true,
  showGrid = true,
  valueFormatter,
  yAxisFormatter,
  className,
  sparkline = false,
  stacked = false,
}: AreaChartProps) {
  const theme = CHART_VARIANTS[variant];
  const resolvedSeries =
    series ??
    categories.map((key, i) => ({
      key,
      name: key,
      color: colors?.[i] ?? seriesColor(i),
    }));

  const numericValues = data.flatMap((row) =>
    categories.map((cat) => Number(row[cat] ?? 0))
  );
  const yDomain = sparkline ? undefined : getYDomain(numericValues);

  const chart = (
    <RechartsAreaChart
      data={data}
      margin={
        sparkline
          ? { top: 2, right: 2, left: 2, bottom: 2 }
          : { top: 8, right: 8, left: -16, bottom: 0 }
      }
      stackOffset={stacked ? "none" : undefined}
    >
      <defs>
        {resolvedSeries.map((s) => (
          <linearGradient
            key={s.key}
            id={`area-grad-${s.key}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor={s.color ?? CHART_BRAND.primary}
              stopOpacity={sparkline ? 0.35 : 0.28}
            />
            <stop
              offset="100%"
              stopColor={s.color ?? CHART_BRAND.primary}
              stopOpacity={0}
            />
          </linearGradient>
        ))}
      </defs>
      {showGrid && !sparkline ? (
        <CartesianGrid
          vertical={false}
          stroke={theme.grid}
          strokeDasharray="3 3"
        />
      ) : null}
      {!sparkline ? (
        <>
          <XAxis
            dataKey={index}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: theme.axis }}
            minTickGap={34}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: theme.axis }}
            tickFormatter={yAxisFormatter ?? lkrAxisTick}
            domain={yDomain}
            hide={sparkline}
          />
        </>
      ) : null}
      {!sparkline ? (
        <Tooltip
          content={(props) =>
            variant === "dark" ? (
              <DarkTooltip
                active={props.active}
                payload={props.payload}
                label={props.label}
                valueFormatter={valueFormatter}
              />
            ) : (
              <CeyfiTooltip
                active={props.active}
                payload={props.payload}
                label={props.label}
                valueFormatter={valueFormatter}
              />
            )
          }
          cursor={
            sparkline
              ? false
              : { stroke: theme.cursor, strokeDasharray: "4 4" }
          }
        />
      ) : null}
      {showLegend && !sparkline ? (
        <Legend
          verticalAlign="top"
          align="right"
          height={36}
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: 11, color: theme.legend }}
        />
      ) : null}
      {resolvedSeries.map((s) => (
        <Area
          key={s.key}
          type="monotone"
          dataKey={s.key}
          name={s.name ?? s.key}
          stroke={s.color ?? CHART_BRAND.primary}
          strokeWidth={sparkline ? 1.5 : 2}
          fill={`url(#area-grad-${s.key})`}
          stackId={stacked ? "stack" : undefined}
          dot={false}
          activeDot={sparkline ? false : { r: 3 }}
        />
      ))}
    </RechartsAreaChart>
  );

  if (sparkline) {
    return (
      <div
        className={cn("will-change-transform", className)}
        style={{ width: 60, height: 32 }}
      >
        <ChartContainer height={32}>{chart}</ChartContainer>
      </div>
    );
  }

  return (
    <div className={cn("w-full will-change-transform", className)}>
      <ChartContainer height={height}>{chart}</ChartContainer>
    </div>
  );
}

export function SparklineArea({
  data,
  dataKey,
  index = "i",
  color = CHART_BRAND.primary,
  className,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  index?: string;
  color?: string;
  className?: string;
}) {
  return (
    <AreaChart
      data={data}
      index={index}
      categories={[dataKey]}
      colors={[color]}
      sparkline
      showLegend={false}
      showGrid={false}
      className={className}
    />
  );
}
