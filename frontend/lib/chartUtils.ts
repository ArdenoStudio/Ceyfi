// Chart color palette keyed by name
export const CHART_COLORS = {
  green: "#059669",
  mint: "#34D399",
  blue: "#2563EB",
  amber: "#D97706",
  rose: "#E11D48",
  violet: "#7C3AED",
  sky: "#0EA5E9",
  slate: "#64748B",
} as const;

export type ChartColorKey = keyof typeof CHART_COLORS;

// Map a series index to a color
export function seriesColor(index: number): string {
  const keys = Object.keys(CHART_COLORS) as ChartColorKey[];
  return CHART_COLORS[keys[index % keys.length]];
}

// Y-axis domain with 10% padding
export function getYDomain(data: number[]): [number, number] {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min) * 0.1;
  return [Math.max(0, min - pad), max + pad];
}

// Format axis tick values compactly in LKR
export function lkrAxisTick(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

// Period comparison helper
export function periodDelta(
  current: number,
  previous: number
): {
  pct: number;
  positive: boolean;
  label: string;
} {
  const pct = previous === 0 ? 0 : ((current - previous) / previous) * 100;
  return {
    pct: Math.abs(pct),
    positive: pct >= 0,
    label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
  };
}
