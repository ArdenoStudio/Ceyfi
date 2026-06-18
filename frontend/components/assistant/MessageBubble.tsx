"use client";

import { useState } from "react";
import { ChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { AudioPlayer } from "./AudioPlayer";
import { formatLKR } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const pa = message.payment_action;
  const [thinkingOpen, setThinkingOpen] = useState(false);

  const isThinking = isStreaming && !!message.thinking && !message.content;

  return (
    <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}>
      {/* Thinking block — shown for assistant messages only */}
      {!isUser && message.thinking && (
        <button
          onClick={() => setThinkingOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/55 transition-colors"
        >
          {isThinking ? (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-seylan-red/60 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-seylan-red/80" />
              </span>
              Thinking…
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <svg className={cn("w-3 h-3 transition-transform", thinkingOpen && "rotate-90")} viewBox="0 0 12 12" fill="none">
                <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {thinkingOpen ? "Hide" : "Show"} thinking
            </span>
          )}
        </button>
      )}

      {/* Expanded thinking content */}
      {!isUser && message.thinking && (thinkingOpen || isThinking) && (
        <div className="max-w-[82%] px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/40 text-xs leading-5 whitespace-pre-wrap font-mono">
          {message.thinking}
          {isThinking && (
            <span className="inline-block w-1 h-3 bg-current opacity-50 animate-pulse ml-0.5 rounded-sm" />
          )}
        </div>
      )}

      {/* Main message bubble */}
      <div
        className={cn(
          "max-w-[82%] px-4 py-3 text-sm leading-6",
          isUser
            ? "bg-seylan-red text-white shadow-lg shadow-seylan-red/20 rounded-tl-[20px] rounded-bl-[20px] rounded-br-[20px] rounded-tr-md"
            : "border border-white/[0.08] bg-white/[0.06] text-white/85 backdrop-blur-sm rounded-tr-[20px] rounded-br-[20px] rounded-bl-[20px] rounded-tl-md"
        )}
      >
        <p
          className={cn(
            "whitespace-pre-wrap",
            message.language === "si" && "sinhala"
          )}
        >
          {message.content}
        </p>
        {isStreaming && message.content && (
          <span className="inline-block w-1.5 h-4 bg-current opacity-60 animate-pulse ml-0.5 rounded-sm" />
        )}
        {pa && !isStreaming && (
          <a
            href={pa.checkout_url}
            className={cn(
              "mt-3 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5",
              "bg-seylan-red text-white text-sm font-semibold",
              "hover:bg-seylan-red/90 transition-colors"
            )}
          >
            <span>💳</span>
            <span>Pay {formatLKR(pa.amount_lkr)} →</span>
          </a>
        )}
        {!isUser && !isStreaming && message.content && message.language === "en" && (
          <AudioPlayer text={message.content} language={message.language} />
        )}
      </div>
    </div>
  );
}
