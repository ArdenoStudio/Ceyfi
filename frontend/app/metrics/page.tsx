"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Zap, CheckCircle, XCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentCard } from "./components/AgentCard";
import { ResponseTimeChart } from "./components/ResponseTimeChart";
import { SuccessErrorChart } from "./components/SuccessErrorChart";
import type { AgentMetric, MetricsData } from "./types";

const REFRESH_INTERVAL = 30_000;

function OverallStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "success" | "error" | "neutral";
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card/80 p-4 backdrop-blur dark:border-white/8 dark:bg-white/[0.04]">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground dark:text-white/40 mb-1">{label}</span>
      <span
        className={cn(
          "text-2xl font-semibold font-mono tabular-nums",
          tone === "error"
            ? "text-red-600 dark:text-red-400"
            : tone === "success"
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-foreground dark:text-white"
        )}
      >
        {value}
      </span>
      {sub && <span className="text-[11px] text-muted-foreground/80 dark:text-white/30 mt-0.5">{sub}</span>}
    </div>
  );
}

export default function MetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);

  const fetchMetrics = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/metrics", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      const json: MetricsData = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setCountdown(REFRESH_INTERVAL / 1000);
    } catch {
      // keep stale data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => fetchMetrics(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL / 1000 : c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const agents: AgentMetric[] = data?.agents ?? [];
  const upAgents = agents.filter((a) => a.status === "up").length;
  const totalSuccess = agents.reduce((s, a) => s + a.successCount, 0);
  const totalErrors = agents.reduce((s, a) => s + a.errorCount, 0);
  const avgLatency = agents.length
    ? Math.round(agents.reduce((s, a) => s + a.avgResponseTime, 0) / agents.length)
    : 0;
  const overallUptime = agents.length
    ? (agents.reduce((s, a) => s + a.uptime, 0) / agents.length).toFixed(1)
    : "—";

  const overallStatus =
    agents.length === 0
      ? "loading"
      : agents.every((a) => a.status === "up")
      ? "operational"
      : agents.some((a) => a.status === "down")
      ? "outage"
      : "degraded";

  const STATUS_BANNER: Record<string, { label: string; color: string; bg: string }> = {
    operational: { label: "All Systems Operational", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    degraded: { label: "Partial Degradation", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    outage: { label: "Service Outage Detected", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
    loading: { label: "Loading metrics…", color: "text-muted-foreground dark:text-white/40", bg: "bg-muted border-border dark:bg-white/5 dark:border-white/10" },
  };

  const banner = STATUS_BANNER[overallStatus];

  return (
    <div
      data-module="metrics"
      className="relative min-h-full overflow-hidden"
    >
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-8%,rgba(227,24,33,0.12),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-[radial-gradient(ellipse_55%_35%_at_50%_110%,rgba(114,28,36,0.08),transparent)]" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 space-y-6 p-4 sm:space-y-7 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-seylan-red mb-1">
              Nasiko · Arize Phoenix
            </p>
            <h1 className="font-heading text-2xl font-bold text-foreground dark:text-white">
              Agent Performance
            </h1>
            <p className="text-sm text-muted-foreground dark:text-white/40 mt-1">
              Per-agent metrics for the last 24 hours
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={() => fetchMetrics(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              Refresh
            </button>
            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground/70 dark:text-white/25">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {" · "}next in {countdown}s
              </span>
            )}
            {data?.phoenixConnected && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live from Phoenix
              </span>
            )}
          </div>
        </div>

        {/* Status banner */}
        <div className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3", banner.bg)}>
          <Activity className={cn("h-4 w-4 shrink-0", banner.color)} />
          <span className={cn("text-sm font-medium", banner.color)}>{banner.label}</span>
          <span className="ml-auto text-xs text-white/30">
            {upAgents}/{agents.length} agents operational
          </span>
        </div>

        {/* Overall stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <OverallStat
            label="Avg Uptime"
            value={`${overallUptime}%`}
            sub="across all agents"
            tone={
              parseFloat(overallUptime) >= 99
                ? "success"
                : parseFloat(overallUptime) >= 95
                ? "neutral"
                : "error"
            }
          />
          <OverallStat
            label="Avg Latency"
            value={`${avgLatency}ms`}
            sub="p50 response time"
          />
          <OverallStat
            label="Total Calls"
            value={(totalSuccess + totalErrors).toLocaleString()}
            sub="last 24 hours"
            tone="success"
          />
          <OverallStat
            label="Total Errors"
            value={totalErrors.toLocaleString()}
            sub="last 24 hours"
            tone={totalErrors > 0 ? "error" : "neutral"}
          />
        </div>

        {/* Agent cards */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-2xl border border-white/8 bg-white/[0.03] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard key={agent.key} agent={agent} />
            ))}
          </div>
        )}

        {/* Charts */}
        {!loading && agents.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ResponseTimeChart agents={agents} />
            <SuccessErrorChart agents={agents} />
          </div>
        )}

        {/* Footer */}
        <footer className="flex items-center justify-between gap-4 border-t border-white/8 pt-4 text-[11px] text-white/25">
          <span>
            {data?.phoenixConnected
              ? "Real-time data via Arize Phoenix · Nasiko Agent Control Plane"
              : "Synthetic fallback — connect Phoenix at PHOENIX_URL to see live data"}
          </span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-500/60" />
              {totalSuccess.toLocaleString()} success
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500/60" />
              {totalErrors.toLocaleString()} errors
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-500/60" />
              {avgLatency}ms avg
            </span>
          </span>
        </footer>
      </div>
    </div>
  );
}
