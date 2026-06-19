"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Search, Download, Receipt } from "lucide-react";
import { ChartCard } from "@/components/ui/ChartCard";
import { BackToTopButton } from "@/components/ui/BackToTopButton";
import { ErrorState } from "@/components/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { CeyfiTooltip } from "@/components/charts/CeyfiTooltip";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAccountContext } from "@/lib/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { lkrAxisTick } from "@/lib/chartUtils";
import {
  CATEGORY_COLORS,
  CATEGORIES,
  FALLBACK_TRANSACTIONS,
  type EnrichedTransaction,
} from "@/lib/transactionsData";
import { cn, formatters } from "@/lib/utils";

const TIME_BANDS = [
  { label: "Night", hours: [22, 23, 0, 1, 2, 3, 4, 5] },
  { label: "Morning", hours: [6, 7, 8, 9, 10, 11] },
  { label: "Afternoon", hours: [12, 13, 14, 15, 16, 17] },
  { label: "Evening", hours: [18, 19, 20, 21] },
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatNextDate(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

const RECURRING = [
  { name: "Dialog bill", amount: 2800, freq: "monthly" as const, color: "#2563EB", nextDays: 25 },
  { name: "Personal Loan EMI", amount: 22000, freq: "monthly" as const, color: "#059669", nextDays: 10 },
  { name: "Netflix", amount: 1750, freq: "monthly" as const, color: "#E11D48", nextDays: 12 },
  { name: "Keells delivery", amount: 3500, freq: "weekly" as const, color: "#D97706", nextDays: 3 },
];

function weekLabel(dateStr: string) {
  const d = new Date(dateStr);
  const month = d.toLocaleDateString("en", { month: "short" });
  const week = Math.ceil(d.getDate() / 7);
  return `${month} W${week}`;
}

function enrichBasic(
  txs: Array<{
    id: string;
    date: string;
    description: string;
    amount_lkr: number;
    type: "credit" | "debit";
  }>
): EnrichedTransaction[] {
  return txs.map((t) => {
    const match = FALLBACK_TRANSACTIONS.find((f) => f.id === t.id);
    if (match) return match;
    const desc = t.description.toLowerCase();
    const category = desc.includes("salary")
      ? "Income"
      : desc.includes("loan") || desc.includes("emi")
        ? "Loan"
        : desc.includes("keells") || desc.includes("food")
          ? "Food & Dining"
          : desc.includes("dialog") || desc.includes("ceb") || desc.includes("school")
            ? "Bills & Utilities"
            : desc.includes("pickme") || desc.includes("uber")
              ? "Transport"
              : desc.includes("hospital")
                ? "Healthcare"
                : "Shopping";
    const merchant = t.description.split("·")[0]?.trim() ?? "Other";
    const d = new Date(t.date);
    return {
      ...t,
      category,
      merchant,
      hour: 12,
      weekday: d.getDay(),
    };
  });
}

export default function TransactionsPage() {
  const { userId } = useCurrentUser();
  const [transactions, setTransactions] = useState(FALLBACK_TRANSACTIONS);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "debit" | "credit">("all");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [heatmapFilter, setHeatmapFilter] = useState<{
    band: number;
    weekday: number;
  } | null>(null);
  const [anomalyTip, setAnomalyTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const perPage = 15;

  const loadTransactions = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    getAccountContext(userId)
      .then((data) => {
        const ctx = data as { recent_transactions?: typeof FALLBACK_TRANSACTIONS };
        if (ctx.recent_transactions?.length) {
          setTransactions(enrichBasic(ctx.recent_transactions));
        }
        setLoadError(null);
      })
      .catch(() => {
        setLoadError("Using demo transactions — live account data unavailable.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadTransactions();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTransactions]);

  const weeklyAmount = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === "debit")
      .forEach((t) => {
        const w = weekLabel(t.date);
        map.set(w, (map.get(w) ?? 0) + Math.abs(t.amount_lkr));
      });
    return Array.from(map.entries())
      .map(([week, amount]) => ({ week, amount }))
      .slice(-8);
  }, [transactions]);

  const weeklyCount = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((t) => {
      const w = weekLabel(t.date);
      map.set(w, (map.get(w) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([week, count]) => ({ week, count }))
      .slice(-8);
  }, [transactions]);

  const topCategories = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === "debit" && t.category !== "Loan")
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount_lkr));
      });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));
  }, [transactions]);

  const topMerchants = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === "debit")
      .forEach((t) => {
        map.set(t.merchant, (map.get(t.merchant) ?? 0) + Math.abs(t.amount_lkr));
      });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([merchant, amount]) => ({ merchant, amount }));
  }, [transactions]);

  const heatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 4 }, () => Array(7).fill(0));
    transactions
      .filter((t) => t.type === "debit")
      .forEach((t) => {
        const band = TIME_BANDS.findIndex((b) => b.hours.includes(t.hour));
        if (band >= 0) grid[band][t.weekday]++;
      });
    return grid;
  }, [transactions]);

  const scatterData = useMemo(() => {
    const debits = transactions.filter((t) => t.type === "debit");
    const amounts = debits.map((t) => Math.abs(t.amount_lkr));
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const std = Math.sqrt(
      amounts.reduce((s, v) => s + (v - mean) ** 2, 0) / amounts.length
    );
    return debits.map((t, i) => {
      const amt = Math.abs(t.amount_lkr);
      const isAnomaly = amt > mean + 2 * std;
      return {
        day: i % 30,
        amount: amt,
        anomaly: isAnomaly,
        tip: isAnomaly
          ? `This is ${(amt / mean).toFixed(1)}× your average ${t.category.toLowerCase()} spend`
          : "",
        desc: t.description,
      };
    });
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (query && !t.description.toLowerCase().includes(query.toLowerCase()))
        return false;
      if (category !== "all" && t.category !== category) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (heatmapFilter) {
        const band = TIME_BANDS[heatmapFilter.band];
        if (
          t.weekday !== heatmapFilter.weekday ||
          !band.hours.includes(t.hour) ||
          t.type !== "debit"
        ) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, query, category, typeFilter, heatmapFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const heatColor = (count: number) => {
    if (count === 0) return "bg-ceyfi-canvas";
    if (count <= 2) return "bg-emerald-100";
    if (count <= 5) return "bg-emerald-300";
    return "bg-emerald-600 text-white";
  };

  function exportCsv() {
    const header = ["Date", "Description", "Category", "Type", "Amount (LKR)"];
    const rows = filtered.map((t) => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.type,
      String(Math.abs(t.amount_lkr)),
    ]);
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ceyfi-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="stagger mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8 xl:p-10">
      <BackToTopButton threshold={500} />
      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-72" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      ) : (
        <>
      <header>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ceyfi-green">
          Transaction analytics
        </div>
        <h1 className="mt-2 font-heading text-[2rem] font-semibold tracking-[-0.035em] text-ceyfi-ink">
          Follow every rupee
        </h1>
        <p className="mt-2 text-sm text-ceyfi-muted">
          Overview, analytics, and a filterable ledger — all offline-ready.
        </p>
        {loadError ? (
          <div className="mt-4">
            <ErrorState
              title="Live data unavailable"
              message={loadError}
              onRetry={loadTransactions}
            />
          </div>
        ) : null}
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-ceyfi-canvas">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Transaction amount over time" subtitle="Weekly debit totals">
              <ChartContainer height={220}>
                <BarChart data={weeklyAmount} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#D8E8DC" strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={lkrAxisTick} tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={(p) => <CeyfiTooltip {...p} />} />
                  <Bar dataKey="amount" fill="#059669" radius={[3, 3, 0, 0]} name="Amount" />
                </BarChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard title="Transaction count over time" subtitle="Weekly volume">
              <ChartContainer height={220}>
                <BarChart data={weeklyCount} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#D8E8DC" strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={(p) => <CeyfiTooltip {...p} valueFormatter={(v) => `${v}`} />} />
                  <Bar dataKey="count" fill="#2563EB" radius={[3, 3, 0, 0]} name="Count" />
                </BarChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard title="Top 5 categories" subtitle="By spend">
              <ChartContainer height={220}>
                <BarChart layout="vertical" data={topCategories} margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="#D8E8DC" strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={lkrAxisTick} tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 9, fill: "#617267" }} width={100} axisLine={false} tickLine={false} />
                  <Tooltip content={(p) => <CeyfiTooltip {...p} />} />
                  <Bar dataKey="amount" fill="#D97706" radius={[0, 3, 3, 0]} name="Amount" />
                </BarChart>
              </ChartContainer>
            </ChartCard>

            <ChartCard title="Top 5 merchants" subtitle="By spend">
              <ChartContainer height={220}>
                <BarChart layout="vertical" data={topMerchants} margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke="#D8E8DC" strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={lkrAxisTick} tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="merchant" tick={{ fontSize: 9, fill: "#617267" }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip content={(p) => <CeyfiTooltip {...p} />} />
                  <Bar dataKey="amount" fill="#7C3AED" radius={[0, 3, 3, 0]} name="Amount" />
                </BarChart>
              </ChartContainer>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ChartCard title="When do you spend?" subtitle="Tap a cell to filter the transactions table">
            {heatmapFilter ? (
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-ceyfi-sprout px-2.5 py-1 text-[10px] font-semibold text-ceyfi-green">
                  Filter: {WEEKDAYS[heatmapFilter.weekday]} · {TIME_BANDS[heatmapFilter.band].label}
                </span>
                <button
                  type="button"
                  onClick={() => setHeatmapFilter(null)}
                  className="text-[10px] font-semibold text-ceyfi-muted hover:text-ceyfi-ink"
                >
                  Clear
                </button>
              </div>
            ) : null}
            <div className="overflow-x-auto">
              <div className="inline-grid min-w-[320px] gap-1" style={{ gridTemplateColumns: `48px repeat(7, 1fr)` }}>
                <div />
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-[9px] font-semibold text-ceyfi-muted">{d}</div>
                ))}
                {TIME_BANDS.map((band, ri) => (
                  <Fragment key={band.label}>
                    <div className="flex items-center text-[9px] font-medium text-ceyfi-muted">{band.label}</div>
                    {WEEKDAYS.map((_, ci) => {
                      const count = heatmap[ri][ci];
                      const selected =
                        heatmapFilter?.band === ri && heatmapFilter?.weekday === ci;
                      return (
                        <button
                          key={`${ri}-${ci}`}
                          type="button"
                          title={`${count} transactions · tap to filter`}
                          disabled={count === 0}
                          onClick={() => {
                            setHeatmapFilter({ band: ri, weekday: ci });
                            setTypeFilter("debit");
                            setPage(1);
                            setActiveTab("transactions");
                          }}
                          className={cn(
                            "flex h-8 items-center justify-center rounded-md text-[10px] font-semibold transition",
                            heatColor(count),
                            count > 0 && "cursor-pointer hover:ring-2 hover:ring-ceyfi-green/40",
                            selected && "ring-2 ring-ceyfi-green"
                          )}
                        >
                          {count > 0 ? count : ""}
                        </button>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Anomaly scatter plot" subtitle="Outliers beyond 2σ highlighted">
            {anomalyTip ? (
              <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{anomalyTip}</p>
            ) : null}
            <ChartContainer height={240}>
              <ScatterChart margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="#D8E8DC" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="day" name="Day" tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="amount" name="Amount" tickFormatter={lkrAxisTick} tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} width={44} />
                <ZAxis range={[64, 256]} />
                <Tooltip content={(p) => <CeyfiTooltip {...p} />} />
                <Scatter
                  name="Normal"
                  data={scatterData.filter((d) => !d.anomaly)}
                  fill="#059669"
                  fillOpacity={0.6}
                  onClick={() => setAnomalyTip(null)}
                />
                <Scatter
                  name="Anomaly"
                  data={scatterData.filter((d) => d.anomaly)}
                  fill="#E11D48"
                  fillOpacity={0.9}
                  onClick={(d) => setAnomalyTip((d as { tip?: string }).tip ?? null)}
                />
              </ScatterChart>
            </ChartContainer>
          </ChartCard>

          <ChartCard title="Recurring payment timeline" subtitle="Next 4 weeks">
            <div className="space-y-3">
              {RECURRING.map((item) => (
                <div key={item.name} className="relative">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-ceyfi-ink">{item.name}</span>
                    <span className="font-mono text-ceyfi-muted">
                      {formatters.currency({ number: item.amount, maxFractionDigits: 0 })} · {item.freq} · next {formatNextDate(item.nextDays)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-ceyfi-canvas">
                    <div
                      className="h-full rounded-full"
                      style={{ width: item.freq === "weekly" ? "25%" : "100%", backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-[22px] border border-ceyfi-line/70 bg-ceyfi-canvas p-4">
            <div className="flex rounded-lg border border-ceyfi-line bg-ceyfi-paper p-0.5">
              {(["all", "credit", "debit"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTypeFilter(t); setPage(1); }}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[11px] font-semibold",
                    typeFilter === t ? "bg-ceyfi-green text-white shadow-sm" : "text-ceyfi-muted"
                  )}
                >
                  {t === "all" ? "All" : t === "credit" ? "Credits" : "Debits"}
                </button>
              ))}
            </div>
            <Select value={category} onValueChange={(v) => { setCategory(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-[160px] bg-ceyfi-paper"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex h-9 flex-1 min-w-[160px] items-center gap-2 rounded-lg border border-ceyfi-line bg-ceyfi-paper px-3">
              <Search className="h-3.5 w-3.5 text-ceyfi-faint" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search description…"
                className="h-auto border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="border-ceyfi-line text-ceyfi-green hover:bg-ceyfi-sprout"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>

          <div className="overflow-hidden rounded-[22px] border border-ceyfi-line/70 bg-ceyfi-canvas">
            {paged.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-ceyfi-sprout">
                  <Receipt className="h-7 w-7 text-ceyfi-green" />
                </div>
                <p className="font-medium text-ceyfi-ink">No transactions found</p>
                <p className="mt-1 max-w-xs text-xs text-ceyfi-muted">
                  Try adjusting your filters or search term to see more results.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ceyfi-line/60 bg-ceyfi-paper text-[10px] font-semibold uppercase tracking-wider text-ceyfi-muted">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((t) => (
                    <tr key={t.id} className="border-b border-ceyfi-line/40 last:border-0 bg-ceyfi-paper/40">
                      <td className="px-4 py-3 font-mono text-ceyfi-faint">{t.date}</td>
                      <td className="px-4 py-3 font-medium text-ceyfi-ink">{t.description}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="border-0 text-[10px]"
                          style={{ backgroundColor: `${CATEGORY_COLORS[t.category] ?? "#64748B"}18`, color: CATEGORY_COLORS[t.category] }}
                        >
                          {t.category}
                        </Badge>
                      </td>
                      <td className={cn("px-4 py-3 text-right font-mono font-semibold", t.type === "credit" ? "text-emerald-700" : "text-ceyfi-muted")}>
                        {t.type === "credit" ? "+" : "−"}
                        {formatters.currency({ number: Math.abs(t.amount_lkr), maxFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex items-center justify-between border-t border-ceyfi-line/60 bg-ceyfi-paper px-4 py-3">
              <span className="text-[11px] text-ceyfi-muted">
                {filtered.length === 0
                  ? "0 transactions"
                  : `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)} of ${filtered.length}`}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}
