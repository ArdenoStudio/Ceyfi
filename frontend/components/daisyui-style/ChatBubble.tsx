"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ChatBubbleTone =
  | "neutral"
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error";

const bubbleToneStyles: Record<ChatBubbleTone, string> = {
  neutral:
    "border border-border/80 bg-card/90 text-foreground backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white/85",
  primary: "bg-primary text-white shadow-lg shadow-primary/20",
  secondary: "bg-ceyfi-deep text-white shadow-md shadow-ceyfi-deep/20",
  info: "bg-blue-600 text-white shadow-md shadow-blue-600/20",
  success: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20",
  warning: "bg-amber-500 text-amber-950 shadow-md shadow-amber-500/20",
  error: "bg-red-600 text-white shadow-md shadow-red-600/20",
};

export interface ChatBubbleProps {
  align?: "start" | "end";
  tone?: ChatBubbleTone;
  header?: ReactNode;
  footer?: ReactNode;
  image?: ReactNode;
  className?: string;
  bubbleClassName?: string;
  children: ReactNode;
}

/** DaisyUI chat bubble pattern — grid layout, start/end alignment, colored bubbles. */
export function ChatBubble({
  align = "start",
  tone = "neutral",
  header,
  footer,
  image,
  className,
  bubbleClassName,
  children,
}: ChatBubbleProps) {
  const isEnd = align === "end";

  return (
    <div
      className={cn(
        "grid w-full max-w-[82%] gap-y-1",
        isEnd
          ? "ml-auto grid-cols-[1fr_auto] place-items-end"
          : "mr-auto grid-cols-[auto_1fr] place-items-start",
        className
      )}
    >
      {image && !isEnd ? (
        <div className="row-span-3 self-end">{image}</div>
      ) : null}

      {header ? (
        <div
          className={cn(
            "col-start-2 mb-0.5 flex items-center gap-2 text-xs text-muted-foreground dark:text-white/45",
            isEnd && "col-start-1 justify-end"
          )}
        >
          {header}
        </div>
      ) : null}

      <div
        className={cn(
          "relative px-4 py-3 text-sm leading-6",
          isEnd
            ? "col-start-1 rounded-tl-[20px] rounded-bl-[20px] rounded-br-[20px] rounded-tr-md"
            : "col-start-2 rounded-tr-[20px] rounded-br-[20px] rounded-bl-[20px] rounded-tl-md",
          bubbleToneStyles[tone],
          bubbleClassName
        )}
      >
        {children}
      </div>

      {footer ? (
        <div
          className={cn(
            "col-start-2 text-[11px] text-muted-foreground/70 dark:text-white/35",
            isEnd && "col-start-1 text-right"
          )}
        >
          {footer}
        </div>
      ) : null}

      {image && isEnd ? (
        <div className="row-span-3 self-end">{image}</div>
      ) : null}
    </div>
  );
}
