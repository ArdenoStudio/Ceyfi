"use client";

import { Check, Circle, Loader2, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";
import { shareText } from "@/lib/share";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { RemittanceTracking } from "@/types";

const STEP_LABEL_KEYS = [
  "stepInitiated",
  "stepCorridor",
  "stepClearing",
  "stepLanded",
] as const;

const STEP_DESC_KEYS = [
  "stepInitiatedDesc",
  "stepCorridorDesc",
  "stepClearingDesc",
  "stepLandedDesc",
] as const;

interface RemittanceTrackerProps {
  tracking: RemittanceTracking;
  className?: string;
}

export function RemittanceTracker({ tracking, className }: RemittanceTrackerProps) {
  const { t, tf, scriptClassName } = useLocale();
  const statusLabel =
    tracking.status === "FAILED"
      ? t.remittance.statusFailed
      : tracking.status === "COMPLETED"
        ? t.remittance.statusComplete
        : t.remittance.statusActive;

  return (
    <section
      data-demo-target="remittance-tracker"
      className={cn(
        "rounded-2xl border border-ceyfi-line/70 bg-card/80 p-5 shadow-brand dark:border-white/[0.08]",
        scriptClassName,
        className
      )}
      aria-label={t.remittance.trackingTitle}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ceyfi-green">
            {t.remittance.trackingTitle}
          </p>
          <h2 className="mt-1 font-heading text-lg font-semibold text-ceyfi-ink dark:text-white">
            {t.remittance.trackingSubtitle}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {tf(t.remittance.transferId, { id: tracking.transfer_id })}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[11px] font-semibold",
            tracking.status === "COMPLETED" &&
              "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
            tracking.status === "FAILED" &&
              "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
            tracking.status === "IN_TRANSIT" &&
              "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
          )}
        >
          {statusLabel}
        </span>
      </div>

      <ol className="mt-5 space-y-0">
        {tracking.steps.map((step, index) => {
          const label = t.remittance[STEP_LABEL_KEYS[index] ?? "stepInitiated"];
          const desc = t.remittance[STEP_DESC_KEYS[index] ?? "stepInitiatedDesc"];
          const isLast = index === tracking.steps.length - 1;
          return (
            <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[11px] top-6 h-[calc(100%-12px)] w-px",
                    step.state === "done"
                      ? "bg-ceyfi-green/50"
                      : "bg-ceyfi-line dark:bg-white/15"
                  )}
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                  step.state === "done" &&
                    "border-ceyfi-green bg-ceyfi-green text-white",
                  step.state === "current" &&
                    "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
                  step.state === "failed" &&
                    "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/40",
                  step.state === "pending" &&
                    "border-ceyfi-line bg-background text-muted-foreground dark:border-white/20"
                )}
              >
                {step.state === "done" ? (
                  <Check className="h-3.5 w-3.5" />
                ) : step.state === "current" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : step.state === "failed" ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-ceyfi-ink dark:text-white">
                  {label}
                </p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-[11px] text-muted-foreground">{t.remittance.demoNote}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 rounded-full"
        onClick={() => {
          void (async () => {
            const statusLabel =
              tracking.status === "FAILED"
                ? t.remittance.statusFailed
                : tracking.status === "COMPLETED"
                  ? t.remittance.statusComplete
                  : t.remittance.statusActive;
            const text = tf(t.remittance.shareMessage, {
              id: tracking.transfer_id,
              status: statusLabel,
              amount: Math.round(tracking.amount_lkr).toLocaleString("en-LK"),
            });
            const result = await shareText({
              title: t.remittance.trackingTitle,
              text,
            });
            if (result === "copied") toast.success(t.common.copy);
            else if (result !== "failed") toast.success(t.remittance.shareStatus);
          })();
        }}
      >
        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
        {t.remittance.shareStatus}
      </Button>
    </section>
  );
}
