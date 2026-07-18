import { cn } from "@/lib/utils";
import type { MarketActivity } from "@/lib/chime-market";

const LABELS: Record<MarketActivity, string> = {
  quiet: "Quiet",
  active: "Active",
  noisy: "Noisy",
};

export function ActivityBadge({
  activity,
  className,
}: {
  activity?: MarketActivity | null;
  className?: string;
}) {
  const key = activity ?? "quiet";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
        key === "noisy" &&
          "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
        key === "active" &&
          "bg-ceyfi-sprout text-ceyfi-green dark:bg-ceyfi-green/15 dark:text-ceyfi-mint",
        key === "quiet" &&
          "bg-ceyfi-canvas text-ceyfi-muted dark:bg-white/5 dark:text-white/50",
        className,
      )}
    >
      {LABELS[key]}
    </span>
  );
}
