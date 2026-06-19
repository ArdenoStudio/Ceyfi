"use client";

import { cn } from "@/lib/utils";

export type StepStatus = "pending" | "active" | "complete" | "error";

export type StepTone =
  | "primary"
  | "secondary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "neutral";

export interface StepItem {
  label: string;
  status?: StepStatus;
  tone?: StepTone;
  icon?: string;
}

export interface StepsProps {
  steps: StepItem[];
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const toneStyles: Record<
  StepTone,
  { active: string; complete: string; marker: string }
> = {
  primary: {
    active: "border-ceyfi-deep bg-ceyfi-deep text-white",
    complete: "border-ceyfi-deep bg-ceyfi-deep text-white",
    marker: "bg-ceyfi-deep",
  },
  secondary: {
    active: "border-ceyfi-green bg-ceyfi-green text-white",
    complete: "border-ceyfi-green bg-ceyfi-green text-white",
    marker: "bg-ceyfi-green",
  },
  success: {
    active: "border-emerald-600 bg-emerald-600 text-white",
    complete: "border-emerald-600 bg-emerald-600 text-white",
    marker: "bg-emerald-600",
  },
  error: {
    active: "border-red-600 bg-red-600 text-white",
    complete: "border-red-600 bg-red-600 text-white",
    marker: "bg-red-600",
  },
  warning: {
    active: "border-amber-500 bg-amber-500 text-amber-950",
    complete: "border-amber-500 bg-amber-500 text-amber-950",
    marker: "bg-amber-500",
  },
  info: {
    active: "border-blue-600 bg-blue-600 text-white",
    complete: "border-blue-600 bg-blue-600 text-white",
    marker: "bg-blue-600",
  },
  neutral: {
    active: "border-neutral-400 bg-neutral-400 text-white dark:border-neutral-500 dark:bg-neutral-500",
    complete: "border-neutral-400 bg-neutral-400 text-white dark:border-neutral-500 dark:bg-neutral-500",
    marker: "bg-neutral-300 dark:bg-neutral-600",
  },
};

function stepMarker(step: StepItem, index: number): string {
  if (step.icon) return step.icon;
  if (step.status === "complete") return "✓";
  if (step.status === "error") return "✕";
  if (step.status === "active") return "●";
  return String(index + 1);
}

/** DaisyUI steps pattern — horizontal/vertical progress with colored markers and connectors. */
export function Steps({
  steps,
  orientation = "horizontal",
  className,
}: StepsProps) {
  const isHorizontal = orientation === "horizontal";

  return (
    <ol
      className={cn(
        "flex w-full",
        isHorizontal ? "flex-row items-start" : "flex-col gap-0",
        className
      )}
    >
      {steps.map((step, index) => {
        const status = step.status ?? "pending";
        const tone = step.tone ?? "primary";
        const styles = toneStyles[tone];
        const isLast = index === steps.length - 1;
        const connectorDone =
          status === "complete" || status === "error" || status === "active";

        const markerClass =
          status === "pending"
            ? "border-border bg-muted text-muted-foreground dark:border-white/15 dark:bg-white/10 dark:text-white/50"
            : status === "active"
              ? cn(styles.active, "ring-4 ring-ceyfi-deep/15 dark:ring-ceyfi-mint/20")
              : cn(styles.complete);

        return (
          <li
            key={step.label}
            className={cn(
              "relative flex min-w-0 flex-1",
              isHorizontal ? "flex-col items-center text-center" : "flex-row items-start gap-3 pb-6 last:pb-0"
            )}
          >
            {!isLast && isHorizontal ? (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[calc(50%+1rem)] top-4 h-0.5 w-[calc(100%-2rem)] -translate-y-1/2",
                  connectorDone ? styles.marker : "bg-border dark:bg-white/10"
                )}
              />
            ) : null}

            {!isLast && !isHorizontal ? (
              <span
                aria-hidden
                className={cn(
                  "absolute left-4 top-8 h-[calc(100%-1.5rem)] w-0.5 -translate-x-1/2",
                  connectorDone ? styles.marker : "bg-border dark:bg-white/10"
                )}
              />
            ) : null}

            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                markerClass
              )}
            >
              {stepMarker(step, index)}
            </span>

            <span
              className={cn(
                "text-xs font-medium leading-snug",
                isHorizontal ? "mt-2 px-1" : "pt-1.5",
                status === "pending"
                  ? "text-muted-foreground dark:text-white/45"
                  : status === "error"
                    ? "text-red-600 dark:text-red-400"
                    : "text-ceyfi-ink dark:text-white/85"
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
