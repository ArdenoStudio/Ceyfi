import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AlertTone = "info" | "success" | "warning" | "error" | "neutral";

export type AlertVariant = "soft" | "outline" | "solid";

const toneStyles: Record<
  AlertTone,
  Record<AlertVariant, { container: string; icon: string; title: string; description: string }>
> = {
  info: {
    soft: {
      container:
        "border-blue-200/60 bg-blue-50/90 text-blue-900 dark:border-blue-400/20 dark:bg-blue-950/35 dark:text-blue-200",
      icon: "text-blue-600 dark:text-blue-400",
      title: "text-blue-900 dark:text-blue-100",
      description: "text-blue-800/80 dark:text-blue-300/80",
    },
    outline: {
      container:
        "border-blue-300 bg-transparent text-blue-900 dark:border-blue-500/40 dark:text-blue-200",
      icon: "text-blue-600 dark:text-blue-400",
      title: "text-blue-900 dark:text-blue-100",
      description: "text-blue-800/80 dark:text-blue-300/80",
    },
    solid: {
      container: "border-blue-600 bg-blue-600 text-white",
      icon: "text-white",
      title: "text-white",
      description: "text-blue-50/90",
    },
  },
  success: {
    soft: {
      container:
        "border-emerald-200/60 bg-emerald-50/90 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-950/35 dark:text-emerald-200",
      icon: "text-emerald-600 dark:text-emerald-400",
      title: "text-emerald-900 dark:text-emerald-100",
      description: "text-emerald-800/80 dark:text-emerald-300/80",
    },
    outline: {
      container:
        "border-emerald-300 bg-transparent text-emerald-900 dark:border-emerald-500/40 dark:text-emerald-200",
      icon: "text-emerald-600 dark:text-emerald-400",
      title: "text-emerald-900 dark:text-emerald-100",
      description: "text-emerald-800/80 dark:text-emerald-300/80",
    },
    solid: {
      container: "border-emerald-600 bg-emerald-600 text-white",
      icon: "text-white",
      title: "text-white",
      description: "text-emerald-50/90",
    },
  },
  warning: {
    soft: {
      container:
        "border-amber-200/60 bg-amber-50/90 text-amber-900 dark:border-amber-400/20 dark:bg-amber-950/35 dark:text-amber-200",
      icon: "text-amber-600 dark:text-amber-400",
      title: "text-amber-900 dark:text-amber-100",
      description: "text-amber-800/80 dark:text-amber-300/80",
    },
    outline: {
      container:
        "border-amber-300 bg-transparent text-amber-900 dark:border-amber-500/40 dark:text-amber-200",
      icon: "text-amber-600 dark:text-amber-400",
      title: "text-amber-900 dark:text-amber-100",
      description: "text-amber-800/80 dark:text-amber-300/80",
    },
    solid: {
      container: "border-amber-500 bg-amber-500 text-amber-950",
      icon: "text-amber-950",
      title: "text-amber-950",
      description: "text-amber-900/80",
    },
  },
  error: {
    soft: {
      container:
        "border-red-200/60 bg-red-50/90 text-red-900 dark:border-red-400/20 dark:bg-red-950/35 dark:text-red-200",
      icon: "text-red-600 dark:text-red-400",
      title: "text-red-900 dark:text-red-100",
      description: "text-red-800/80 dark:text-red-300/80",
    },
    outline: {
      container:
        "border-red-300 bg-transparent text-red-900 dark:border-red-500/40 dark:text-red-200",
      icon: "text-red-600 dark:text-red-400",
      title: "text-red-900 dark:text-red-100",
      description: "text-red-800/80 dark:text-red-300/80",
    },
    solid: {
      container: "border-red-600 bg-red-600 text-white",
      icon: "text-white",
      title: "text-white",
      description: "text-red-50/90",
    },
  },
  neutral: {
    soft: {
      container:
        "border-neutral-200/70 bg-neutral-50/90 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200",
      icon: "text-neutral-600 dark:text-neutral-400",
      title: "text-neutral-900 dark:text-neutral-100",
      description: "text-neutral-700/80 dark:text-neutral-400/80",
    },
    outline: {
      container:
        "border-neutral-300 bg-transparent text-neutral-900 dark:border-neutral-600 dark:text-neutral-200",
      icon: "text-neutral-600 dark:text-neutral-400",
      title: "text-neutral-900 dark:text-neutral-100",
      description: "text-neutral-700/80 dark:text-neutral-400/80",
    },
    solid: {
      container: "border-neutral-700 bg-neutral-700 text-white dark:border-neutral-600 dark:bg-neutral-600",
      icon: "text-white",
      title: "text-white",
      description: "text-neutral-100/90",
    },
  },
};

export interface AlertProps {
  tone?: AlertTone;
  variant?: AlertVariant;
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  role?: "alert" | "status";
}

/** DaisyUI alert pattern — icon + title/description, soft/outline/solid variants. */
export function Alert({
  tone = "info",
  variant = "soft",
  title,
  description,
  icon: Icon,
  action,
  className,
  role = "alert",
}: AlertProps) {
  const styles = toneStyles[tone][variant];

  return (
    <div
      role={role}
      className={cn(
        "grid gap-3 rounded-2xl border p-4 sm:p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center",
        styles.container,
        className
      )}
    >
      {Icon ? (
        <Icon className={cn("size-6 shrink-0", styles.icon)} aria-hidden />
      ) : null}
      <div className={cn(!Icon && "sm:col-start-1")}>
        <p className={cn("text-base font-semibold leading-snug sm:text-lg", styles.title)}>
          {title}
        </p>
        {description ? (
          <p className={cn("mt-0.5 text-sm opacity-90", styles.description)}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="sm:justify-self-end">{action}</div> : null}
    </div>
  );
}
