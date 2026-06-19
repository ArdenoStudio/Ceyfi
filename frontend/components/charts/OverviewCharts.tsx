"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipValueType,
  XAxis,
  YAxis,
} from "recharts";
import { cn, formatters } from "@/lib/utils";

export interface PortfolioPoint {
  date: string;
  Balance: number;
  Savings: number;
}

export interface CashflowPoint {
  month: string;
  Income: number;
  Expenses: number;
}

const tooltipStyle = {
  border: "1px solid #d8e8dc",
  borderRadius: "14px",
  background: "rgba(251, 253, 249, 0.97)",
  boxShadow: "0 12px 36px rgba(5, 46, 22, 0.10)",
  color: "#10261a",
  fontSize: "12px",
};

const axisTick = {
  fill: "#7a8a80",
  fontSize: 10,
};

function chartCurrency(value: TooltipValueType | undefined) {
  const scalar = Array.isArray(value) ? value[0] : value;
  return formatters.currency({
    number: Number(scalar ?? 0),
    maxFractionDigits: 0,
  });
}

export function PortfolioChart({ data }: { data: PortfolioPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 720, height: 256 }}
      >
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid
            vertical={false}
            stroke="#e5eee7"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={axisTick}
            minTickGap={34}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={axisTick}
            tickFormatter={(value: number) => formatters.compact(value)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: "#a7d8b8", strokeDasharray: "4 4" }}
            formatter={chartCurrency}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={36}
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, color: "#617267" }}
          />
          <Line
            type="monotone"
            dataKey="Balance"
            stroke="#059669"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 3, stroke: "#d8f7e5" }}
          />
          <Line
            type="monotone"
            dataKey="Savings"
            stroke="#2563eb"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 3, stroke: "#dbeafe" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 720, height: 256 }}
      >
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.34} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0.025} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" stopOpacity={0.26} />
              <stop offset="100%" stopColor="#fb7185" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#e5eee7"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={axisTick}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={axisTick}
            tickFormatter={(value: number) => formatters.compact(value)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: "#a7d8b8", strokeDasharray: "4 4" }}
            formatter={chartCurrency}
          />
          <Legend
            verticalAlign="top"
            align="right"
            height={36}
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, color: "#617267" }}
          />
          <Area
            type="monotone"
            dataKey="Income"
            stroke="#059669"
            strokeWidth={2}
            fill="url(#incomeFill)"
          />
          <Area
            type="monotone"
            dataKey="Expenses"
            stroke="#e11d48"
            strokeWidth={2}
            fill="url(#expenseFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AllocationBar({
  items,
  className,
}: {
  items: { label: string; value: number; color: string }[];
  className?: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex h-3 overflow-hidden rounded-full bg-ceyfi-sprout">
        {items.map((item) => (
          <span
            key={item.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(item.value / total) * 100}%`,
              backgroundColor: item.color,
            }}
          />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <div className="text-xs font-medium text-ceyfi-ink">
                {item.label}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-ceyfi-faint">
                {Math.round((item.value / total) * 100)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ProgressCircle } from "@/components/charts/ProgressCircle";
