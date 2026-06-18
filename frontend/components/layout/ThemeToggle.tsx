"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "sidebar" | "topbar" | "standalone";
}

export function ThemeToggle({ variant = "sidebar" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      suppressHydrationWarning
      className={cn(
        "grid h-9 w-9 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        variant === "sidebar" &&
          "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        variant === "topbar" &&
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        variant === "standalone" &&
          "border border-border bg-card text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground",
      )}
    >
      {mounted ? (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Moon className="h-4 w-4 opacity-0" />}
    </button>
  );
}
