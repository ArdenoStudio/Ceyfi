"use client";

import { BarChart } from "@/components/charts/BarChart";
import type { AgentMetric } from "../types";

export function SuccessErrorChart({ agents }: { agents: AgentMetric[] }) {
  const hours = agents[0]?.series.map((p) => p.hour) ?? [];

  const data: Record<string, string | number>[] = hours.map((hour, i) => ({
    hour,
    success: agents.reduce((sum, agent) => sum + (agent.series[i]?.success ?? 0), 0),
    error: agents.reduce((sum, agent) => sum + (agent.series[i]?.error ?? 0), 0),
  }));

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ceyfi-green">
        All agents
      </p>
      <h3 className="mb-5 font-heading text-base font-semibold text-white">
        Success vs Errors (24h)
      </h3>
      <BarChart
        data={data}
        index="hour"
        categories={["success", "error"]}
        series={[
          { key: "success", name: "Success", color: "#10b981" },
          { key: "error", name: "Errors", color: "#ef4444" },
        ]}
        variant="dark"
        valueFormatter={(value) => String(Math.round(value))}
        yAxisFormatter={(value) => String(value)}
      />
    </div>
  );
}
