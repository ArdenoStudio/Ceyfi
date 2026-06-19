"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  type TooltipContentProps,
} from "recharts";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { CeyfiTooltip } from "@/components/charts/CeyfiTooltip";
import {
  CHART_BRAND,
  CHART_VARIANTS,
  lkrAxisTick,
  seriesColor,
  type ChartVariant,
} from "@/lib/chartUtils";
import { cn } from "@/lib/utils";

export interface BarChartSeries {
  key: string;
  name?: string;
  color?: string;
}

interface BarChartProps {
  data: Record<string, string | number>[];
  index: string;
  categories: string[];
  colors?: string[];
  series?: BarChartSeries[];
  height?: number;
  variant?: ChartVariant;
  showLegend?: boolean;
  showGrid?: boolean;
  valueFormatter?: (value: number) => string;
  yAxisFormatter?: (value: number) => string;
  className?: string;
  layout?: "horizontal" | "vertical";
  barCategoryGap?: string | number;
  perBarColors?: boolean;
}

function DarkBarTooltip({
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
  const success = payload.find((p) => p.name === "Success")?.value ?? 0;
  const error = payload.find((p) => p.name === "Errors")?.value ?? 0;
  const total = Number(success) + Number(error);
  const rate = total > 0 ? Math.round((Number(success) / total) * 100) : 100;
  const format =
    valueFormatter ?? ((v: number) => String(Math.round(v)));

  return (
    <div className={cn(CHART_BRAND.tooltipClass, "min-w-[120px]")}>
      <p className="mb-1.5 font-semibold text-white/60">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div
            key={String(entry.dataKey ?? i)}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-mono font-semibold text-white">
              {format(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
        {payload.length >= 2 ? (
          <div className="mt-1 flex items-center justify-between gap-4 border-t border-white/10 pt-1">
            <span className="text-white/40">Rate</span>
            <span className="font-mono font-semibold text-emerald-400">
              {rate}%
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BarChart({
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
  layout = "horizontal",
  barCategoryGap = "35%",
  perBarColors = false,
}: BarChartProps) {
  const theme = CHART_VARIANTS[variant];
  const resolvedSeries =
    series ??
    categories.map((key, i) => ({
      key,
      name: key,
      color: colors?.[i] ?? seriesColor(i),
    }));

  const chart = (
    <RechartsBarChart
      data={data}
      layout={layout}
      barCategoryGap={barCategoryGap}
      barGap={2}
      margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
    >
      {showGrid ? (
        <CartesianGrid
          vertical={false}
          stroke={theme.grid}
          strokeDasharray="3 3"
        />
      ) : null}
      <XAxis
        dataKey={index}
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 10, fill: theme.axis }}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 10, fill: theme.axis }}
        tickFormatter={yAxisFormatter ?? lkrAxisTick}
      />
      <Tooltip
        content={(props) =>
          variant === "dark" ? (
            <DarkBarTooltip
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
        cursor={{ fill: theme.cursor }}
      />
      {showLegend ? (
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 12, color: theme.legend }}
          iconType="circle"
          iconSize={7}
          formatter={(value) => (
            <span style={{ color: theme.legend }}>{value}</span>
          )}
        />
      ) : null}
      {resolvedSeries.map((s) => (
        <Bar
          key={s.key}
          dataKey={s.key}
          name={s.name ?? s.key}
          fill={s.color ?? CHART_BRAND.primary}
          radius={[3, 3, 0, 0]}
        >
          {perBarColors
            ? data.map((row, i) => (
                <Cell
                  key={`cell-${String(row[index])}-${i}`}
                  fill={
                    (row.color as string) ??
                    colors?.[i % (colors?.length ?? 1)] ??
                    seriesColor(i)
                  }
                />
              ))
            : null}
        </Bar>
      ))}
    </RechartsBarChart>
  );

  return (
    <div className={cn("w-full will-change-transform", className)}>
      <ChartContainer height={height}>{chart}</ChartContainer>
    </div>
  );
}
