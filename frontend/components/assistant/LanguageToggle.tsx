"use client";

import { Language } from "@/types";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  language: Language;
  onChange: (lang: Language) => void;
}

export function LanguageToggle({ language, onChange }: LanguageToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/[0.10] bg-white/[0.05] p-1 backdrop-blur-sm">
      <button
        onClick={() => onChange("en")}
        className={cn(
          "px-3 py-1 text-xs rounded-full transition-all duration-150",
          language === "en"
            ? "bg-white text-ceyfi-ink shadow-sm font-semibold"
            : "text-white/35 hover:text-white/60"
        )}
      >
        EN
      </button>
      <button
        onClick={() => onChange("si")}
        className={cn(
          "px-3 py-1 text-xs rounded-full transition-all duration-150 sinhala",
          language === "si"
            ? "bg-white text-ceyfi-ink shadow-sm font-semibold"
            : "text-white/35 hover:text-white/60"
        )}
      >
        SI
      </button>
    </div>
  );
}
