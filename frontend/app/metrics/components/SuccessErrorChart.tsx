"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AgentMetric } from "../types";

interface ChartRow {
  hour: string;
  success: number;
  error: number;
}

interface TooltipEntry {
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
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const success = payload.find((p) => p.name === "Success")?.value ?? 0;
  const error = payload.find((p) => p.name === "Errors")?.value ?? 0;
  const total = success + error;
  const rate = total > 0 ? Math.round((success / total) * 100) : 100;

  return (
    <div className="rounded-xl border border-white/10 bg-black/80 px-3 py-2.5 text-xs shadow-xl backdrop-blur min-w-[120px]">
      <p className="font-semibold text-white/60 mb-1.5">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Success
          </span>
          <span className="font-mono font-semibold text-white">{success}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            Errors
          </span>
          <span className="font-mono font-semibold text-white">{error}</span>
        </div>
        <div className="border-t border-white/10 pt-1 mt-1 flex items-center justify-between gap-4">
          <span className="text-white/40">Rate</span>
          <span className="font-mono font-semibold text-emerald-400">{rate}%</span>
        </div>
      </div>
    </div>
  );
}

export function SuccessErrorChart({ agents }: { agents: AgentMetric[] }) {
  // Aggregate across all agents per hour
  const hours = agents[0]?.series.map((p) => p.hour) ?? [];

  const data: ChartRow[] = hours.map((hour, i) => {
    const success = agents.reduce((s, a) => s + (a.series[i]?.success ?? 0), 0);
    const error = agents.reduce((s, a) => s + (a.series[i]?.error ?? 0), 0);
    return { hour, success, error };
  });

  const tickHours = hours.filter((_, i) => i % 4 === 0);

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-seylan-red mb-1">
        All agents
      </p>
      <h3 className="font-heading text-base font-semibold text-white mb-5">
        Success vs Errors (24h)
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          barCategoryGap="35%"
          barGap={2}
          margin={{ top: 4, right: 4, left: -16, bottom: 0 }}
        >
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
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            iconType="circle"
            iconSize={7}
            formatter={(value) => (
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{value}</span>
            )}
          />
          <Bar dataKey="success" name="Success" fill="#10b981" radius={[3, 3, 0, 0]} />
          <Bar dataKey="error" name="Errors" fill="#ef4444" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
