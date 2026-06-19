"use client";

import {
  Line,
  LineChart as RechartsLineChart,
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
  getYDomain,
  lkrAxisTick,
  seriesColor,
  type ChartVariant,
} from "@/lib/chartUtils";
import { cn } from "@/lib/utils";

interface LineChartProps {
  data: Record<string, string | number>[];
  index: string;
  categories: string[];
  colors?: string[];
  height?: number;
  variant?: ChartVariant;
  showLegend?: boolean;
  showGrid?: boolean;
  valueFormatter?: (value: number) => string;
  yAxisFormatter?: (value: number) => string;
  className?: string;
  sparkline?: boolean;
}

export function LineChart({
  data,
  index,
  categories,
  colors,
  height = 240,
  variant = "light",
  showLegend = true,
  showGrid = true,
  valueFormatter,
  yAxisFormatter,
  className,
  sparkline = false,
}: LineChartProps) {
  const theme = CHART_VARIANTS[variant];
  const numericValues = data.flatMap((row) =>
    categories.map((cat) => Number(row[cat] ?? 0))
  );
  const yDomain = sparkline ? undefined : getYDomain(numericValues);

  const chart = (
    <RechartsLineChart
      data={data}
      margin={
        sparkline
          ? { top: 2, right: 2, left: 2, bottom: 2 }
          : { top: 8, right: 8, left: -16, bottom: 0 }
      }
    >
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
          />
        </>
      ) : null}
      {!sparkline ? (
        <Tooltip
          content={(props) => (
            <CeyfiTooltip {...props} valueFormatter={valueFormatter} />
          )}
          cursor={{ stroke: theme.cursor, strokeDasharray: "4 4" }}
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
      {categories.map((cat, i) => (
        <Line
          key={cat}
          type="monotone"
          dataKey={cat}
          stroke={colors?.[i] ?? seriesColor(i)}
          strokeWidth={sparkline ? 1.5 : 2.5}
          dot={false}
          activeDot={
            sparkline
              ? false
              : { r: 4, strokeWidth: 3, stroke: CHART_BRAND.secondary }
          }
        />
      ))}
    </RechartsLineChart>
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

export function SparklineLine({
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
    <LineChart
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
