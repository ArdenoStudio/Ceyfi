"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { VoiceButton } from "./VoiceButton";
import { Language } from "@/types";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled: boolean;
  language: Language;
}

export interface ChatInputHandle {
  focus: () => void;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(function ChatInput(
  { onSend, disabled, language },
  ref
) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  function adjustHeight() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "48px";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }

  useEffect(() => {
    adjustHeight();
  }, [value]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "48px";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const handleVoiceTranscript = useCallback((text: string) => {
    setValue(text);
  }, []);

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="relative z-10 shrink-0 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="relative rounded-2xl border border-border/80 bg-card/85 shadow-brand-lg backdrop-blur-xl transition-all focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 dark:border-white/10 dark:bg-white/5 dark:shadow-black/40 dark:focus-within:border-white/20 dark:focus-within:bg-white/[0.07]">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              language === "si"
                ? "වියදම්, ණය, හෝ බදු ගැන අසන්න..."
                : "Ask about your balance, loans, or spending..."
            }
            disabled={disabled}
            rows={1}
            aria-label={
              language === "si"
                ? "ඔබේ මුල්‍ය ගැන CEYFI වෙත ප්‍රශ්නයක් අසන්න"
                : "Ask CEYFI a question about your finances"
            }
            aria-describedby="chat-input-hint"
            className={cn(
              "w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-sm text-foreground dark:text-white",
              "placeholder:text-muted-foreground/70 focus:outline-none dark:placeholder:text-white/25",
              "min-h-[48px] max-h-[150px]",
              language === "si" && "sinhala"
            )}
            style={{ overflow: "hidden" }}
          />

          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <div className="flex items-center gap-1">
              <VoiceButton
                language={language}
                onTranscript={handleVoiceTranscript}
                disabled={disabled}
              />
            </div>

            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!canSend}
              aria-label="Send message"
              type="button"
              className={cn(
                "h-11 w-11 rounded-xl transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring/30",
                canSend
                  ? "bg-primary text-white shadow-md shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/40"
                  : "bg-muted text-muted-foreground cursor-not-allowed dark:bg-white/[0.08] dark:text-white/20"
              )}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p
          id="chat-input-hint"
          className="mt-2 text-center text-[10px] text-muted-foreground/70 dark:text-white/15"
        >
          Enter to send · Shift + Enter for new line · <kbd className="rounded border border-border/60 px-1 py-0.5 font-mono text-[9px] dark:border-white/10">/</kbd> to focus
        </p>
      </div>
    </div>
  );
});
