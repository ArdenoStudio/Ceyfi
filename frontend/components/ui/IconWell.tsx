import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const sizeStyles = {
  auto: "",
  xs: "size-7 [&_svg]:size-3.5",
  sm: "size-8 [&_svg]:size-4",
  md: "size-9 [&_svg]:size-[18px]",
  lg: "size-11 [&_svg]:size-5",
  xl: "size-12 [&_svg]:size-5",
} as const;

const toneStyles = {
  sprout: "bg-ceyfi-sprout text-ceyfi-green dark:bg-ceyfi-green/15 dark:text-ceyfi-mint",
  green: "bg-ceyfi-green text-white shadow-[0_4px_16px_rgba(5,150,105,0.25)]",
  muted: "bg-stone-100 text-stone-600 dark:bg-white/10 dark:text-white/70",
  ghost: "bg-transparent text-ceyfi-green",
} as const;

export interface IconWellProps {
  children: ReactNode;
  size?: keyof typeof sizeStyles;
  tone?: keyof typeof toneStyles;
  shape?: "rounded" | "circle";
  /** KpiCard-style hover: flips to solid green when parent `.group` is hovered. */
  interactive?: boolean;
  className?: string;
}

/**
 * Circular (or rounded) icon container — HyperUI stats-style well with
 * consistent sizing and a subtle hover scale micro-interaction.
 */
export function IconWell({
  children,
  size = "md",
  tone = "sprout",
  shape = "rounded",
  interactive = false,
  className,
}: IconWellProps) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center",
        "transition-transform duration-200 ease-out",
        "hover:scale-[1.06] active:scale-[0.98]",
        "group-hover:scale-[1.06]",
        sizeStyles[size],
        toneStyles[tone],
        shape === "circle" ? "rounded-full" : "rounded-[12px]",
        interactive &&
          "transition-all duration-200 group-hover:bg-ceyfi-green group-hover:text-white group-hover:shadow-[0_4px_16px_rgba(5,150,105,0.30)]",
        className
      )}
    >
      {children}
    </span>
  );
}
