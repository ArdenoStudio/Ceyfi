"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CEYFI_PALETTE } from "./colors";

function sumValues(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function formatLabel(num: number): string {
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

interface CategoryBarLabelsProps {
  values: number[];
  formatter?: (value: number) => string;
}

function buildLabelSegments(
  values: number[],
  total: number
): { value: number; prefixSum: number; showLabel: boolean }[] {
  const segments: { value: number; prefixSum: number; showLabel: boolean }[] = [];
  let prefixSum = 0;
  let hiddenRun = 0;

  for (const value of values) {
    prefixSum += value;
    const showLabel =
      (value >= 0.1 * total || hiddenRun >= 0.09 * total) &&
      total - prefixSum >= 0.1 * total &&
      prefixSum >= 0.1 * total &&
      prefixSum < 0.9 * total;

    hiddenRun = showLabel ? 0 : hiddenRun + value;
    segments.push({ value, prefixSum, showLabel });
  }

  return segments;
}

function CategoryBarLabels({ values, formatter }: CategoryBarLabelsProps) {
  const total = sumValues(values);
  const segments = buildLabelSegments(values, total);

  return (
    <div className="relative mb-2 flex h-5 w-full text-xs font-medium text-ceyfi-muted dark:text-white/50">
      <span className="absolute bottom-0 left-0">0</span>
      {segments.map(({ value, prefixSum, showLabel }, index) => {
        const widthPct = total > 0 ? (value / total) * 100 : 0;

        return (
          <div
            key={`label-${index}`}
            className="flex items-center justify-end pr-0.5"
            style={{ width: `${widthPct}%` }}
          >
            {showLabel ? (
              <span className="block translate-x-1/2 tabular-nums">
                {formatter ? formatter(prefixSum) : formatLabel(prefixSum)}
              </span>
            ) : null}
          </div>
        );
      })}
      <span className="absolute right-0 bottom-0 tabular-nums">
        {formatter ? formatter(total) : formatLabel(total)}
      </span>
    </div>
  );
}

export interface CategoryBarMarker {
  value: number;
  tooltip?: string;
  showAnimation?: boolean;
}

export interface CategoryBarProps extends React.HTMLAttributes<HTMLDivElement> {
  values: number[];
  colors?: string[];
  labels?: string[];
  marker?: CategoryBarMarker;
  showLabels?: boolean;
  valueFormatter?: (value: number) => string;
}

export const CategoryBar = React.forwardRef<HTMLDivElement, CategoryBarProps>(
  (
    {
      values = [],
      colors = [...CEYFI_PALETTE],
      labels,
      marker,
      showLabels = true,
      valueFormatter,
      className,
      ...props
    },
    ref
  ) => {
    const total = React.useMemo(() => sumValues(values), [values]);

    const markerValue = React.useMemo(() => {
      if (marker === undefined) return undefined;
      if (marker.value < 0) return 0;
      if (marker.value > total) return total;
      return marker.value;
    }, [marker, total]);

    const markerLeft = total > 0 && markerValue !== undefined
      ? (markerValue / total) * 100
      : 0;

    const markerColor = React.useMemo(() => {
      if (markerValue === undefined) return CEYFI_PALETTE[0];
      if (markerValue === 0) {
        const firstIdx = values.findIndex((v) => v > 0);
        return colors[firstIdx >= 0 ? firstIdx : 0] ?? CEYFI_PALETTE[0];
      }
      let running = 0;
      for (let i = 0; i < values.length; i++) {
        running += values[i];
        if (running >= markerValue) return colors[i] ?? CEYFI_PALETTE[i % CEYFI_PALETTE.length];
      }
      return colors[values.length - 1] ?? CEYFI_PALETTE[0];
    }, [markerValue, values, colors]);

    return (
      <div
        ref={ref}
        className={cn("w-full", className)}
        aria-label="Category bar"
        aria-valuenow={marker?.value}
        {...props}
      >
        {showLabels ? (
          <CategoryBarLabels values={values} formatter={valueFormatter} />
        ) : null}

        <div className="relative flex h-2 w-full items-center">
          <div className="flex h-full flex-1 items-center gap-0.5 overflow-hidden rounded-full bg-ceyfi-sprout dark:bg-white/[0.06]">
            {values.map((value, index) => {
              const pct = total > 0 ? (value / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={`segment-${index}`}
                  className="h-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor:
                      colors[index] ?? CEYFI_PALETTE[index % CEYFI_PALETTE.length],
                  }}
                  title={labels?.[index]}
                />
              );
            })}
          </div>

          {marker !== undefined ? (
            <div
              className={cn(
                "absolute w-2 -translate-x-1/2",
                marker.showAnimation &&
                  "transform-gpu transition-all duration-300 ease-out"
              )}
              style={{ left: `${markerLeft}%` }}
            >
              <div
                className="group relative mx-auto"
                title={marker.tooltip}
              >
                <div
                  aria-hidden
                  className="mx-auto h-4 w-1 rounded-full ring-2 ring-white dark:ring-[#052E16]"
                  style={{ backgroundColor: markerColor }}
                />
                {marker.tooltip ? (
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#052E16] px-2 py-1 text-[10px] text-white shadow-lg group-hover:block dark:bg-white dark:text-[#052E16]">
                    {marker.tooltip}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {labels && labels.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {labels.map((label, index) => (
              <div key={label} className="flex items-center gap-1.5 text-xs">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      colors[index] ?? CEYFI_PALETTE[index % CEYFI_PALETTE.length],
                  }}
                />
                <span className="text-ceyfi-muted dark:text-white/50">{label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);

CategoryBar.displayName = "CategoryBar";
