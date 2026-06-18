"use client";

import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { AgentMetric } from "../types";

const STATUS_DOT: Record<AgentMetric["status"], string> = {
  up: "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.20)]",
  degraded: "bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.20)] animate-pulse",
  down: "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.20)] animate-pulse",
};

const STATUS_LABEL: Record<AgentMetric["status"], string> = {
  up: "Operational",
  degraded: "Degraded",
  down: "Down",
};

const STATUS_COLOR: Record<AgentMetric["status"], string> = {
  up: "text-emerald-400",
  degraded: "text-amber-400",
  down: "text-red-400",
};

const SPARKLINE_COLOR: Record<AgentMetric["status"], string> = {
  up: "#10b981",
  degraded: "#f59e0b",
  down: "#ef4444",
};

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "error" | "neutral";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl px-3 py-2",
        tone === "error"
          ? "bg-red-950/40 ring-1 ring-red-500/20"
          : tone === "success"
          ? "bg-emerald-950/40 ring-1 ring-emerald-500/20"
          : "bg-white/5"
      )}
    >
      <span className="text-[9px] uppercase tracking-widest text-white/40 mb-0.5">
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-semibold font-mono tabular-nums",
          tone === "error"
            ? "text-red-400"
            : tone === "success"
            ? "text-emerald-400"
            : "text-white/90"
        )}
      >
        {value}
      </span>
    </div>
  );
}

interface SparkTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function SparkTooltip({ active, payload, label }: SparkTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-black/80 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur">
      <p className="text-white/50">{label}</p>
      <p className="font-mono font-semibold text-white">{payload[0].value}ms</p>
    </div>
  );
}

export function AgentCard({ agent }: { agent: AgentMetric }) {
  const uptimeTone =
    agent.uptime >= 99 ? "success" : agent.uptime >= 95 ? "neutral" : "error";

  return (
    <article className="flex flex-col rounded-2xl border border-white/8 bg-white/[0.04] p-5 backdrop-blur transition-colors hover:border-white/15 hover:bg-white/[0.06]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-white truncate">{agent.label}</h3>
          <p className="text-xs text-white/40 mt-0.5 truncate">{agent.description}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <span
            aria-hidden="true"
            className={cn("h-2 w-2 rounded-full", STATUS_DOT[agent.status])}
          />
          <span className={cn("text-xs font-medium", STATUS_COLOR[agent.status])}>
            {STATUS_LABEL[agent.status]}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-14 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={agent.series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <Tooltip content={<SparkTooltip />} />
            <Line
              type="monotone"
              dataKey="responseTime"
              stroke={SPARKLINE_COLOR[agent.status]}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: SPARKLINE_COLOR[agent.status] }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <StatPill
          label="Uptime"
          value={`${agent.uptime}%`}
          tone={uptimeTone === "neutral" ? "neutral" : uptimeTone}
        />
        <StatPill
          label="Avg ms"
          value={`${agent.avgResponseTime}`}
          tone="neutral"
        />
        <StatPill
          label="Success"
          value={String(agent.successCount)}
          tone="success"
        />
        <StatPill
          label="Errors"
          value={String(agent.errorCount)}
          tone={agent.errorCount > 0 ? "error" : "neutral"}
        />
      </div>

      {/* Current latency */}
      <p className="mt-3 text-[11px] text-white/30">
        Current latency:{" "}
        <span className="font-mono text-white/60">
          {agent.currentLatency != null ? `${agent.currentLatency}ms` : "—"}
        </span>
      </p>
    </article>
  );
}
