"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "sidebar" | "topbar" | "standalone";
}

export function ThemeToggle({ variant = "sidebar" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const reduceMotion = useReducedMotion();

  const isDark = mounted && theme === "dark";

  function toggle() {
    document.documentElement.classList.add("theme-transition");
    setTheme(isDark ? "light" : "dark");
    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 400);
  }

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      suppressHydrationWarning
      className={cn(
        "interactive-press grid h-9 w-9 place-items-center rounded-xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        variant === "sidebar" &&
          "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        variant === "topbar" &&
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "standalone" &&
          "border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground",
      )}
    >
      <motion.span
        key={mounted ? (isDark ? "sun" : "moon") : "placeholder"}
        initial={reduceMotion ? false : { rotate: -30, opacity: 0, scale: 0.85 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        className="grid place-items-center"
      >
        {mounted ? (
          isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )
        ) : (
          <Moon className="h-4 w-4 opacity-0" />
        )}
      </motion.span>
    </button>
  );
}
