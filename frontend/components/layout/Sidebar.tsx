"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowUpDown,
  BriefcaseBusiness,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "My Money",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/wallet", label: "Wallet", icon: Wallet },
      { href: "/transactions", label: "Transactions", icon: ArrowUpDown },
      { href: "/loans", label: "Loans", icon: CreditCard },
      { href: "/business", label: "Business", icon: BriefcaseBusiness },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/intelligence", label: "Intelligence", icon: Lightbulb },
      { href: "/scenarios", label: "Scenarios", icon: FlaskConical },
      { href: "/decisions", label: "Decisions", icon: Zap },
      { href: "/assistant", label: "CEYFI AI", icon: Sparkles },
    ],
  },
];

const SYSTEM_ITEMS = [
  { href: "/metrics", label: "Metrics", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17.5rem] flex-col border-r border-white/8 bg-ceyfi-deep text-white md:flex">
      <div className="border-b border-white/8 px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-ceyfi-green text-lg font-bold shadow-[0_8px_24px_rgba(5,150,105,0.28)]">
            C
          </span>
          <span>
            <span className="block font-heading text-base font-bold tracking-[0.16em]">
              CEYFI
            </span>
            <span className="block text-[11px] text-white/42">
              Powered by Seylan Bank
            </span>
          </span>
        </Link>
      </div>

      <div className="border-b border-white/8 px-4 py-4">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.055] p-3 transition-colors hover:bg-white/[0.08]"
        >
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[14px] ring-1 ring-white/12">
            <Image
              src={user?.avatar ?? "/nimal-avatar.jpg"}
              alt={user?.name ?? "User"}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user?.name ?? "Demo user"}</div>
            <div className="truncate font-mono text-[10px] text-white/38">
              {user?.user_id ?? "—"}
            </div>
          </div>
        </Link>
      </div>

      <nav className="relative flex-1 overflow-y-auto px-4 py-5">
        <div className="absolute bottom-8 left-[2.05rem] top-8 w-px bg-gradient-to-b from-ceyfi-mint/35 via-white/8 to-transparent" />
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/28">
              {group.label}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                      active
                        ? "bg-white/[0.09] text-white"
                        : "text-white/52 hover:bg-white/[0.055] hover:text-white"
                    )}
                  >
                    <span
                      className={cn(
                        "relative z-10 grid h-8 w-8 place-items-center rounded-[11px] border transition-colors",
                        active
                          ? "border-ceyfi-mint/30 bg-ceyfi-green text-white"
                          : "border-white/8 bg-ceyfi-deep text-white/55 group-hover:text-white"
                      )}
                    >
                      <item.icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="font-medium">{item.label}</span>
                    {active ? (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-ceyfi-mint shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-auto border-t border-white/8 pt-4">
          <div className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/28">
            System
          </div>
          {SYSTEM_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                  active ? "bg-white/[0.09] text-white" : "text-white/52 hover:bg-white/[0.055] hover:text-white"
                )}
              >
                <span className="grid h-8 w-8 place-items-center rounded-[11px] border border-white/8 bg-ceyfi-deep">
                  <item.icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/8 px-6 py-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Theme</span>
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={logout}
          className="mb-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-white/45 transition hover:bg-white/[0.06] hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Switch persona
        </button>
        <div className="flex items-center gap-2 text-[11px] text-white/32">
          <span className="h-1.5 w-1.5 rounded-full bg-ceyfi-mint" />
          Demo data connected
        </div>
        <div className="mt-1 text-[10px] text-white/20">
          CEYFI · Powered by Seylan
        </div>
      </div>
    </aside>
  );
}
