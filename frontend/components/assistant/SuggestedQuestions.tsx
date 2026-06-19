"use client";

import { Language } from "@/types";
import { cn } from "@/lib/utils";
import { Wallet, CreditCard, TrendingDown, PiggyBank, Receipt, Languages } from "lucide-react";

interface SuggestedQuestionsProps {
  language: Language;
  onSelect: (question: string) => void;
}

const QUICK_ACTIONS = [
  {
    label: "My balance",
    labelSi: "මගේ ශේෂය",
    icon: Wallet,
    q: "What is my current savings balance?",
  },
  {
    label: "Loan status",
    labelSi: "ණය තත්ත්වය",
    icon: CreditCard,
    q: "When is my next loan payment and how much do I owe?",
  },
  {
    label: "Top expenses",
    labelSi: "ලොකු වියදම්",
    icon: TrendingDown,
    q: "What's my biggest expense category this month?",
  },
  {
    label: "Tax savings",
    labelSi: "බදු ඉතිරිය",
    icon: PiggyBank,
    q: "How much have I saved in my tax jar?",
  },
  {
    label: "Transactions",
    labelSi: "ගනුදෙනු",
    icon: Receipt,
    q: "Show me my recent transactions.",
  },
  {
    label: "සිංහලෙන් කතා කරන්න",
    labelSi: "සිංහල",
    icon: Languages,
    q: "මගේ ශේෂය කොපමණද?",
  },
];

export function SuggestedQuestions({ language, onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {QUICK_ACTIONS.map((action) => {
        const isSinhala = /[඀-෿]/.test(action.label);
        const displayLabel =
          language === "si" && action.labelSi ? action.labelSi : action.label;
        return (
          <button
            key={action.label}
            onClick={() => onSelect(action.q)}
            className={cn(
              "group flex items-center gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.035]",
              "px-4 py-3.5 text-left text-xs text-white/50 backdrop-blur-sm",
              "transition-all duration-150",
              "hover:border-ceyfi-green/35 hover:bg-ceyfi-green/[0.09] hover:text-white/85 hover:scale-[1.02] active:scale-[0.99]",
              isSinhala && "sinhala"
            )}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-ceyfi-green/60 transition-all duration-150 group-hover:bg-ceyfi-green/20 group-hover:text-ceyfi-mint">
              <action.icon className="h-3.5 w-3.5" />
            </span>
            <span className="leading-[1.35]">{displayLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
