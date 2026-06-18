"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "agent";
  text: string;
}

const SUGGESTIONS = [
  "Is everything operational?",
  "Check the wallet service",
  "Why is demo data degraded?",
  "How fast is the API responding?",
];

export function AskAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ask(query: string) {
    if (!query.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: query }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "agent", text: data.response ?? data.error ?? "No response." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "agent", text: "Could not reach the status agent. Please try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
          Ask AI
        </h2>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-500/20 rounded-full px-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Live via Nasiko
        </span>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden">

        {messages.length === 0 && (
          <div className="p-4 flex flex-wrap gap-2 border-b border-neutral-100 dark:border-neutral-800">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-neutral-50 dark:bg-neutral-900"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.length > 0 && (
          <div className="max-h-64 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2.5",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "agent" && (
                  <div className="h-6 w-6 rounded-full bg-blue-600 grid place-items-center shrink-0 mt-0.5">
                    <span className="text-white text-[10px] font-bold">S</span>
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 text-sm max-w-[80%]",
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-bl-sm"
                  )}
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;")
                      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                  }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="h-6 w-6 rounded-full bg-blue-600 grid place-items-center shrink-0">
                  <span className="text-white text-[10px] font-bold">S</span>
                </div>
                <div className="rounded-2xl rounded-bl-sm px-4 py-2 bg-neutral-100 dark:bg-neutral-800 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        <div className="flex items-center gap-2 p-3 border-t border-neutral-100 dark:border-neutral-800">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask(input)}
            placeholder="Ask about system status..."
            disabled={loading}
            className="flex-1 text-sm bg-transparent outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 disabled:opacity-50"
          />
          <button
            onClick={() => ask(input)}
            disabled={!input.trim() || loading}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Ask →
          </button>
        </div>
      </div>
    </section>
  );
}
