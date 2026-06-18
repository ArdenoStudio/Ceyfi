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
    <div className="flex flex-wrap justify-center gap-2">
      {QUICK_ACTIONS.map((action) => {
        const isSinhala = /[඀-෿]/.test(action.label);
        const displayLabel =
          language === "si" && action.labelSi ? action.labelSi : action.label;
        return (
          <button
            key={action.label}
            onClick={() => onSelect(action.q)}
            className={cn(
              "flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04]",
              "px-4 py-2 text-xs text-white/50 backdrop-blur-sm",
              "transition-all duration-150",
              "hover:border-seylan-red/30 hover:bg-seylan-red/[0.08] hover:text-white/80",
              isSinhala && "sinhala"
            )}
          >
            <action.icon className="h-3.5 w-3.5 shrink-0 text-seylan-red/50" />
            {displayLabel}
          </button>
        );
      })}
    </div>
  );
}
