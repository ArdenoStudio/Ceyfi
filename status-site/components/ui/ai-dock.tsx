"use client"

import React from "react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"

// ─── Orb ────────────────────────────────────────────────────────────────────
// CSS lives in globals.css under .color-orb / @keyframes color-orb-spin
function ColorOrb({ size = 24 }: { size?: number }) {
  return (
    <div
      className="color-orb shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    />
  )
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PANEL_W = 380
const PANEL_H_EMPTY = 290   // panel when no messages yet
const PANEL_H_CHAT  = 380   // panel once conversation started
const DOCK_H = 44

const SUGGESTIONS = [
  "Is everything operational?",
  "Check the wallet service",
  "How fast is the Core API?",
]

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "agent"
  text: string
}

// ─── Main component ──────────────────────────────────────────────────────────
export function AiDock() {
  const wrapperRef  = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const bottomRef   = React.useRef<HTMLDivElement>(null)

  const [open,     setOpen]     = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input,    setInput]    = React.useState("")
  const [loading,  setLoading]  = React.useState(false)

  const hasMessages = messages.length > 0
  const panelH      = hasMessages ? PANEL_H_CHAT : PANEL_H_EMPTY

  // Auto-scroll to latest message
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  // Focus textarea when opened
  React.useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 90)
  }, [open])

  // Click-outside to close
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (open && wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  // ── API call ──────────────────────────────────────────────────────────────
  async function ask(query: string) {
    const q = query.trim()
    if (!q || loading) return
    setMessages(m => [...m, { role: "user", text: q }])
    setInput("")
    setLoading(true)
    try {
      const res  = await fetch("/api/ask-status", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ query: q }),
      })
      const data = await res.json()
      setMessages(m => [
        ...m,
        { role: "agent", text: data.response ?? data.error ?? "No response." },
      ])
    } catch {
      setMessages(m => [...m, { role: "agent", text: "Could not reach the status agent." }])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    ask(input)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") { setOpen(false); return }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input) }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <motion.div
        ref={wrapperRef}
        className="relative flex flex-col overflow-hidden border border-neutral-200/80 bg-white shadow-xl shadow-black/8 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/40"
        initial={false}
        animate={{
          width:        open ? PANEL_W    : "auto",
          height:       open ? panelH    : DOCK_H,
          borderRadius: open ? 16        : 22,
        }}
        transition={{ type: "spring", stiffness: 550, damping: 45, mass: 0.7 }}
      >

        {/* ── Expanded panel ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="flex flex-col"
              style={{ height: panelH - DOCK_H }}
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <ColorOrb size={20} />
                  <span className="select-none text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Nasiko
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Live
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="cursor-pointer rounded-full p-1 text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M1 1l8 8M9 1L1 9" />
                  </svg>
                </button>
              </div>

              {/* Messages OR suggestion chips */}
              {hasMessages ? (
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex items-end gap-1.5", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "agent" && <ColorOrb size={18} />}
                      <div
                        className={cn(
                          "max-w-[82%] rounded-2xl px-3 py-1.5 text-xs leading-relaxed",
                          msg.role === "user"
                            ? "rounded-br-sm bg-blue-600 text-white"
                            : "rounded-bl-sm bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100",
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

                  {/* Typing indicator */}
                  {loading && (
                    <div className="flex items-end gap-1.5 justify-start">
                      <ColorOrb size={18} />
                      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:300ms]" />
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              ) : (
                /* Suggestion chips — shown before first message */
                <div className="flex flex-1 flex-col items-center justify-end gap-2 overflow-y-auto p-3">
                  <p className="select-none text-[11px] text-neutral-400">Ask me about any service</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => ask(s)}
                        className="cursor-pointer rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Textarea input */}
              <form
                onSubmit={handleSubmit}
                className="flex shrink-0 items-end gap-2 border-t border-neutral-100 p-2 dark:border-neutral-800"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about system status…"
                  rows={hasMessages ? 2 : 1}
                  disabled={loading}
                  spellCheck={false}
                  className="flex-1 resize-none rounded-lg bg-transparent p-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-50 dark:text-neutral-100"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="mb-0.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 12V2M2 7l5-5 5 5" />
                  </svg>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Dock bar (always visible at bottom) ────────────────────────── */}
        <div
          className="flex h-[44px] shrink-0 cursor-pointer select-none items-center justify-center gap-2.5 px-4"
          onClick={() => !open && setOpen(true)}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div
                key="spacer"
                className="h-6 w-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
              />
            ) : (
              <motion.div
                key="orb"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ColorOrb size={24} />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
            className="cursor-pointer text-sm font-medium text-neutral-700 transition-colors hover:text-blue-600 dark:text-neutral-300 dark:hover:text-blue-400"
          >
            {open ? "Nasiko" : "Ask Nasiko"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
