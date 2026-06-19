"use client";

import Link from "next/link";
import { Bell, SlidersHorizontal } from "lucide-react";
import { CeyfiMark } from "@/components/brand/CeyfiMark";

export function AppTopbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ceyfi-line/70 bg-ceyfi-canvas/88 px-4 backdrop-blur-xl md:hidden">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-ceyfi-green text-white">
          <CeyfiMark className="h-5 w-5 text-white" />
        </span>
        <span>
          <span className="block font-heading text-sm font-bold tracking-[0.12em] text-ceyfi-ink">
            CEYFI
          </span>
          <span className="block text-[9px] text-ceyfi-muted">
            Every rupee, clear
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Notifications"
          className="grid h-9 w-9 place-items-center rounded-xl text-ceyfi-muted transition hover:bg-white hover:text-ceyfi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceyfi-green/30"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>
        <Link
          href="/profile"
          aria-label="Profile and preferences"
          className="grid h-9 w-9 place-items-center rounded-xl text-ceyfi-muted transition hover:bg-white hover:text-ceyfi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceyfi-green/30"
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" />
        </Link>
      </div>
    </header>
  );
}
