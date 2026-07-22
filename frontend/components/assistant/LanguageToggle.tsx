"use client";

import { Language } from "@/types";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  language: Language;
  onChange: (lang: Language) => void;
  /** Accessible name for the control group */
  ariaLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

const LANGS: { id: Language; label: string; className?: string }[] = [
  { id: "en", label: "EN" },
  { id: "si", label: "සිං", className: "sinhala" },
  { id: "ta", label: "தமிழ்", className: "tamil" },
];

export function LanguageToggle({
  language,
  onChange,
  ariaLabel = "Language",
  size = "md",
  className,
}: LanguageToggleProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "flex items-center gap-1 rounded-full border border-border/80 bg-card/80 p-1 backdrop-blur-sm dark:border-white/10 dark:bg-white/5",
        className
      )}
    >
      {LANGS.map((lang) => (
        <button
          key={lang.id}
          type="button"
          onClick={() => onChange(lang.id)}
          aria-pressed={language === lang.id}
          aria-label={`Switch to ${lang.id === "en" ? "English" : lang.id === "si" ? "Sinhala" : "Tamil"}`}
          className={cn(
            "interactive-press rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            size === "sm" ? "min-h-8 px-2 py-0.5 text-[10px]" : "min-h-11 px-3 py-1 text-xs",
            lang.className,
            language === lang.id
              ? "bg-background font-semibold text-foreground shadow-sm dark:bg-white dark:text-ceyfi-ink"
              : "text-muted-foreground hover:text-foreground dark:text-white/35 dark:hover:text-white/60",
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
