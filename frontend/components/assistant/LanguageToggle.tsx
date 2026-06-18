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
    <div className="flex items-center gap-1 rounded-full border border-white/[0.10] bg-white/[0.05] p-1 backdrop-blur-sm">
      {LANGS.map((lang) => (
        <button
          key={lang.id}
          type="button"
          onClick={() => onChange(lang.id)}
          className={cn(
            "px-3 py-1 text-xs rounded-full transition-all duration-150",
            lang.className,
            language === lang.id
              ? "bg-white text-seylan-charcoal shadow-sm font-semibold"
              : "text-white/35 hover:text-white/60"
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
