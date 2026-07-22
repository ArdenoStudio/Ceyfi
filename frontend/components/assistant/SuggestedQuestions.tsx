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
    labelTa: "என் இருப்பு",
    icon: Wallet,
    q: "What is my current savings balance?",
  },
  {
    label: "Loan status",
    labelSi: "ණය තත්ත්වය",
    labelTa: "கடன் நிலை",
    icon: CreditCard,
    q: "When is my next loan payment and how much do I owe?",
  },
  {
    label: "Top expenses",
    labelSi: "ලොකු වියදම්",
    labelTa: "பெரிய செலவுகள்",
    icon: TrendingDown,
    q: "What's my biggest expense category this month?",
  },
  {
    label: "Tax savings",
    labelSi: "බදු ඉතිරිය",
    labelTa: "வரி சேமிப்பு",
    icon: PiggyBank,
    q: "How much have I saved in my tax jar?",
  },
  {
    label: "Transactions",
    labelSi: "ගනුදෙනු",
    labelTa: "பரிவர்த்தனைகள்",
    icon: Receipt,
    q: "Show me my recent transactions.",
  },
  {
    label: "සිංහලෙන් කතා කරන්න",
    labelSi: "සිංහල",
    labelTa: "தமிழில் பேசு",
    icon: Languages,
    q: "මගේ ශේෂය කොපමණද?",
  },
];

export function SuggestedQuestions({ language, onSelect }: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {QUICK_ACTIONS.map((action) => {
        const isSinhala = /[඀-෿]/.test(action.label) || language === "si";
        const isTamil = language === "ta";
        const displayLabel =
          language === "si" && action.labelSi
            ? action.labelSi
            : language === "ta" && action.labelTa
              ? action.labelTa
              : action.label;
        return (
          <button
            key={action.label}
            onClick={() => onSelect(action.q)}
            className={cn(
              "interactive-card flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-4 py-2 text-xs text-muted-foreground backdrop-blur-sm",
              "transition-all duration-200",
              "hover:border-primary/30 hover:bg-primary/5 hover:text-foreground dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50 dark:hover:border-primary/30 dark:hover:bg-primary/[0.08] dark:hover:text-white/80",
              isSinhala && "sinhala",
              isTamil && "tamil"
            )}
          >
            <action.icon className="h-3.5 w-3.5 shrink-0 text-primary/50" />
            {displayLabel}
          </button>
        );
      })}
    </div>
  );
}
