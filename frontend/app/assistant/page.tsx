"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { ChatThread } from "@/components/assistant/ChatThread";
import { ChatInput } from "@/components/assistant/ChatInput";
import { LanguageToggle } from "@/components/assistant/LanguageToggle";
import { SuggestedQuestions } from "@/components/assistant/SuggestedQuestions";
import { Skeleton } from "@/components/ui/skeleton";
import { getFamilyWallet } from "@/lib/api";
import { WalletState } from "@/types";
import { CeyfiMark } from "@/components/brand/CeyfiMark";

function AssistantPageContent() {
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt");
  const context = searchParams.get("context");
  const accountId = searchParams.get("accountId") ?? "SEY-ACC-002";
  const promptSentRef = useRef(false);
  const { messages, isStreaming, language, setLanguage, send } = useChat("SEY-USR-001");

  useEffect(() => {
    promptSentRef.current = false;
  }, [prompt, context, accountId]);

  useEffect(() => {
    if (!prompt || promptSentRef.current || isStreaming) return;

    const run = async () => {
      promptSentRef.current = true;
      if (context === "wallet") {
        try {
          const w = (await getFamilyWallet(accountId)) as WalletState;
          const snap = [
            `Wallet holder: ${w.account_holder} (account ${w.account_id}). Total balance LKR: ${w.total_balance_lkr}.`,
            ...w.buckets.map(
              (b) =>
                `- ${b.label}: balance LKR ${b.balance_lkr}, spent LKR ${b.spent_lkr}, allocation ${b.allocation_pct}%`
            ),
            w.last_remittance
              ? `Last remittance: LKR ${w.last_remittance.amount_lkr} on ${w.last_remittance.date} (GBP ${w.last_remittance.amount_gbp} @ ${w.last_remittance.fx_rate}).`
              : "",
          ]
            .filter(Boolean)
            .join("\n");
          await send(`${prompt}\n\n---\n${snap}`);
        } catch {
          await send(prompt);
        }
        return;
      }
      await send(prompt);
    };

    void run();
  }, [prompt, context, accountId, isStreaming, send]);

  const isEmpty = messages.length === 0;

  return (
    <div
      data-module="assistant"
      className="relative flex flex-col overflow-hidden"
      style={{ background: "#04241a", minHeight: "100dvh" }}
    >
      {/* Ambient glow layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(5,150,105,0.12),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(5,46,22,0.10),transparent)]" />
      </div>

      {/* Subtle dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {isEmpty ? (
        /* ── Hero / empty state ─────────────────────────────── */
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-6">
          {/* Language toggle pinned top-right */}
          <div className="absolute right-4 top-4 sm:right-6">
            <LanguageToggle language={language} onChange={setLanguage} />
          </div>

          {/* Icon + title */}
          <div className="mb-8 text-center">
            {/* Logo with pulse rings */}
            <div className="relative mx-auto mb-7 flex h-[4.5rem] w-[4.5rem] items-center justify-center">
              <span className="absolute inset-0 rounded-[22px] bg-ceyfi-green/20 animate-glow-ring" />
              <span className="absolute inset-0 rounded-[22px] bg-ceyfi-green/12 animate-glow-ring-delayed" />
              <div className="relative z-10 flex h-full w-full items-center justify-center rounded-[22px] bg-white/[0.12] p-3.5 ring-1 ring-white/20 shadow-[0_0_48px_rgba(5,150,105,0.30),0_8px_32px_rgba(0,0,0,0.40)]">
                <CeyfiMark className="h-full w-full text-white" />
              </div>
            </div>

            <h1 className="font-heading text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
              CEYFI AI
            </h1>
            <p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-white/38">
              Ask anything about your finances
            </p>

            {/* Language badges */}
            <div className="mt-5 flex items-center justify-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-medium text-white/45">
                <span className="h-1.5 w-1.5 rounded-full bg-ceyfi-green/80" />
                English
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-medium text-white/45 sinhala">
                <span className="h-1.5 w-1.5 rounded-full bg-ceyfi-mint/80" />
                සිංහල
              </span>
            </div>
          </div>

          {/* Glassmorphic input */}
          <div className="w-full max-w-2xl">
            <ChatInput onSend={send} disabled={isStreaming} language={language} />
          </div>

          {/* Quick-action suggestion chips */}
          <div className="mt-4 w-full max-w-2xl">
            <SuggestedQuestions language={language} onSelect={send} />
          </div>
        </div>
      ) : (
        /* ── Active chat state ──────────────────────────────── */
        <>
          {/* Compact header */}
          <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 py-3 backdrop-blur-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ceyfi-green/60">
                Bilingual banking AI
              </p>
              <h1 className="font-heading text-lg font-semibold text-white">
                CEYFI AI
              </h1>
            </div>
            <LanguageToggle language={language} onChange={setLanguage} />
          </div>

          <ChatThread
            messages={messages}
            isStreaming={isStreaming}
            language={language}
            onSuggestedSelect={send}
          />

          <ChatInput onSend={send} disabled={isStreaming} language={language} />
        </>
      )}
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4 min-h-screen" style={{ background: "#04241a" }}>
          <Skeleton className="h-8 w-48 bg-white/10" />
          <Skeleton className="h-64 w-full bg-white/10" />
        </div>
      }
    >
      <AssistantPageContent />
    </Suspense>
  );
}
