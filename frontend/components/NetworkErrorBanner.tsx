"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { AlertBanner } from "@/components/hyperui";
import { cn } from "@/lib/utils";

export interface NetworkErrorBannerProps {
  /** When true, shows an offline banner regardless of `message`. */
  offline?: boolean;
  /** Optional fetch/API error message — shown when not offline. */
  message?: string | null;
  onRetry?: () => void;
  className?: string;
}

/** Sticky retry banner for offline mode and transient network failures. */
export function NetworkErrorBanner({
  offline = false,
  message,
  onRetry,
  className,
}: NetworkErrorBannerProps) {
  if (!offline && !message) return null;

  const title = offline
    ? "You appear to be offline"
    : "Connection problem";
  const description = offline
    ? "CEYFI will retry when your connection returns. Cached demo data may still be available."
    : (message ?? "Could not reach the server. Check your connection and try again.");

  return (
    <AlertBanner
      tone="warning"
      icon={WifiOff}
      title={title}
      description={description}
      actionLabel={onRetry ? "Retry" : undefined}
      onAction={onRetry}
      className={cn("sticky top-0 z-20", className)}
      action={
        onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ceyfi-green px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-ceyfi-deep dark:hover:bg-ceyfi-mint dark:hover:text-ceyfi-deep"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Retry
          </button>
        ) : undefined
      }
    />
  );
}
