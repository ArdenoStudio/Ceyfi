import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
}

export function KpiCard({
  title,
  value,
  change,
  changeType,
  subtitle,
  icon,
  className,
}: KpiCardProps) {
  const ChangeIcon =
    changeType === "positive"
      ? ArrowUpRight
      : changeType === "negative"
        ? ArrowDownRight
        : Minus;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[20px] border border-ceyfi-line/75 bg-ceyfi-paper p-5 transition-all duration-200 hover:-translate-y-1 hover:border-ceyfi-green/25 hover:shadow-[0_8px_32px_rgba(5,150,105,0.10)]",
        className
      )}
    >
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-ceyfi-mint/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ceyfi-muted">
          {title}
        </div>
        {icon ? (
          <div className="grid h-9 w-9 place-items-center rounded-[12px] bg-ceyfi-sprout text-ceyfi-green transition-all duration-200 group-hover:bg-ceyfi-green group-hover:text-white group-hover:shadow-[0_4px_16px_rgba(5,150,105,0.30)]">
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-4 font-heading text-[1.65rem] font-semibold leading-none tracking-[-0.04em] text-ceyfi-ink tabular-nums">
        {value}
      </div>
      {subtitle ? (
        <div className="mt-2 text-xs text-ceyfi-faint">{subtitle}</div>
      ) : null}
      <div
        className={cn(
          "mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
          changeType === "positive" && "bg-emerald-50 text-emerald-700",
          changeType === "negative" && "bg-rose-50 text-rose-700",
          changeType === "neutral" && "bg-stone-100 text-stone-600"
        )}
      >
        <ChangeIcon className="h-3 w-3" />
        {change}
      </div>
    </article>
  );
}
