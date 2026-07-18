"use client";

import { cn } from "@/lib/utils";
import {
  APPETITE_BAND_LABEL,
  APPETITE_BAND_ZONE_COLOR,
  type AppetiteBand,
} from "@/lib/chime-market";

const ZONES: { band: AppetiteBand; from: number; to: number }[] = [
  { band: "extreme_caution", from: 0, to: 20 },
  { band: "caution", from: 20, to: 40 },
  { band: "neutral", from: 40, to: 60 },
  { band: "appetite", from: 60, to: 80 },
  { band: "strong_appetite", from: 80, to: 100 },
];

/**
 * Horizontal 5-zone Market Appetite spectrum + needle (Chime bullet-chart pattern).
 */
export function AppetiteMeter({
  score,
  band,
  size = "md",
  className,
}: {
  score: number;
  band: AppetiteBand;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const s = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 50;
  const h = size === "lg" ? 22 : size === "sm" ? 10 : 16;
  const label = APPETITE_BAND_LABEL[band];

  return (
    <div className={cn("w-full", className)}>
      <div
        className="relative w-full overflow-hidden rounded-md border border-ceyfi-line/80 dark:border-white/15"
        style={{ height: h }}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(s)}
        aria-valuetext={`${Math.round(s)} — ${label}`}
      >
        <div className="absolute inset-0 flex">
          {ZONES.map((z) => (
            <div
              key={z.band}
              className="h-full"
              style={{
                width: `${z.to - z.from}%`,
                backgroundColor: APPETITE_BAND_ZONE_COLOR[z.band],
                opacity: z.band === band ? 1 : 0.42,
              }}
              title={APPETITE_BAND_LABEL[z.band]}
            />
          ))}
        </div>
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-ceyfi-ink transition-[left] duration-500 ease-out motion-reduce:transition-none dark:bg-white"
          style={{ left: `calc(${s}% - 1px)` }}
          aria-hidden
        />
        <div
          className="absolute -top-1 h-0 w-0 border-x-[5px] border-x-transparent border-t-[6px] border-t-ceyfi-ink transition-[left] duration-500 ease-out motion-reduce:transition-none dark:border-t-white"
          style={{ left: `calc(${s}% - 5px)` }}
          aria-hidden
        />
      </div>
      {size !== "sm" ? (
        <div className="mt-2 grid grid-cols-5 gap-1 text-center font-mono text-[10px] tabular-nums text-muted-foreground">
          <span>Extreme</span>
          <span>Caution</span>
          <span>Neutral</span>
          <span>Appetite</span>
          <span>Strong</span>
        </div>
      ) : null}
    </div>
  );
}

export function AppetiteBandBadge({
  band,
  className,
}: {
  band: AppetiteBand;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-ceyfi-line/70 px-2.5 py-0.5 text-sm font-semibold tracking-tight text-ceyfi-ink dark:border-white/15 dark:text-ceyfi-ink",
        className,
      )}
      style={{ backgroundColor: APPETITE_BAND_ZONE_COLOR[band] }}
    >
      {APPETITE_BAND_LABEL[band]}
    </span>
  );
}
