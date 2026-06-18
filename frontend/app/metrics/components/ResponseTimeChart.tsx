"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AgentMetric } from "../types";

const AGENT_COLORS = [
  "#E31821", // Core API — seylan red
  "#10b981", // Wallet — emerald
  "#f59e0b", // Loans — amber
  "#60a5fa", // Account Context — blue
  "#a78bfa", // AI Agent — violet
];

interface ChartRow {
  hour: string;
  [key: string]: string | number;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 px-3 py-2.5 text-xs shadow-xl backdrop-blur">
      <p className="font-semibold text-white/60 mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 py-0.5">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-white/50 truncate max-w-[90px]">{entry.name}</span>
          <span className="ml-auto font-mono font-semibold text-white pl-2">
            {entry.value}ms
          </span>
        </div>
      ))}
    </div>
  );
}

export function ResponseTimeChart({ agents }: { agents: AgentMetric[] }) {
  const hours = agents[0]?.series.map((p) => p.hour) ?? [];

  const data: ChartRow[] = hours.map((hour, i) => {
    const row: ChartRow = { hour };
    agents.forEach((agent) => {
      row[agent.label] = agent.series[i]?.responseTime ?? 0;
    });
    return row;
  });

  const tickHours = hours.filter((_, i) => i % 4 === 0);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-seylan-red mb-1">
        24-hour trends
      </p>
      <h3 className="font-heading text-base font-semibold text-white mb-5">
        Response Time (ms)
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            {agents.map((agent, i) => (
              <linearGradient
                key={agent.key}
                id={`grad-${agent.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={AGENT_COLORS[i]} stopOpacity={0.25} />
                <stop offset="100%" stopColor={AGENT_COLORS[i]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            ticks={tickHours}
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
            tickFormatter={(v: number) => `${v}`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            iconType="circle"
            iconSize={7}
            formatter={(value) => (
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{value}</span>
            )}
          />
          {agents.map((agent, i) => (
            <Area
              key={agent.key}
              type="monotone"
              dataKey={agent.label}
              stroke={AGENT_COLORS[i]}
              strokeWidth={1.5}
              fill={`url(#grad-${agent.key})`}
              dot={false}
              activeDot={{ r: 3 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
