"use client";

import { useEffect, useRef } from "react";
import { ChatMessage, Language } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { ShiningText } from "@/components/ui/shining-text";

interface ChatThreadProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  language: Language;
  onSuggestedSelect: (question: string) => void;
}

export function ChatThread({ messages, isStreaming }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const lastMsg = messages[messages.length - 1];
  const isThinking =
    isStreaming &&
    lastMsg?.role === "assistant" &&
    !lastMsg?.content?.trim();

  return (
    <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 space-y-4 sm:px-6 scrollbar-hide">
      {messages.map((msg, i) => {
        const isLastStreaming =
          isStreaming && i === messages.length - 1 && msg.role === "assistant";
        // Don't render the empty assistant bubble while thinking indicator is shown
        if (isLastStreaming && !msg.content?.trim()) return null;
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            isStreaming={isLastStreaming}
          />
        );
      })}

      {/* Thinking indicator — shows before content starts streaming */}
      {isThinking && (
        <div className="flex justify-start">
          <div className="flex items-center gap-2.5 rounded-tr-[20px] rounded-br-[20px] rounded-bl-[20px] rounded-tl-md border border-white/[0.08] bg-white/[0.06] px-4 py-3 backdrop-blur-sm">
            {/* Pulsing dots */}
            <span className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-white/40"
                  style={{
                    animation: "pulse 1.2s ease-in-out infinite",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </span>
            <ShiningText text="CEYFI AI is thinking…" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
