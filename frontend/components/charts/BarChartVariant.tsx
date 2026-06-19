"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
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

interface BarChartVariantProps {
  data: Record<string, string | number>[];
  index: string;
  categories: string[];
  colors?: string[];
  height?: number;
  variant?: ChartVariant;
  showLegend?: boolean;
  showGrid?: boolean;
  valueFormatter?: (value: number) => string;
  className?: string;
  /** stacked = stacked bars, grouped = side-by-side (default) */
  mode?: "stacked" | "grouped";
}

export function BarChartVariant({
  data,
  index,
  categories,
  colors,
  height = 240,
  variant = "light",
  showLegend = true,
  showGrid = true,
  valueFormatter,
  className,
  mode = "grouped",
}: BarChartVariantProps) {
  const theme = CHART_VARIANTS[variant];
  const stackId = mode === "stacked" ? "stack" : undefined;

  const chart = (
    <RechartsBarChart
      data={data}
      barCategoryGap={mode === "grouped" ? "30%" : "20%"}
      barGap={mode === "grouped" ? 4 : 0}
      margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
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
        tickFormatter={lkrAxisTick}
      />
      <Tooltip
        content={(props) => (
          <CeyfiTooltip {...props} valueFormatter={valueFormatter} />
        )}
        cursor={{ fill: theme.cursor }}
      />
      {showLegend ? (
        <Legend
          verticalAlign="top"
          align="right"
          height={36}
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: 11, color: theme.legend }}
        />
      ) : null}
      {categories.map((cat, i) => (
        <Bar
          key={cat}
          dataKey={cat}
          name={cat}
          fill={colors?.[i] ?? seriesColor(i)}
          stackId={stackId}
          radius={mode === "stacked" ? [0, 0, 0, 0] : [6, 6, 0, 0]}
        />
      ))}
    </RechartsBarChart>
  );

  return (
    <div className={cn("w-full will-change-transform", className)}>
      <ChartContainer height={height}>{chart}</ChartContainer>
    </div>
  );
}

/** Horizontal variant with rounded ends — useful for comparisons */
export function HorizontalBarChart({
  data,
  index,
  valueKey,
  color = CHART_BRAND.primary,
  height = 180,
  variant = "light",
  className,
}: {
  data: Record<string, string | number>[];
  index: string;
  valueKey: string;
  color?: string;
  height?: number;
  variant?: ChartVariant;
  className?: string;
}) {
  const theme = CHART_VARIANTS[variant];

  const chart = (
    <RechartsBarChart
      data={data}
      layout="vertical"
      margin={{ top: 4, right: 16, left: 4, bottom: 0 }}
    >
      <CartesianGrid horizontal={false} stroke={theme.grid} strokeDasharray="3 3" />
      <XAxis type="number" hide />
      <YAxis
        type="category"
        dataKey={index}
        axisLine={false}
        tickLine={false}
        tick={{ fontSize: 10, fill: theme.axis }}
        width={72}
      />
      <Tooltip
        content={(props) => <CeyfiTooltip {...props} />}
        cursor={{ fill: theme.cursor }}
      />
      <Bar dataKey={valueKey} fill={color} radius={[0, 6, 6, 0]} barSize={14} />
    </RechartsBarChart>
  );

  return (
    <div className={cn("w-full will-change-transform", className)}>
      <ChartContainer height={height}>{chart}</ChartContainer>
    </div>
  );
}
