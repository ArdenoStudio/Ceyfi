"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Radar,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/ui/ChartCard";
import { BentoGridShowcase } from "@/components/blocks/BentoGridShowcase";
import { GradientBorder } from "@/components/blocks/GradientBorder";
import { CeyfiTooltip } from "@/components/charts/CeyfiTooltip";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { PeriodBadge } from "@/components/charts/PeriodBadge";
import { ProgressCircle } from "@/components/charts/OverviewCharts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { getFinancialSnapshot, type FinancialSnapshot } from "@/lib/api";
import { CHART_COLORS } from "@/lib/chartUtils";
import { useChartTheme } from "@/hooks/useChartTheme";
import { formatters } from "@/lib/utils";
import { cn } from "@/lib/utils";

const BackgroundBeams = dynamic(
  () =>
    import("@/components/aceternity/background-beams").then((m) => ({
      default: m.BackgroundBeams,
    })),
  { ssr: false }
);

const ICON_MAP = {
  TrendingUp,
  Lightbulb,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
};

export default function IntelligencePage() {
  const { colors } = useChartTheme();
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [improveTarget, setImproveTarget] = useState<FinancialSnapshot["health_components"][0] | null>(null);

  const loadSnapshot = useCallback(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    getFinancialSnapshot(user.user_id)
      .then(setSnapshot)
      .catch(() => setError("Could not load financial intelligence data."))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSnapshot();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSnapshot]);

  useEffect(() => {
    const onReset = () => loadSnapshot();
    window.addEventListener("seylan:demo-reset", onReset);
    return () => window.removeEventListener("seylan:demo-reset", onReset);
  }, [loadSnapshot]);

  const components = snapshot?.health_components ?? [];
  const anomalies = snapshot?.anomalies ?? [];
  const opportunities = snapshot?.opportunities ?? [];
  const forecast = snapshot?.forecast ?? [];
  const totalScore = snapshot?.health_score ?? 0;

  const forecastError = forecast.length > 1
    ? Math.abs((forecast[forecast.length - 1].actual - forecast[forecast.length - 1].predicted) / forecast[forecast.length - 1].actual * 100)
    : 8.3;

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6 p-4 sm:p-6 lg:p-8 xl:p-10">
      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : error && !snapshot ? (
        <ErrorState message={error} onRetry={loadSnapshot} />
      ) : (
        <>
      <header className="relative min-h-[168px] overflow-hidden rounded-[26px] border border-ceyfi-line/60 bg-gradient-to-br from-ceyfi-paper via-ceyfi-sprout/40 to-ceyfi-paper px-6 py-8 sm:px-8 dark:border-white/10 dark:from-ceyfi-deep/50 dark:via-ceyfi-deep/30 dark:to-ceyfi-deep/40">
        <BackgroundBeams className="opacity-30 dark:opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ceyfi-green">
            Financial intelligence
            {snapshot?.data_source === "live" ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Live data</span>
            ) : null}
          </div>
          <h1 className="mt-2 font-heading text-[2rem] font-semibold tracking-[-0.035em] text-ceyfi-ink dark:text-white">
            Explainable financial health
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ceyfi-muted dark:text-white/70">
            Score breakdown, anomaly feed, forecast accuracy, and ranked opportunities for {snapshot?.name ?? user?.name}.
          </p>
        </div>
      </header>

      <BentoGridShowcase
        integrations={
          <GradientBorder animationMode="rotate-on-hover" className="h-full">
            <div className="flex h-full flex-col justify-between rounded-2xl bg-ceyfi-paper p-5 dark:bg-white/[0.04]">
              <div className="flex items-center gap-2">
                <Radar className="h-5 w-5 text-ceyfi-green" />
                <span className="text-sm font-semibold text-foreground">Data feed</span>
              </div>
              <div>
                <p className="font-mono text-2xl font-semibold text-ceyfi-green">
                  {snapshot?.data_source === "live" ? "Live" : "Demo"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {snapshot?.updated_at
                    ? `Updated ${new Date(snapshot.updated_at).toLocaleDateString()}`
                    : "Snapshot ready"}
                </p>
              </div>
            </div>
          </GradientBorder>
        }
        featureTags={
          <div className="flex h-full flex-col rounded-[20px] border border-ceyfi-line/75 bg-ceyfi-paper p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ceyfi-green">
              Score drivers
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {components.slice(0, 4).map((c) => (
                <span
                  key={c.name}
                  className="rounded-full bg-ceyfi-sprout px-2.5 py-1 text-[11px] font-medium text-ceyfi-deep dark:bg-ceyfi-green/15 dark:text-ceyfi-mint"
                >
                  {c.name} · {c.score}
                </span>
              ))}
            </div>
          </div>
        }
        mainFeature={
          <GradientBorder animationMode="auto-rotate" animationSpeed={8} className="h-full">
            <div
              data-demo-target="health-score"
              className="flex h-full flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-ceyfi-deep to-[#0a4424] p-8 text-white"
            >
              <ProgressCircle value={totalScore} size={160} strokeWidth={12}>
                <div className="text-center">
                  <div
                    className={cn(
                      "font-heading text-5xl font-semibold tracking-[-0.05em]",
                      totalScore >= 80
                        ? "text-ceyfi-mint"
                        : totalScore >= 60
                          ? "text-amber-300"
                          : "text-rose-300"
                    )}
                  >
                    {totalScore || "—"}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                    Health score
                  </div>
                </div>
              </ProgressCircle>
              <p className="mt-4 text-center text-xs text-white/70">
                Weighted across {components.length} financial dimensions
              </p>
            </div>
          </GradientBorder>
        }
        secondaryFeature={
          <div className="flex h-full flex-col justify-between rounded-[20px] border border-border/75 bg-card p-5 interactive-card">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold">Anomalies</span>
            </div>
            <div>
              <p className="font-heading text-4xl font-semibold text-foreground">
                {anomalies.filter((a) => !a.resolved).length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {anomalies.length === 0
                  ? "All clear — no flags"
                  : `${anomalies.filter((a) => a.resolved).length} resolved`}
              </p>
            </div>
          </div>
        }
        statistic={
          <div className="flex h-full flex-col justify-between rounded-[20px] bg-ceyfi-sprout p-6 dark:bg-ceyfi-green/10">
            <Target className="h-7 w-7 text-ceyfi-green" />
            <div>
              <p className="font-heading text-5xl font-bold tracking-tight text-ceyfi-deep dark:text-white">
                ±{forecastError.toFixed(1)}%
              </p>
              <p className="mt-2 text-sm text-ceyfi-muted dark:text-white/60">
                Forecast accuracy — actual vs CEYFI prediction from day −7
              </p>
            </div>
          </div>
        }
        journey={
          opportunities[0] ? (
            <Link
              href="/scenarios"
              className="group flex h-full flex-col justify-between rounded-[20px] border border-ceyfi-green/20 bg-gradient-to-br from-ceyfi-paper to-ceyfi-sprout p-5 transition hover:border-ceyfi-green/40 dark:from-white/[0.06] dark:to-ceyfi-green/10"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-ceyfi-green" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ceyfi-green">
                  Top opportunity
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground line-clamp-2">{opportunities[0].title}</p>
                {opportunities[0].benefit > 0 && (
                  <p className="mt-1 font-mono text-sm font-semibold text-ceyfi-green">
                    +{formatters.currency({ number: opportunities[0].benefit, maxFractionDigits: 0 })}
                  </p>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ceyfi-green group-hover:gap-2 transition-all">
                Simulate <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[20px] border border-dashed border-ceyfi-line/60 p-5 text-xs text-muted-foreground">
              No opportunities yet
            </div>
          )
        }
      />

      <ChartCard title="Score components" subtitle="Weighted breakdown with improve actions">
          <ChartContainer height={240}>
            <BarChart layout="vertical" data={components} margin={{ top: 4, right: 80, left: 4, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke={colors.grid} strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: colors.axis }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: colors.label }} width={110} axisLine={false} tickLine={false} />
              <Tooltip content={(p) => <CeyfiTooltip {...p} valueFormatter={(v) => `${v}/100`} />} />
              <Bar dataKey="score" fill={CHART_COLORS.green} radius={[0, 4, 4, 0]} name="Score" />
            </BarChart>
          </ChartContainer>
          <div className="mt-4 space-y-2">
            {components.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
                <div>
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="ml-2 text-muted-foreground">— {c.insight}</span>
                </div>
                <Button variant="outline" size="sm" className="text-[10px]" onClick={() => setImproveTarget(c)}>
                  Improve
                </Button>
              </div>
            ))}
          </div>
        </ChartCard>

      <ChartCard title="Anomaly feed" subtitle="AI-detected financial events">
        <div className="space-y-3">
          {anomalies.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No anomalies detected"
              description="Recent transactions look normal. CEYFI will flag unusual spending here."
            />
          ) : (
            anomalies.map((a) => (
              <div key={a.id} className="interactive-card flex items-start gap-3 rounded-xl border border-border/60 p-4">
                <span className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", a.resolved ? "bg-emerald-500" : "animate-pulse bg-amber-500")} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">{a.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{a.description}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground/70">{a.date}</div>
                </div>
                <Link href={`/assistant?prompt=${encodeURIComponent(a.title)}`} className="shrink-0 text-[11px] font-semibold text-primary hover:text-primary/80">
                  Ask CEYFI
                </Link>
              </div>
            ))
          )}
        </div>
      </ChartCard>

      <ChartCard
        title="How accurate were last month's projections?"
        subtitle="Actual vs CEYFI forecast from day −7"
        action={<PeriodBadge value={forecastError} positive={false} label={`±${forecastError.toFixed(1)}% avg error`} />}
      >
        <ChartContainer height={240}>
          <ComposedChart data={forecast} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 8, fill: colors.axis }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 9, fill: colors.axis }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={(p) => <CeyfiTooltip {...p} />} />
            <Bar dataKey="actual" fill={CHART_COLORS.green} name="Actual" radius={[2, 2, 0, 0]} />
            <Line type="monotone" dataKey="predicted" stroke={CHART_COLORS.violet} strokeWidth={2} dot={false} name="Predicted" />
          </ComposedChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Financial opportunities" subtitle="Ranked by potential benefit">
        <div className="space-y-3">
          {opportunities.length === 0 ? (
            <EmptyState
              icon={Lightbulb}
              title="No opportunities yet"
              description="Run a scenario or connect live data to see ranked recommendations."
            />
          ) : (
            opportunities.map((o, i) => {
            const Icon = ICON_MAP[o.icon as keyof typeof ICON_MAP] ?? Lightbulb;
            return (
              <div key={o.title} className="interactive-card flex items-center gap-4 rounded-xl border border-border/60 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">{i + 1}. {o.title}</div>
                  {o.benefit > 0 && (
                    <div className="mt-1 font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      +{formatters.currency({ number: o.benefit, maxFractionDigits: 0 })}
                    </div>
                  )}
                </div>
                <PeriodBadge value={o.confidence} positive label={`${o.confidence}%`} />
                <Link href="/scenarios" className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  Simulate <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })
          )}
        </div>
      </ChartCard>

      <Sheet open={!!improveTarget} onOpenChange={(o) => !o && setImproveTarget(null)}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Improve {improveTarget?.name}</SheetTitle>
          </SheetHeader>
          <ul className="mt-4 space-y-3 px-4">
            {improveTarget?.actions.map((action) => (
              <li key={action} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {action}
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
        </>
      )}
    </div>
  );
}
