"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/ui/ChartCard";
import { CeyfiTooltip } from "@/components/charts/CeyfiTooltip";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CHART_COLORS, seriesColor } from "@/lib/chartUtils";
import { formatters } from "@/lib/utils";
import { getReceivables, postRecoveryMessage, type ReceivableRow } from "@/lib/api";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";

const WATERFALL_STEPS = [
  { name: "Revenue", value: 450000 },
  { name: "COGS", value: -180000 },
  { name: "Gross Profit", value: 270000, subtotal: true },
  { name: "OpEx", value: -90000 },
  { name: "EBIT", value: 180000, subtotal: true },
  { name: "Taxes", value: -36000 },
  { name: "Net Profit", value: 144000, total: true },
];

function buildWaterfall() {
  let running = 0;
  return WATERFALL_STEPS.map((step) => {
    const start = step.subtotal || step.total ? 0 : running;
    if (!step.subtotal && !step.total) running += step.value;
    else if (step.subtotal) running = step.value;
    else if (step.total) running = step.value;
    const display = step.subtotal || step.total ? step.value : Math.abs(step.value);
    return {
      ...step,
      base: step.value < 0 && !step.subtotal && !step.total ? running : start,
      height: display,
      fill: step.total ? "#052E16" : step.value >= 0 ? CHART_COLORS.green : CHART_COLORS.rose,
    };
  });
}

const TREEMAP_DATA = [
  { name: "Staff", size: 35 },
  { name: "Inventory", size: 25 },
  { name: "Marketing", size: 15 },
  { name: "Rent", size: 12 },
  { name: "Utilities", size: 8 },
  { name: "Other", size: 5 },
];

const TREND_DATA = [
  { month: "Jan", revenue: 380000, expenses: 290000, margin: 23.7 },
  { month: "Feb", revenue: 410000, expenses: 305000, margin: 25.6 },
  { month: "Mar", revenue: 395000, expenses: 298000, margin: 24.6 },
  { month: "Apr", revenue: 420000, expenses: 310000, margin: 26.2 },
  { month: "May", revenue: 440000, expenses: 318000, margin: 27.7 },
  { month: "Jun", revenue: 450000, expenses: 306000, margin: 32.0 },
];

const STATUS_COLORS = {
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  orange: "bg-orange-50 text-orange-700",
  red: "bg-rose-50 text-rose-700",
};

function TreemapContent(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  size?: number;
  index?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, name = "", size = 0, index = 0 } = props;
  if (width < 30 || height < 20) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={seriesColor(index)} fillOpacity={0.85} rx={4} />
      <text x={x + 6} y={y + 16} fill="#fff" fontSize={10} fontWeight={600}>{name}</text>
      <text x={x + 6} y={y + 30} fill="#fff" fontSize={9} opacity={0.9}>{size}%</text>
    </g>
  );
}

function RecoveryDialog({ row }: { row: ReceivableRow }) {
  const [messages, setMessages] = useState<{ en: string; si: string; ta: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await postRecoveryMessage({
        client: row.client,
        invoice: row.invoice,
        amount: row.amount,
        overdue_days: row.overdue,
        tone: row.overdue > 30 ? "urgent" : "friendly",
      });
      setMessages(res.messages);
    } catch {
      toast.error("Could not generate recovery message");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Payment reminder · {row.client}</DialogTitle>
      </DialogHeader>
      {!messages ? (
        <Button onClick={load} disabled={loading} className="bg-ceyfi-green text-white">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Generate AI message (EN / SI / TA)
        </Button>
      ) : (
        <div className="space-y-3 text-sm">
          {(["en", "si", "ta"] as const).map((lang) => (
            <div key={lang} className="rounded-lg bg-ceyfi-canvas p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase text-ceyfi-muted">{lang}</span>
                <button type="button" onClick={() => copy(messages[lang])} className="text-ceyfi-green">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className={lang === "si" ? "sinhala text-ceyfi-ink" : "text-ceyfi-ink"}>{messages[lang]}</p>
            </div>
          ))}
        </div>
      )}
    </DialogContent>
  );
}

