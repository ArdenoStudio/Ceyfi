"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { CHART_VARIANTS, type ChartVariant } from "@/lib/chartUtils";

/**
 * Resolves the active chart color variant, guarding against the hydration
 * mismatch next-themes has before mount (see components/layout/ThemeToggle.tsx
 * for the same pattern). Defaults to "light" until mounted so SSR output
 * matches the first client render.
 */
export function useChartTheme(): {
  variant: ChartVariant;
  colors: (typeof CHART_VARIANTS)[ChartVariant];
  isDark: boolean;
} {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const isDark = mounted && resolvedTheme === "dark";
  const variant: ChartVariant = isDark ? "dark" : "light";
  return { variant, colors: CHART_VARIANTS[variant], isDark };
}
