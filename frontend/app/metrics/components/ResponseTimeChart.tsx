"use client";

import { AreaChart } from "@/components/charts/AreaChart";
import type { AgentMetric } from "../types";

const AGENT_COLORS = [
  "#059669",
  "#10b981",
  "#f59e0b",
  "#60a5fa",
  "#a78bfa",
];

export function ResponseTimeChart({ agents }: { agents: AgentMetric[] }) {
  const hours = agents[0]?.series.map((p) => p.hour) ?? [];

  const data: Record<string, string | number>[] = hours.map((hour, i) => {
    const row: Record<string, string | number> = { hour };
    agents.forEach((agent) => {
      row[agent.label] = agent.series[i]?.responseTime ?? 0;
    });
    return row;
  });

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ceyfi-green">
        24-hour trends
      </p>
      <h3 className="mb-5 font-heading text-base font-semibold text-white">
        Response Time (ms)
      </h3>
      <AreaChart
        data={data}
        index="hour"
        categories={agents.map((agent) => agent.label)}
        colors={AGENT_COLORS.slice(0, agents.length)}
        variant="dark"
        valueFormatter={(value) => `${Math.round(value)}ms`}
        yAxisFormatter={(value) => `${value}`}
      />
    </div>
  );
}
