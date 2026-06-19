"use client";

import { Language } from "@/types";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  language: Language;
  onChange: (lang: Language) => void;
}

const LANGS: { id: Language; label: string; className?: string }[] = [
  { id: "en", label: "EN" },
  { id: "si", label: "SI", className: "sinhala" },
  { id: "ta", label: "TA" },
];

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <div
      role="group"
      aria-label="Assistant language"
      className="flex items-center gap-1 rounded-full border border-border/80 bg-card/80 p-1 backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
    >
      {LANGS.map((lang) => (
        <button
          key={lang.id}
          type="button"
          onClick={() => onChange(lang.id)}
          aria-pressed={language === lang.id}
          aria-label={`Switch to ${lang.id === "en" ? "English" : lang.id === "si" ? "Sinhala" : "Tamil"}`}
          className={cn(
            "interactive-press min-h-11 rounded-full px-3 py-1 text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            lang.className,
            language === lang.id
              ? "bg-background font-semibold text-foreground shadow-sm dark:bg-white dark:text-seylan-charcoal"
              : "text-muted-foreground hover:text-foreground dark:text-white/35 dark:hover:text-white/60",
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
