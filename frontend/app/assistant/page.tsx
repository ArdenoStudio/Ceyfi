"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useChat } from "@/hooks/useChat";
import { ChatThread } from "@/components/assistant/ChatThread";
import { ChatInput } from "@/components/assistant/ChatInput";
import { LanguageToggle } from "@/components/assistant/LanguageToggle";
import { SuggestedQuestions } from "@/components/assistant/SuggestedQuestions";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { getFamilyWallet } from "@/lib/api";
import { WalletState } from "@/types";
import Image from "next/image";

function AssistantPageContent() {
  const { userId, walletAccountId } = useCurrentUser();
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt");
  const context = searchParams.get("context");
  const accountId = searchParams.get("accountId") ?? walletAccountId ?? "";
  const promptSentRef = useRef(false);
  const { messages, isStreaming, language, setLanguage, send } = useChat(userId);

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
      className="relative flex min-h-[100dvh] flex-col overflow-hidden text-foreground dark:text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(227,24,33,0.08),transparent)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(227,24,33,0.12),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(114,28,36,0.06),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(114,28,36,0.10),transparent)]" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.018]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(120,120,120,0.35) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {isEmpty ? (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
          <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6">
            <ThemeToggle variant="standalone" />
            <LanguageToggle language={language} onChange={setLanguage} />
          </div>

          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card/90 p-2.5 shadow-brand-lg ring-1 ring-border/60 dark:border-white/15 dark:bg-white/10 dark:shadow-black/30 dark:ring-white/15">
              <Image
                src="/seylan-bank-icon.png"
                alt="Seylan Bank"
                width={48}
                height={48}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <h1 className="font-heading text-4xl font-semibold sm:text-5xl">
              Seylan AI
            </h1>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground dark:text-white/40">
              Ask anything about your finances — in English or Sinhala
            </p>
          </div>

          <div className="w-full max-w-2xl">
            <ChatInput onSend={send} disabled={isStreaming} language={language} />
          </div>

          <div className="mt-5 w-full max-w-2xl">
            <SuggestedQuestions language={language} onSelect={send} />
          </div>
        </div>
      ) : (
        <>
          <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-border/80 px-4 py-3 backdrop-blur-sm dark:border-white/[0.08]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-seylan-red/80 dark:text-seylan-red/60">
                Bilingual banking AI
              </p>
              <h1 className="font-heading text-lg font-semibold">Seylan AI</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle variant="standalone" />
              <LanguageToggle language={language} onChange={setLanguage} />
            </div>
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
        <div
          data-module="assistant"
          className="min-h-[100dvh] space-y-4 p-6"
        >
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <AssistantPageContent />
    </Suspense>
  );
}
