"use client";

import Link from "next/link";
import { Bell, SlidersHorizontal, Wallet } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const DEMO_ALERTS = [
  {
    id: "1",
    title: "Household spend",
    body: "Softlogic Glomark · LKR 12,400 from the Household bucket.",
    when: "Just now",
  },
  {
    id: "2",
    title: "Remittance landed",
    body: "GBP 600 credited to the family wallet and split 40/40/20.",
    when: "2h ago",
  },
  {
    id: "3",
    title: "Loan reminder",
    body: "Personal loan instalment LKR 22,000 due 25 July.",
    when: "Yesterday",
  },
];

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
        <Sheet>
          <SheetTrigger
            aria-label="Notifications"
            render={
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            }
          >
            <Bell className="h-[18px] w-[18px]" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100%,20rem)]">
            <SheetHeader>
              <SheetTitle>Alerts</SheetTitle>
              <SheetDescription>Recent demo notifications</SheetDescription>
            </SheetHeader>
            <ul className="space-y-3 px-4 pb-4">
              {DEMO_ALERTS.map((alert) => (
                <li
                  key={alert.id}
                  className="rounded-xl border border-border/70 bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{alert.when}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {alert.body}
                  </p>
                </li>
              ))}
            </ul>
            <div className="px-4 pb-6">
              <Link
                href="/wallet"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <Wallet className="h-4 w-4" />
                Open wallet
              </Link>
            </div>
          </SheetContent>
        </Sheet>
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
