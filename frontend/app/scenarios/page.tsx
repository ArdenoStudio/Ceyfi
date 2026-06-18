"use client";

import { useMemo, useState } from "react";
import { FlaskConical, RotateCcw, Save } from "lucide-react";
import { ScenarioFanChart } from "@/components/charts/ScenarioFanChart";
import { ChartCard } from "@/components/ui/ChartCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CHART_COLORS } from "@/lib/chartUtils";
import { cn, formatters } from "@/lib/utils";

interface SavedScenario {
  id: string;
  name: string;
  date: string;
  worstCase: number;
  shocks: ShockState;
}

interface ShockState {
  salaryDelay: { enabled: boolean; days: number };
  fxDepreciation: { enabled: boolean; pct: number; currency: string };
  expenseSpike: { enabled: boolean; pct: number };
  emergencyCost: number;
  interestChange: number;
}

const DEFAULT_SHOCKS: ShockState = {
  salaryDelay: { enabled: false, days: 0 },
  fxDepreciation: { enabled: false, pct: 0, currency: "GBP" },
  expenseSpike: { enabled: false, pct: 0 },
  emergencyCost: 0,
  interestChange: 0,
};

function computeImpact(shocks: ShockState): number {
  let impact = 0;
  if (shocks.salaryDelay.enabled) impact -= shocks.salaryDelay.days * 6200;
  if (shocks.fxDepreciation.enabled) impact -= shocks.fxDepreciation.pct * 800;
  if (shocks.expenseSpike.enabled) impact -= shocks.expenseSpike.pct * 420;
  impact -= shocks.emergencyCost;
  impact -= Math.abs(shocks.interestChange) * 12000;
  return Math.round(impact);
}

function buildPaths(shocks: ShockState) {
  const base = 245000;
  const impact = computeImpact(shocks);
  const dates = Array.from({ length: 90 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString("en", { month: "short", day: "numeric" });
  });

  const makePath = (mult: number, id: string, label: string, color: string) => ({
    id,
    label,
    color,
    data: dates.map((date, i) => ({
      date,
      balance: Math.max(
        8000,
        Math.round(base + impact * (i / 90) * mult + Math.sin(i / 7) * 3000 - i * 180)
      ),
    })),
  });

  return [
    makePath(1.4, "pessimistic", "Pessimistic", CHART_COLORS.rose),
    makePath(1, "base", "Base case", CHART_COLORS.green),
    makePath(0.6, "optimistic", "Optimistic", CHART_COLORS.mint),
  ];
}

