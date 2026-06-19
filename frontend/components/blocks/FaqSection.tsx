"use client";

/**
 * FAQ accordion adapted from HyperUI "divided with chevrons" + shadcn Accordion.
 * @see https://www.hyperui.dev/components/marketing/faqs
 */

import { useState } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
}

export const CEYFI_FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is CEYFI and how does it connect to my Seylan account?",
    answer:
      "CEYFI is an account-aware financial assistant layered on top of your Seylan Bank data. It reads balances, transactions, loans, and wallet buckets so every insight and recommendation reflects your real accounts — not generic advice.",
  },
  {
    question: "Can I ask the assistant in Sinhala?",
    answer:
      "Yes. Switch the language toggle to Sinhala (සිංහල) and ask naturally — for example, \"මගේ පවුලේ wallet එකේ balance එක කොහොමද?\" CEYFI replies in the same language while keeping numbers and account context accurate.",
  },
  {
    question: "How does the family wallet work for diaspora remittances?",
    answer:
      "Incoming GBP remittances land in your family wallet and split across Household, Education, and Savings buckets. CEYFI tracks spend against each allocation so you can see when a bucket is running low before the next transfer arrives.",
  },
  {
    question: "What is the tax jar and when does it trigger?",
    answer:
      "For business accounts, CEYFI automatically sets aside a percentage of incoming revenue into a tax jar — for example, LKR 820 from an LKR 8,200 cash sale. You always see the reserved amount alongside your spendable balance.",
  },
  {
    question: "How do CEYFI decisions help me save money?",
    answer:
      "The Decisions page ranks one actionable card at a time — backed by your transaction history and forecasts. Instead of a long report, you get a single next step, such as moving surplus cash to savings or deferring a non-essential purchase.",
  },
  {
    question: "Is my financial data safe in demo mode?",
    answer:
      "The demo uses mock Seylan fixtures — no live credentials or real account numbers. When connected to production, CEYFI reads data through secure bank APIs and never stores your login password.",
  },
];

export interface FaqSectionProps {
  items?: FaqItem[];
  eyebrow?: string;
  heading?: string;
  description?: string;
  /** Full accordion, compact inline, or collapsible help panel wrapper */
  variant?: "default" | "compact" | "collapsible";
  className?: string;
}

function FaqAccordion({
  items,
  compact = false,
}: {
  items: FaqItem[];
  compact?: boolean;
}) {
  return (
    <Accordion
      className={cn(
        "w-full divide-y divide-ceyfi-line/70 rounded-[22px] border border-ceyfi-line/70 bg-ceyfi-paper dark:divide-white/10 dark:border-white/10 dark:bg-white/[0.04]",
        compact ? "text-left" : ""
      )}
    >
      {items.map((item, index) => (
        <AccordionItem
          key={item.question}
          value={`faq-${index}`}
          className="border-0 px-4 first:rounded-t-[22px] last:rounded-b-[22px] sm:px-5"
        >
          <AccordionTrigger
            className={cn(
              "gap-3 py-4 text-left font-semibold text-ceyfi-ink hover:no-underline dark:text-white",
              compact ? "text-sm" : "text-sm sm:text-[15px]"
            )}
          >
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-sm leading-relaxed text-ceyfi-muted dark:text-white/60">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function FaqSection({
  items = CEYFI_FAQ_ITEMS,
  eyebrow = "Help",
  heading = "Frequently asked questions",
  description = "Quick answers about CEYFI, your accounts, and the Sinhala assistant.",
  variant = "default",
  className,
}: FaqSectionProps) {
  const [open, setOpen] = useState(false);

  if (variant === "collapsible") {
    return (
      <section className={cn("w-full", className)}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 rounded-[22px] border border-ceyfi-line/70 bg-ceyfi-paper px-4 py-3 text-left transition hover:border-ceyfi-green/30 hover:bg-ceyfi-sprout/40 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-ceyfi-green/25 dark:hover:bg-white/[0.06] sm:px-5"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-ceyfi-sprout text-ceyfi-green dark:bg-ceyfi-green/15">
              <CircleHelp className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-ceyfi-green">
                {eyebrow}
              </span>
              <span className="text-sm font-semibold text-ceyfi-ink dark:text-white">
                {heading}
              </span>
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-ceyfi-muted transition-transform duration-200 dark:text-white/50",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </button>

        {open ? (
          <div className="mt-3">
            <FaqAccordion items={items} compact />
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className={cn(
        "rounded-[22px] border border-ceyfi-line/70 bg-gradient-to-br from-ceyfi-sprout/40 to-ceyfi-paper p-5 dark:border-white/10 dark:from-white/[0.05] dark:to-white/[0.02] sm:p-6",
        className
      )}
    >
      <div className={cn("space-y-1", variant === "compact" ? "mb-4" : "mb-5")}>
        {eyebrow ? (
          <Badge
            variant="secondary"
            className="border-ceyfi-line bg-ceyfi-sprout text-[10px] font-semibold uppercase tracking-[0.16em] text-ceyfi-green dark:bg-ceyfi-green/15"
          >
            {eyebrow}
          </Badge>
        ) : null}
        <h2
          className={cn(
            "font-heading font-semibold tracking-[-0.03em] text-ceyfi-ink dark:text-white",
            variant === "compact" ? "text-lg" : "text-xl sm:text-2xl"
          )}
        >
          {heading}
        </h2>
        {description ? (
          <p className="text-sm text-ceyfi-muted dark:text-white/55">{description}</p>
        ) : null}
      </div>

      <FaqAccordion items={items} compact={variant === "compact"} />
    </section>
  );
}
