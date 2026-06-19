"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackToTopButtonProps {
  threshold?: number;
}

export function BackToTopButton({ threshold = 500 }: BackToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > threshold);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={cn(
        "fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full",
        "bg-ceyfi-deep text-white shadow-lg shadow-ceyfi-deep/25",
        "transition-all duration-200 hover:bg-ceyfi-green hover:shadow-ceyfi-green/30",
        "will-change-transform animate-fade-up dark:bg-ceyfi-green dark:hover:bg-ceyfi-mint dark:text-ceyfi-deep"
      )}
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
