"use client";

import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  className?: string;
  animated?: boolean;
}

export function ProgressCircle({
  value,
  size = 132,
  strokeWidth = 10,
  color = "#059669",
  trackColor = "#e2eee5",
  children,
  className,
  animated = true,
}: ProgressCircleProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (safeValue / 100) * circumference;

  return (
    <div
      className={cn("relative will-change-transform", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        role="img"
        aria-label={`Progress ${safeValue} percent`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            animated &&
              "transition-[stroke-dashoffset] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          )}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
