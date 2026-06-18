"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScheduleEntry } from "@/types";
import { formatLKR } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RepaymentTimelineProps {
  schedule: ScheduleEntry[];
}

const STATUS_PILL = {
  PAID: "bg-green-900/30 text-green-400",
  UPCOMING: "bg-blue-900/30 text-blue-400",
  MISSED: "bg-red-900/30 text-red-400",
} as const;

type PillKey = keyof typeof STATUS_PILL;

function canonicalScheduleStatus(raw: string): PillKey {
  const s = raw.toUpperCase();
  if (s === "DUE") return "UPCOMING";
  if (s === "PAID" || s === "UPCOMING" || s === "MISSED") return s;
  return "UPCOMING";
}

interface MiniTooltipPayloadEntry {
  value: number;
}

function MiniTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: MiniTooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a0a0b] px-3 py-2 text-xs shadow-lg">
      <p className="text-white/40">{label}</p>
      <p className="font-semibold text-white">{formatLKR(payload[0].value)}</p>
    </div>
  );
}

export function RepaymentTimeline({ schedule }: RepaymentTimelineProps) {
  const [tab, setTab] = useState("all");

  const filtered =
    tab === "all"
      ? schedule
      : schedule.filter((e) => {
          const key = canonicalScheduleStatus(e.status);
          if (tab === "upcoming") return key === "UPCOMING";
          if (tab === "paid") return key === "PAID";
          if (tab === "missed") return key === "MISSED";
          return false;
        });

  const chartData = schedule.slice(0, 12).map((e) => ({
    month: `M${e.month}`,
    amount: e.amount_lkr,
    paid: canonicalScheduleStatus(e.status) === "PAID" ? e.amount_lkr : 0,
  }));

  return (
    <Card className="card-glass shadow-brand border-0">
      <CardContent className="p-5">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-seylan-red">
            Repayment history
          </p>
          <h3 className="font-heading text-lg font-semibold text-seylan-charcoal dark:text-white">
            Payment timeline
          </h3>
        </div>

        <ResponsiveContainer width="100%" height={80}>
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 0, left: -32, bottom: 0 }}
          >
            <defs>
              <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E31821" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#E31821" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<MiniTooltip />} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#E31821"
              strokeWidth={1.5}
              fill="url(#totalGrad)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="paid"
              stroke="#10B981"
              strokeWidth={1.5}
              fill="url(#paidGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        <Tabs value={tab} onValueChange={setTab} className="mt-3">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="missed">Missed</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            <div className="max-h-[280px] overflow-y-auto space-y-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.12)_transparent]">
              {filtered.map((entry) => {
                const statusKey = canonicalScheduleStatus(entry.status);
                return (
                  <div
                    key={`${entry.month}-${entry.due_date}`}
                    className="flex items-center justify-between py-2 border-b border-seylan-border dark:border-white/[0.08] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground dark:text-white/30 w-8">
                        #{entry.month}
                      </span>
                      <span className="text-sm text-seylan-charcoal dark:text-white/80">
                        {new Date(entry.due_date).toLocaleDateString("en-LK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium dark:text-white">
                        {formatLKR(entry.amount_lkr)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_PILL[statusKey]}`}>
                        {statusKey}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground dark:text-white/30 text-center py-4">
                  No entries
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
