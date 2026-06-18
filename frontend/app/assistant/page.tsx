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
import Image from "next/image";

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
      style={{ background: "#0c0407", minHeight: "100dvh" }}
    >
      {/* Ambient glow layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(227,24,33,0.12),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(114,28,36,0.10),transparent)]" />
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
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
          {/* Language toggle pinned top-right */}
          <div className="absolute right-4 top-4 sm:right-6">
            <LanguageToggle language={language} onChange={setLanguage} />
          </div>

          {/* Icon + title */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-lg shadow-black/30 p-2.5">
              <Image
                src="/seylan-bank-icon.png"
                alt="Seylan Bank"
                width={48}
                height={48}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <h1 className="font-heading text-4xl font-semibold text-white sm:text-5xl">
              Seylan AI
            </h1>
            <p className="mt-3 max-w-sm text-sm text-white/40">
              Ask anything about your finances — in English or Sinhala
            </p>
          </div>

          {/* Glassmorphic input */}
          <div className="w-full max-w-2xl">
            <ChatInput onSend={send} disabled={isStreaming} language={language} />
          </div>

          {/* Quick-action suggestion chips */}
          <div className="mt-5 w-full max-w-2xl">
            <SuggestedQuestions language={language} onSelect={send} />
          </div>
        </div>
      ) : (
        /* ── Active chat state ──────────────────────────────── */
        <>
          {/* Compact header */}
          <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 py-3 backdrop-blur-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-seylan-red/60">
                Bilingual banking AI
              </p>
              <h1 className="font-heading text-lg font-semibold text-white">
                Seylan AI
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
        <div className="p-6 space-y-4 min-h-screen" style={{ background: "#0c0407" }}>
          <Skeleton className="h-8 w-48 bg-white/10" />
          <Skeleton className="h-64 w-full bg-white/10" />
        </div>
      }
    >
      <AssistantPageContent />
    </Suspense>
  );
}
