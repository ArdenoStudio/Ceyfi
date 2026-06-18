"use client";

import { HealthScore } from "@/types";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface HealthScoreBadgeProps {
  score: HealthScore;
}

const CONFIG = {
  ON_TRACK: {
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    label: "On Track",
    Icon: CheckCircle,
  },
  AT_RISK: {
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    label: "At Risk",
    Icon: AlertTriangle,
  },
  CRITICAL: {
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    label: "Critical",
    Icon: XCircle,
  },
};

export function HealthScoreBadge({ score }: HealthScoreBadgeProps) {
  const { className, label, Icon } = CONFIG[score];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
