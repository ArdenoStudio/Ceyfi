"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bucket } from "@/types";
import { ChevronDown, SlidersHorizontal, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";

interface AllocationEditorProps {
  buckets: Bucket[];
  onSave: (allocations: Record<string, number>) => void;
  defaultExpanded?: boolean;
}

const BUCKET_ACCENT: Record<string, { dot: string; track: string }> = {
  school: { dot: "bg-blue-500", track: "[&_[data-slot=slider-range]]:bg-blue-500" },
  household: { dot: "bg-emerald-500", track: "[&_[data-slot=slider-range]]:bg-emerald-500" },
  savings: { dot: "bg-violet-500", track: "[&_[data-slot=slider-range]]:bg-violet-500" },
};
const FALLBACK_ACCENT = { dot: "bg-slate-400", track: "" };

export function AllocationEditor({
  buckets,
  onSave,
  defaultExpanded = false,
}: AllocationEditorProps) {
  const { t, scriptClassName } = useLocale();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [allocations, setAllocations] = useState<Record<string, number>>(
    Object.fromEntries(buckets.map((b) => [b.bucket_id, b.allocation_pct]))
  );

  const total = Object.values(allocations).reduce((sum, v) => sum + v, 0);
  const isValid = total === 100;

  function handleChange(bucketId: string, newValue: number) {
    const others = Object.entries(allocations).filter(([id]) => id !== bucketId);
    const remaining = 100 - newValue;
    const othersTotal = others.reduce((sum, [, v]) => sum + v, 0);
    const updated: Record<string, number> = { [bucketId]: newValue };

    if (othersTotal === 0) {
      const share = Math.round(remaining / others.length);
      others.forEach(([id], i) => {
        updated[id] =
          i === others.length - 1 ? remaining - share * (others.length - 1) : share;
      });
    } else {
      others.forEach(([id, v]) => {
        updated[id] = Math.round((v / othersTotal) * remaining);
      });
      const newTotal = Object.values(updated).reduce((s, v) => s + v, 0);
      if (newTotal !== 100 && others.length > 0) {
        updated[others[0][0]] += 100 - newTotal;
      }
    }
    setAllocations(updated);
  }

  return (
    <Card className={cn("card-glass shadow-brand border-0 overflow-hidden", scriptClassName)}>
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-ceyfi-sprout/50 dark:hover:bg-white/[0.04]"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ceyfi-sprout border border-ceyfi-line dark:bg-white/[0.08] dark:border-white/[0.10]">
            <SlidersHorizontal className="h-3.5 w-3.5 text-ceyfi-deep dark:text-white/60" />
          </div>
          <span className="text-sm font-semibold text-ceyfi-ink dark:text-white">
            {expanded ? t.allocation.collapse : t.allocation.expand}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <CardContent className="border-t border-ceyfi-line/60 dark:border-white/[0.06] px-5 pb-5 pt-4">
          <div className="mb-4">
            <p className="font-heading text-base font-semibold text-ceyfi-ink dark:text-white">
              {t.allocation.title}
            </p>
            <p className="text-xs text-muted-foreground">{t.allocation.subtitle}</p>
          </div>
          <div className="space-y-5">
            {buckets.map((bucket) => {
              const key = bucket.icon ?? bucket.label.toLowerCase();
              const accent = BUCKET_ACCENT[key] ?? FALLBACK_ACCENT;
              const pct = allocations[bucket.bucket_id] ?? 0;
              const localizedLabel = key.includes("school")
                ? t.buckets.school
                : key.includes("household")
                  ? t.buckets.household
                  : key.includes("saving")
                    ? t.buckets.savings
                    : bucket.label;
              return (
                <div key={bucket.bucket_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", accent.dot)} />
                      <span className="text-sm font-medium text-ceyfi-ink dark:text-white">
                        {localizedLabel}
                      </span>
                    </div>
                    <span className="font-heading text-sm font-bold text-ceyfi-ink dark:text-white tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <Slider
                    value={[pct]}
                    onValueChange={(val) =>
                      handleChange(bucket.bucket_id, Array.isArray(val) ? val[0] : val)
                    }
                    max={100}
                    step={5}
                    className={cn("w-full", accent.track)}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-ceyfi-line/60 dark:border-white/[0.06] pt-4">
            <div
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium",
                isValid ? "text-emerald-600" : "text-red-600"
              )}
            >
              {isValid ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="tabular-nums">Total: {total}%</span>
              {!isValid && (
                <span className="text-xs font-normal opacity-75">
                  ({t.allocation.mustSum100})
                </span>
              )}
            </div>
            <Button
              size="sm"
              disabled={!isValid}
              onClick={() => onSave(allocations)}
              className="rounded-full"
            >
              {t.allocation.saveRules}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
