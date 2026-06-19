"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CEYFI_COLORS } from "./colors";

export interface TrackerBlock {
  key?: string | number;
  color?: string;
  tooltip?: string;
}

interface TrackerBlockProps extends TrackerBlock {
  hoverEffect?: boolean;
  defaultColor?: string;
}

function Block({
  color,
  tooltip,
  defaultColor = CEYFI_COLORS.muted,
  hoverEffect,
}: TrackerBlockProps) {
  return (
    <div
      className="group/block relative size-full overflow-hidden px-px transition first:rounded-l first:pl-0 last:rounded-r last:pr-0"
      title={tooltip}
    >
      <div
        className={cn(
          "size-full rounded-[1px]",
          hoverEffect && "transition-opacity group-hover/block:opacity-60"
        )}
        style={{ backgroundColor: color ?? defaultColor }}
      />
      {tooltip ? (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#052E16] px-2 py-1 text-[10px] text-white shadow-lg group-hover/block:block dark:bg-white dark:text-[#052E16]">
          {tooltip}
        </span>
      ) : null}
    </div>
  );
}

export interface TrackerProps extends React.HTMLAttributes<HTMLDivElement> {
  data: TrackerBlock[];
  defaultColor?: string;
  hoverEffect?: boolean;
}

export const Tracker = React.forwardRef<HTMLDivElement, TrackerProps>(
  (
    {
      data = [],
      defaultColor = "rgba(140, 154, 145, 0.35)",
      hoverEffect = true,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn("group relative flex h-8 w-full items-center", className)}
        role="img"
        aria-label="Status tracker"
        {...props}
      >
        {data.map((block, index) => (
          <Block
            key={block.key ?? index}
            {...block}
            defaultColor={defaultColor}
            hoverEffect={hoverEffect}
          />
        ))}
      </div>
    );
  }
);

Tracker.displayName = "Tracker";
