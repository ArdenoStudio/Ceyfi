"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  type MouseHandlerDataParam,
} from "recharts";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { CeyfiTooltip } from "@/components/charts/CeyfiTooltip";
import {
  buildCausalityForPoint,
  CausalityPanel,
  type ActionPlan,
} from "@/components/charts/CausalityPanel";
import { CHART_COLORS, lkrAxisTick } from "@/lib/chartUtils";
import { cn } from "@/lib/utils";

export interface TimeRiverPoint {
  date: string;
  balance: number | null;
  forecast: number | null;
  upper: number | null;
  lower: number | null;
  event?: string;
  isToday?: boolean;
  isDanger?: boolean;
  isFuture?: boolean;
  isoDate?: string;
}

interface TimeRiverProps {
  data?: TimeRiverPoint[];
  dangerThreshold?: number;
  height?: number;
  /** Starting balance for fallback forecast generation. */
  baseBalance?: number;
  /** LKR added to future forecast after a plan is selected (demo twin loop). */
  balanceBoost?: number;
  onPlanSelect?: (plan: ActionPlan) => void;
}

const SALARY = 185_000;
const EMI = 22_000;
const SCHOOL_FEES = 15_000;
const DEFAULT_BASE_BALANCE = 245_000;

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function generateFallbackData(baseBalance = DEFAULT_BASE_BALANCE): TimeRiverPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const points: TimeRiverPoint[] = [];

  let balance = baseBalance - 18_000;

  for (let i = -89; i <= 90; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const label = formatShortDate(date);
    const day = date.getDate();
    const isToday = i === 0;
    const isFuture = i > 0;

    let dailyDelta = -1200 + Math.sin(i / 7) * 800;
    if (day === 1) dailyDelta += SALARY;
    if (day === 5) dailyDelta -= SCHOOL_FEES;
    if (day === 25) dailyDelta -= EMI;
    if (day === 15) dailyDelta -= 2800;
    if (day === 10) dailyDelta -= 4200;

    if (!isFuture) {
      balance = Math.max(18_000, balance + dailyDelta);
    }

    const forecastBase = isFuture
      ? Math.max(
          12_000,
          baseBalance +
            i * -180 +
            (day === 1 ? SALARY : 0) -
            (day === 5 ? SCHOOL_FEES : 0) -
            (day === 25 ? EMI : 0) -
            (day === 15 ? 2800 : 0)
        )
      : null;

    const spread = forecastBase ? forecastBase * 0.08 + 4000 : null;

    let event: string | undefined;
    if (day === 1) event = "Salary";
    else if (day === 25) event = "EMI";
    else if (day === 5) event = "School Fees";
    else if (day === 20 && isFuture) event = "Remittance";

    points.push({
      date: label,
      isoDate: date.toISOString(),
      balance: isFuture ? null : Math.round(balance),
      forecast: isFuture ? Math.round(forecastBase ?? 0) : null,
      upper: isFuture && forecastBase ? Math.round(forecastBase + spread!) : null,
      lower: isFuture && forecastBase ? Math.round(forecastBase - spread!) : null,
      event,
      isToday,
      isDanger: isFuture && (forecastBase ?? 0) < 20_000,
      isFuture,
    });
  }

  return points;
}

