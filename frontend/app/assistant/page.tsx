"use client";

import { Suspense, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useChat } from "@/hooks/useChat";
import { ChatThread } from "@/components/assistant/ChatThread";
import { AssistantStatusAnnouncer } from "@/components/assistant/AssistantStatusAnnouncer";
import { ChatInput, type ChatInputHandle } from "@/components/assistant/ChatInput";
import { LanguageToggle } from "@/components/assistant/LanguageToggle";
import { SuggestedQuestions } from "@/components/assistant/SuggestedQuestions";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { GradientText } from "@/components/motion/GradientText";
import { ShinyText } from "@/components/motion/ShinyText";
import { TypewriterSubtitle } from "@/components/ui/TypewriterSubtitle";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionDiagramSkeleton } from "@/components/lazy/LazySkeletons";
import { FaqSection } from "@/components/blocks/FaqSection";
import { getFamilyWallet } from "@/lib/api";
import { WalletState } from "@/types";

const FinanceConnectionDiagram = dynamic(
  () =>
    import("@/components/assistant/FinanceConnectionDiagram").then((m) => ({
      default: m.FinanceConnectionDiagram,
    })),
  {
    loading: () => <ConnectionDiagramSkeleton className="mt-8" />,
    ssr: false,
  }
);

const TYPEWRITER_PROMPTS = [
  "How much can I safely move to savings this week?",
  "Explain my latest grocery spending trend",
  "When is my next loan payment due?",
];

function AssistantPageContent() {
  const { userId, walletAccountId } = useCurrentUser();
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt");
  const context = searchParams.get("context");
  const accountId = searchParams.get("accountId") ?? walletAccountId ?? "";
  const promptSentRef = useRef(false);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const { messages, isStreaming, language, setLanguage, send } = useChat(userId);

  useEffect(() => {
    promptSentRef.current = false;
  }, [prompt, context, accountId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      chatInputRef.current?.focus();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      <AssistantStatusAnnouncer messages={messages} isStreaming={isStreaming} />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(5,150,105,0.08),transparent)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(52,211,153,0.12),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(5,46,22,0.06),transparent)] dark:bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(5,46,22,0.12),transparent)]" />
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
        <div className="stagger relative z-10 flex flex-1 flex-col items-center justify-center px-4">
          <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6">
            <ThemeToggle variant="standalone" />
            <LanguageToggle language={language} onChange={setLanguage} />
          </div>

          <div className="mb-8 text-center">
            <h1 className="font-heading text-4xl font-semibold sm:text-5xl">
              <GradientText
                className="font-heading text-4xl font-semibold sm:text-5xl"
                colors={["#059669", "#34D399", "#052E16"]}
                animationSpeed={7}
              >
                CEYFI Assistant
              </GradientText>
            </h1>
            <p className="mt-3 text-sm text-ceyfi-muted dark:text-white/55">
              <ShinyText
                text="Account-aware guidance in English or Sinhala"
                color="#617267"
                shineColor="#059669"
                speed={3}
                className="text-sm font-medium dark:text-white/55"
              />
            </p>
            <TypewriterSubtitle prompts={TYPEWRITER_PROMPTS} />
            <FinanceConnectionDiagram className="mt-8" />
          </div>

          <div className="w-full max-w-2xl">
            <ChatInput
              ref={chatInputRef}
              onSend={send}
              disabled={isStreaming}
              language={language}
            />
          </div>

          <div className="mt-5 w-full max-w-2xl">
            <SuggestedQuestions language={language} onSelect={send} />
          </div>

          <FaqSection
            variant="compact"
            className="mt-8 mb-6 w-full max-w-2xl"
          />
        </div>
      ) : (
        <>
          <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-border/80 px-4 py-3 backdrop-blur-sm dark:border-white/[0.08]">
            <div className="flex items-center gap-3">
              <Image
                src="/ceyfi-logo.svg"
                alt="CEYFI"
                width={28}
                height={28}
                priority
                sizes="28px"
                className="h-7 w-7 dark:brightness-0 dark:invert"
              />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ceyfi-green">
                  Bilingual financial AI
                </p>
                <h1 className="font-heading text-lg font-semibold">CEYFI Assistant</h1>
              </div>
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

          <div className="relative z-10 mx-auto w-full max-w-2xl space-y-3 px-4 pb-2">
            <FaqSection variant="collapsible" />
            <ChatInput
              ref={chatInputRef}
              onSend={send}
              disabled={isStreaming}
              language={language}
            />
          </div>
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
