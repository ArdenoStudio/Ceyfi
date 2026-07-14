import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
}: ChartCardProps) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[22px] border border-border bg-card p-5 sm:p-6 transition-all duration-200 hover:border-ceyfi-green/20 hover:shadow-[0_4px_24px_rgba(5,150,105,0.07)]",
        className
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-[15px] font-semibold text-card-foreground">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
