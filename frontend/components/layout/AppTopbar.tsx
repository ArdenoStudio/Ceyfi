"use client";

import Link from "next/link";
import { Bell, SlidersHorizontal } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function AppTopbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/88 px-4 backdrop-blur-xl md:hidden">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-primary text-sm font-bold text-primary-foreground">
          C
        </span>
        <span>
          <span className="block font-heading text-sm font-bold tracking-[0.12em] text-foreground">
            CEYFI
          </span>
          <span className="block text-[9px] text-muted-foreground">
            Every rupee, clear
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-1">
        <ThemeToggle variant="topbar" />
        <button
          type="button"
          aria-label="Notifications"
          className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <Link
          href="/profile"
          aria-label="Profile and preferences"
          className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" />
        </Link>
      </div>
    </header>
  );
}
