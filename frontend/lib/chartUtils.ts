// CEYFI chart brand tokens
export const CHART_BRAND = {
  primary: "#059669",
  secondary: "#34D399",
  background: "transparent",
  grid: "#e5f0eb",
  tooltipClass: "rounded-xl border border-ceyfi-line/40 bg-ceyfi-deep/95 px-3.5 py-3 text-xs text-white shadow-xl backdrop-blur-sm",
} as const;

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

export type ChartVariant = "light" | "dark";

export const CHART_VARIANTS = {
  light: {
    grid: CHART_BRAND.grid,
    axis: "#8C9A91",
    label: "#617267",
    cursor: "#a7d8b8",
    legend: "#617267",
    tooltipClass:
      "rounded-xl border border-ceyfi-line bg-white/97 px-3.5 py-3 text-xs text-ceyfi-ink shadow-lg",
  },
  dark: {
    grid: "rgba(255,255,255,0.05)",
    axis: "rgba(255,255,255,0.3)",
    label: "rgba(255,255,255,0.5)",
    cursor: "rgba(255,255,255,0.04)",
    legend: "rgba(255,255,255,0.5)",
    tooltipClass: CHART_BRAND.tooltipClass,
  },
} as const;

// Map a series index to a color
export function seriesColor(index: number): string {
  const keys = Object.keys(CHART_COLORS) as ChartColorKey[];
  return CHART_COLORS[keys[index % keys.length]];
}

// Y-axis domain with 10% padding
export function getYDomain(data: number[]): [number, number] {
  if (data.length === 0) return [0, 100];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = (max - min) * 0.1 || max * 0.1 || 1;
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

export function buildSparkline(seed: number, points = 8): number[] {
  return Array.from({ length: points }, (_, i) =>
    Math.round(seed * (0.92 + Math.sin(i * 0.9 + seed) * 0.04 + i * 0.008))
  );
}
