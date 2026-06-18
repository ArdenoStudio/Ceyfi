"use client";

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
import { PersonaAvatar } from "@/components/ui/PersonaAvatar";
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17.5rem] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="border-b border-sidebar-border px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-sidebar-primary text-lg font-bold text-sidebar-primary-foreground shadow-[0_8px_24px_rgba(5,150,105,0.28)] dark:shadow-[0_8px_24px_rgba(227,24,33,0.28)]">
            C
          </span>
          <span>
            <span className="block font-heading text-base font-bold tracking-[0.16em]">
              CEYFI
            </span>
            <span className="block text-[11px] text-sidebar-foreground/42">
              Powered by Seylan Bank
            </span>
          </span>
        </Link>
      </div>

      <div className="border-b border-sidebar-border px-4 py-4">
        <Link
          href="/profile"
          className="interactive-card flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-3 transition-all duration-200 hover:bg-sidebar-accent"
        >
          <PersonaAvatar
            name={user?.name ?? "Demo user"}
            persona={user?.persona}
            size="sm"
            className="rounded-[14px]"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user?.name ?? "Demo user"}</div>
            <div className="truncate font-mono text-[10px] text-sidebar-foreground/38">
              {user?.user_id ?? "—"}
            </div>
          </div>
        </Link>
      </div>

      <nav className="relative flex-1 overflow-y-auto px-4 py-5">
        <div className="absolute bottom-8 left-[2.05rem] top-8 w-px bg-gradient-to-b from-sidebar-ring/35 via-sidebar-border to-transparent" />
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/28">
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
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/52 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "relative z-10 grid h-8 w-8 place-items-center rounded-[11px] border transition-colors",
                        active
                          ? "border-sidebar-ring/30 bg-sidebar-primary text-sidebar-primary-foreground"
                          : "border-sidebar-border bg-sidebar text-sidebar-foreground/55 group-hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="font-medium">{item.label}</span>
                    {active ? (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-ring shadow-[0_0_10px_rgba(52,211,153,0.7)] dark:shadow-[0_0_10px_rgba(224,175,73,0.7)]" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-auto border-t border-sidebar-border pt-4">
          <div className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/28">
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
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/52 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <span className="grid h-8 w-8 place-items-center rounded-[11px] border border-sidebar-border bg-sidebar">
                  <item.icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-sidebar-border px-6 py-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/35">Theme</span>
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={logout}
          className="interactive-press mb-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-sidebar-foreground/45 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Switch persona
        </button>
        <div className="flex items-center gap-2 text-[11px] text-sidebar-foreground/32">
          <span className="h-1.5 w-1.5 rounded-full bg-sidebar-ring" />
          Demo data connected
        </div>
        <div className="mt-1 text-[10px] text-sidebar-foreground/20">
          CEYFI · Powered by Seylan
        </div>
      </div>
    </aside>
  );
}
