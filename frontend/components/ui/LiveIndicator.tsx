import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  label?: string;
  className?: string;
}

export function LiveIndicator({ label = "Live", className }: LiveIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
        className
      )}
    >
      <span className="relative flex h-2 w-2 will-change-transform">
        <span className="live-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-500" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {label}
    </span>
  );
}
