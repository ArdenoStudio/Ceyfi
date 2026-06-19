"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-ceyfi-line/70 bg-ceyfi-paper p-4 shadow-sm transition duration-200 hover:border-ceyfi-green/30 hover:shadow-[0_8px_30px_rgb(5,150,105,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-ceyfi-green/40 dark:hover:shadow-[0_8px_30px_rgb(52,211,153,0.06)]",
        className,
      )}
    >
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        {icon}
        <div className="mt-2 mb-2 font-heading text-lg font-semibold text-ceyfi-ink dark:text-white">
          {title}
        </div>
        <div className="font-sans text-xs font-normal text-ceyfi-muted dark:text-white/60">
          {description}
        </div>
      </div>
    </div>
  );
};
