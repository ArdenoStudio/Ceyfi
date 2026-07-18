"use client";

import { useId, useMemo } from "react";

import { CHART_COLORS } from "@/lib/chartUtils";
import { cn } from "@/lib/utils";

/** Tiny close-path sparkline for watchlist rows. */
export function Sparkline({
  values,
  className,
  width = 72,
  height = 28,
}: {
  values?: number[] | null;
  className?: string;
  width?: number;
  height?: number;
}) {
  const gid = useId();
  const path = useMemo(() => {
    const vals = (values ?? []).filter((v) => Number.isFinite(v));
    if (vals.length < 2) return null;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = Math.max(max - min, 0.01);
    const padY = 2;
    const innerH = height - padY * 2;
    const step = width / (vals.length - 1);
    const pts = vals.map((v, i) => {
      const x = i * step;
      const y = padY + ((max - v) / span) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    const line = `M ${pts.join(" L ")}`;
    const area = `${line} L ${width},${height} L 0,${height} Z`;
    const up = vals[vals.length - 1] >= vals[0];
    return { line, area, up };
  }, [values, width, height]);

  if (!path) {
    return (
      <span
        className={cn("inline-block text-[10px] text-muted-foreground", className)}
        aria-hidden
      >
        —
      </span>
    );
  }

  const stroke = path.up ? CHART_COLORS.green : CHART_COLORS.rose;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={path.area} fill={`url(#${gid}-fill)`} />
      <path
        d={path.line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
