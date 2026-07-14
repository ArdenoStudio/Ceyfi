"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { CeyfiTooltip } from "@/components/charts/CeyfiTooltip";
import { lkrAxisTick } from "@/lib/chartUtils";
import { useChartTheme } from "@/hooks/useChartTheme";

export interface ScenarioPath {
  id: string;
  label: string;
  color: string;
  data: { date: string; balance: number }[];
}

interface ScenarioFanChartProps {
  paths: ScenarioPath[];
  height?: number;
}

const OPACITY: Record<string, number> = {
  pessimistic: 0.15,
  base: 0.3,
  optimistic: 0.15,
};

export function ScenarioFanChart({ paths, height = 280 }: ScenarioFanChartProps) {
  const { colors } = useChartTheme();
  const merged = paths[0]?.data.map((point, i) => {
    const row: Record<string, string | number> = { date: point.date };
    paths.forEach((path) => {
      row[path.id] = path.data[i]?.balance ?? 0;
    });
    return row;
  }) ?? [];

  return (
    <ChartContainer height={height}>
      <ComposedChart data={merged} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: colors.axis, fontSize: 10 }}
          minTickGap={40}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: colors.axis, fontSize: 10 }}
          tickFormatter={lkrAxisTick}
          width={44}
        />
        <Tooltip content={(props) => <CeyfiTooltip {...props} />} />
        {paths.map((path) => (
          <Area
            key={`area-${path.id}`}
            type="monotone"
            dataKey={path.id}
            stroke="none"
            fill={path.color}
            fillOpacity={OPACITY[path.id] ?? 0.2}
            name={path.label}
          />
        ))}
        {paths.map((path) => (
          <Line
            key={`line-${path.id}`}
            type="monotone"
            dataKey={path.id}
            stroke={path.color}
            strokeWidth={2}
            dot={false}
            name={path.label}
          />
        ))}
      </ComposedChart>
    </ChartContainer>
  );
}