export default function ScenariosPage() {
  const [shocks, setShocks] = useState<ShockState>(DEFAULT_SHOCKS);
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [scenarioName, setScenarioName] = useState("");

  const paths = useMemo(() => buildPaths(shocks), [shocks]);
  const impact = computeImpact(shocks);
  const minBalance = Math.min(...paths[0].data.map((d) => d.balance));
  const runway = Math.max(0.5, minBalance / 42000);
  const shortfallProb = Math.min(95, Math.max(5, 30 - impact / 8000));

  const saveScenario = () => {
    const name = scenarioName.trim() || `Scenario ${saved.length + 1}`;
    setSaved((prev) => [
      { id: `s${Date.now()}`, name, date: new Date().toLocaleDateString(), worstCase: minBalance, shocks: { ...shocks } },
      ...prev,
    ].slice(0, 4));
    setScenarioName("");
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6 p-4 sm:p-6 lg:p-8 xl:p-10">
      <header>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ceyfi-green">
          <FlaskConical className="h-3.5 w-3.5" />
          Scenario laboratory
        </div>
        <h1 className="mt-2 font-heading text-[2rem] font-semibold tracking-[-0.035em] text-ceyfi-ink">
          Model financial shocks
        </h1>
        <p className="mt-2 text-sm text-ceyfi-muted">
          Adjust simultaneous shocks and see 90-day fan chart projections update live.
        </p>
      </header>

      <ChartCard title="Shock controls" subtitle="Toggle and tune each scenario input">
        <div className="space-y-5">
          {[
            {
              key: "salaryDelay" as const,
              label: "Salary delay",
              enabled: shocks.salaryDelay.enabled,
              value: shocks.salaryDelay.days,
              max: 30,
              unit: "days",
              onToggle: (v: boolean) => setShocks((s) => ({ ...s, salaryDelay: { ...s.salaryDelay, enabled: v } })),
              onChange: (v: number) => setShocks((s) => ({ ...s, salaryDelay: { ...s.salaryDelay, days: v } })),
            },
            {
              key: "fxDepreciation" as const,
              label: "FX depreciation",
              enabled: shocks.fxDepreciation.enabled,
              value: shocks.fxDepreciation.pct,
              max: 40,
              unit: "%",
              onToggle: (v: boolean) => setShocks((s) => ({ ...s, fxDepreciation: { ...s.fxDepreciation, enabled: v } })),
              onChange: (v: number) => setShocks((s) => ({ ...s, fxDepreciation: { ...s.fxDepreciation, pct: v } })),
            },
            {
              key: "expenseSpike" as const,
              label: "Expense spike",
              enabled: shocks.expenseSpike.enabled,
              value: shocks.expenseSpike.pct,
              max: 100,
              unit: "%",
              onToggle: (v: boolean) => setShocks((s) => ({ ...s, expenseSpike: { ...s.expenseSpike, enabled: v } })),
              onChange: (v: number) => setShocks((s) => ({ ...s, expenseSpike: { ...s.expenseSpike, pct: v } })),
            },
          ].map((row) => (
            <div key={row.key} className="rounded-xl border border-ceyfi-line/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ceyfi-ink">{row.label}</span>
                <button
                  type="button"
                  onClick={() => row.onToggle(!row.enabled)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    row.enabled ? "bg-ceyfi-green text-white" : "bg-ceyfi-canvas text-ceyfi-muted"
                  )}
                >
                  {row.enabled ? "On" : "Off"}
                </button>
              </div>
              <Slider
                className="mt-3"
                value={[row.value]}
                min={0}
                max={row.max}
                disabled={!row.enabled}
                onValueChange={(v) => row.onChange(Array.isArray(v) ? (v[0] ?? 0) : v)}
              />
              <div className="mt-1 text-[10px] text-ceyfi-faint">
                {row.value} {row.unit} · ({formatters.currency({ number: impact, maxFractionDigits: 0 })} projected impact)
              </div>
            </div>
          ))}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-ceyfi-line/60 p-4">
              <label className="text-sm font-medium text-ceyfi-ink">Emergency cost (LKR)</label>
              <Input
                type="number"
                className="mt-2"
                value={shocks.emergencyCost}
                onChange={(e) => setShocks((s) => ({ ...s, emergencyCost: Number(e.target.value) }))}
              />
            </div>
            <div className="rounded-xl border border-ceyfi-line/60 p-4">
              <label className="text-sm font-medium text-ceyfi-ink">Interest rate change</label>
              <Slider
                className="mt-4"
                value={[shocks.interestChange]}
                min={-5}
                max={5}
                step={0.5}
                onValueChange={(v) => setShocks((s) => ({ ...s, interestChange: Array.isArray(v) ? (v[0] ?? 0) : v }))}
              />
              <div className="mt-1 text-[10px] text-ceyfi-faint">{shocks.interestChange > 0 ? "+" : ""}{shocks.interestChange}%</div>
            </div>
          </div>

          {shocks.fxDepreciation.enabled && (
            <Select
              value={shocks.fxDepreciation.currency}
              onValueChange={(v) => setShocks((s) => ({ ...s, fxDepreciation: { ...s.fxDepreciation, currency: v ?? "GBP" } }))}
            >
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AED">AED</SelectItem>
                <SelectItem value="AUD">AUD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setShocks(DEFAULT_SHOCKS)}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset all
            </Button>
            <div className="flex flex-1 gap-2">
              <Input placeholder="Scenario name" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} className="max-w-[200px]" />
              <Button size="sm" className="bg-ceyfi-green text-white" onClick={saveScenario}>
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save
              </Button>
            </div>
          </div>
        </div>
      </ChartCard>

      <ChartCard title="90-day projection fan" subtitle="Pessimistic · base · optimistic paths">
        <ScenarioFanChart paths={paths} height={300} />
      </ChartCard>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Min projected balance", value: formatters.currency({ number: minBalance, maxFractionDigits: 0 }), danger: minBalance < 20000 },
          { label: "Financial runway", value: `${runway.toFixed(1)} months`, danger: runway < 2 },
          { label: "Shortfall probability", value: `${shortfallProb.toFixed(0)}%`, danger: shortfallProb > 40 },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-ceyfi-line/70 bg-ceyfi-paper p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ceyfi-muted">{m.label}</div>
            <div className={cn("mt-2 font-heading text-2xl font-semibold", m.danger ? "text-rose-700" : "text-ceyfi-ink")}>{m.value}</div>
          </div>
        ))}
      </section>

      {saved.length > 0 && (
        <ChartCard title="Saved scenarios" subtitle="Up to 4 scenarios">
          <div className="space-y-3">
            {saved.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-ceyfi-line/60 p-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ceyfi-ink">{s.name}</div>
                  <div className="text-[10px] text-ceyfi-faint">{s.date} · Worst {formatters.currency({ number: s.worstCase, maxFractionDigits: 0 })}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShocks(s.shocks)}>Load</Button>
                <Button variant="outline" size="sm" onClick={() => setSaved((prev) => prev.filter((x) => x.id !== s.id))}>Delete</Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selected.length >= 2 && !selected.includes(s.id)}
                  onClick={() => setSelected((prev) => prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id])}
                >
                  {selected.includes(s.id) ? "Selected" : "Compare"}
                </Button>
              </div>
            ))}
            {selected.length >= 2 && (
              <p className="text-xs text-ceyfi-muted">Comparing {selected.length} scenarios — load each to inspect side by side.</p>
            )}
          </div>
        </ChartCard>
      )}
    </div>
  );
}