export function TimeRiver({
  data: dataProp,
  dangerThreshold = 20_000,
  height = 280,
  baseBalance = DEFAULT_BASE_BALANCE,
  balanceBoost = 0,
  onPlanSelect,
}: TimeRiverProps) {
  const baseData = useMemo(
    () => dataProp ?? generateFallbackData(baseBalance),
    [dataProp, baseBalance]
  );
  const data = useMemo(() => {
    if (!balanceBoost) return baseData;
    return baseData.map((point) => {
      if (!point.isFuture) return point;
      const forecast =
        point.forecast != null ? point.forecast + balanceBoost : null;
      const upper = point.upper != null ? point.upper + balanceBoost : null;
      const lower = point.lower != null ? point.lower + balanceBoost : null;
      return {
        ...point,
        forecast,
        upper,
        lower,
        isDanger: forecast != null ? forecast < dangerThreshold : point.isDanger,
      };
    });
  }, [baseData, balanceBoost, dangerThreshold]);
  const todayLabel = data.find((p) => p.isToday)?.date ?? "Today";

  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<TimeRiverPoint | null>(
    null
  );

  const chartData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        balanceDisplay: point.balance,
        forecastDisplay: point.forecast,
        bandBase: point.lower,
        bandRange:
          point.upper != null && point.lower != null
            ? point.upper - point.lower
            : null,
      })),
    [data]
  );

  const eventPoints = data.filter((p) => p.event);

  const openPoint = useCallback((point: TimeRiverPoint | undefined) => {
    if (point?.isFuture && point.forecast != null) {
      setSelectedPoint(point);
      setPanelOpen(true);
    }
  }, []);

  const handleChartClick = useCallback(
    (state: MouseHandlerDataParam) => {
      const index = state.activeTooltipIndex ?? state.activeIndex;
      if (typeof index !== "number") return;
      openPoint(data[index]);
    },
    [data, openPoint]
  );

  const handleInspectNextRisk = useCallback(() => {
    const danger = data.find((p) => p.isFuture && p.isDanger && p.forecast != null);
    const nextFuture = data.find((p) => p.isFuture && p.forecast != null);
    openPoint(danger ?? nextFuture);
  }, [data, openPoint]);

  const causality = useMemo(() => {
    if (!selectedPoint?.forecast) {
      return { events: [], actionPlans: [] };
    }
    return buildCausalityForPoint(
      selectedPoint.isoDate ?? selectedPoint.date,
      selectedPoint.forecast
    );
  }, [selectedPoint]);

  return (
    <>
      <div className={cn("min-h-[300px] w-full")}>
        <ChartContainer height={height}>
          <ComposedChart
            data={chartData}
            margin={{ top: 24, right: 12, left: -8, bottom: 0 }}
            onClick={handleChartClick}
            className="cursor-pointer"
          >
            <CartesianGrid
              vertical={false}
              stroke="#D8E8DC"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8C9A91", fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={48}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8C9A91", fontSize: 10 }}
              tickFormatter={lkrAxisTick}
              width={44}
            />
            <Tooltip
              content={(props) => <CeyfiTooltip {...props} />}
              cursor={{ stroke: "#D8E8DC", strokeDasharray: "3 3" }}
            />

            {/* Confidence band — lower white cutout */}
            <Area
              type="monotone"
              dataKey="lower"
              stackId="band"
              stroke="none"
              fill="white"
              connectNulls={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="bandRange"
              stackId="band"
              stroke="none"
              fill="rgba(52,211,153,0.12)"
              connectNulls={false}
              isAnimationActive={false}
            />

            {/* Historical balance */}
            <Area
              type="monotone"
              dataKey="balanceDisplay"
              stroke={CHART_COLORS.green}
              strokeWidth={2}
              fill="#E8F7EE"
              connectNulls={false}
              name="Balance"
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#E8F7EE" }}
              onClick={handleChartClick}
            />

            {/* Forecast */}
            <Area
              type="monotone"
              dataKey="forecastDisplay"
              stroke={CHART_COLORS.green}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill="rgba(5,150,105,0.08)"
              connectNulls={false}
              name="Forecast"
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              onClick={handleChartClick}
            />

            <ReferenceLine
              x={todayLabel}
              stroke={CHART_COLORS.green}
              strokeDasharray="3 3"
              label={{
                value: "Today",
                fill: CHART_COLORS.green,
                fontSize: 10,
                fontWeight: 600,
                position: "top",
              }}
            />

            <ReferenceLine
              y={dangerThreshold}
              stroke={CHART_COLORS.rose}
              strokeDasharray="2 3"
              label={{
                value: "Min buffer",
                fill: CHART_COLORS.rose,
                fontSize: 9,
                position: "insideTopRight",
              }}
            />

            {eventPoints.map((point) => (
              <ReferenceLine
                key={`${point.date}-${point.event}`}
                x={point.date}
                stroke="#8C9A91"
                strokeDasharray="2 4"
                strokeOpacity={0.5}
                label={{
                  value: point.event ?? "",
                  fill: "#617267",
                  fontSize: 8,
                  position: "top",
                }}
              />
            ))}
          </ComposedChart>
        </ChartContainer>
      </div>

      <div className="mt-2 flex flex-col items-center gap-2">
        <p className="text-center text-[10px] text-ceyfi-faint">
          Tap a future point to see what caused the projected dip
        </p>
        <button
          type="button"
          onClick={handleInspectNextRisk}
          className="rounded-lg border border-ceyfi-line/80 bg-ceyfi-paper px-3 py-1.5 text-[11px] font-semibold text-ceyfi-green transition hover:border-ceyfi-green/40 hover:bg-ceyfi-sprout/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceyfi-green/30"
        >
          Inspect next risk
        </button>
      </div>

      <CausalityPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        date={selectedPoint?.date ?? ""}
        projectedBalance={selectedPoint?.forecast ?? 0}
        events={causality.events}
        actionPlans={causality.actionPlans}
        onPlanSelect={(plan) => {
          onPlanSelect?.(plan);
          setPanelOpen(false);
        }}
      />
    </>
  );
}