export function BusinessAnalyticsSections() {
  const waterfall = useMemo(() => buildWaterfall(), []);
  const [receivables, setReceivables] = useState<ReceivableRow[]>([]);
  const [predictions, setPredictions] = useState<{ client: string; expected_payment_date: string; confidence: number }[]>([]);

  useEffect(() => {
    getReceivables()
      .then((r) => {
        setReceivables(r.receivables);
        setPredictions(r.predictions as typeof predictions);
      })
      .catch(() => setReceivables([]));
  }, []);

  return (
    <div className="space-y-6">
      <ChartCard title="Where did revenue go?" subtitle="Cash-flow waterfall">
        <ChartContainer height={280}>
          <BarChart data={waterfall} margin={{ top: 20, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#D8E8DC" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#8C9A91" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip content={(p) => <CeyfiTooltip {...p} />} />
            <Bar dataKey="height" stackId="a" radius={[3, 3, 0, 0]}>
              {waterfall.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Expense distribution" subtitle="Click to drill down">
        <ChartContainer height={240}>
          <Treemap
            data={TREEMAP_DATA}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            content={<TreemapContent />}
          />
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Revenue vs expenses · 6 months" subtitle="Net profit margin overlay">
        <ChartContainer height={260}>
          <ComposedChart data={TREND_DATA} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#D8E8DC" strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8C9A91" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: "#8C9A91" }} axisLine={false} tickLine={false} width={36} unit="%" />
            <Tooltip content={(p) => <CeyfiTooltip {...p} />} />
            <Bar yAxisId="left" dataKey="revenue" fill={CHART_COLORS.green} name="Revenue" radius={[3, 3, 0, 0]} />
            <Bar yAxisId="left" dataKey="expenses" fill={CHART_COLORS.amber} name="Expenses" radius={[3, 3, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="margin" stroke={CHART_COLORS.violet} strokeWidth={2} dot={false} name="Margin %" />
          </ComposedChart>
        </ChartContainer>
      </ChartCard>

      {predictions.length > 0 && (
        <ChartCard title="Payment prediction" subtitle="Expected incoming payments">
          <div className="grid gap-2 sm:grid-cols-2">
            {predictions.slice(0, 4).map((p) => (
              <div key={p.client} className="rounded-lg border border-ceyfi-line/60 bg-ceyfi-canvas px-3 py-2 text-xs">
                <div className="font-medium text-ceyfi-ink">{p.client}</div>
                <div className="mt-1 text-ceyfi-muted">
                  Expected {p.expected_payment_date} · {p.confidence}% confidence
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      <ChartCard title="Outstanding receivables" subtitle="Trust scores + AI recovery messages">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-ceyfi-line/60 text-[10px] font-semibold uppercase text-ceyfi-muted">
                <th className="py-2 pr-3">Client</th>
                <th className="py-2 pr-3">Invoice</th>
                <th className="py-2 pr-3">Amount</th>
                <th className="py-2 pr-3">Trust</th>
                <th className="py-2 pr-3">Overdue</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {receivables.map((row) => (
                <tr key={row.invoice} className="border-b border-ceyfi-line/40">
                  <td className="py-3 pr-3 font-medium text-ceyfi-ink">{row.client}</td>
                  <td className="py-3 pr-3 font-mono text-ceyfi-muted">{row.invoice}</td>
                  <td className="py-3 pr-3 font-mono font-semibold">{formatters.currency({ number: row.amount, maxFractionDigits: 0 })}</td>
                  <td className="py-3 pr-3">
                    <span className="rounded-full bg-ceyfi-canvas px-2 py-0.5 font-mono text-[10px] font-semibold text-ceyfi-ink">
                      {row.trust_score}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[row.status as keyof typeof STATUS_COLORS]}`}>
                      {row.overdue > 0 ? `${row.overdue}d` : "Current"}
                    </span>
                  </td>
                  <td className="py-3">
                    <Dialog>
                      <DialogTrigger render={<Button variant="outline" size="sm" className="text-[10px]" />}>
                        Send reminder
                      </DialogTrigger>
                      <RecoveryDialog row={row} />
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
