"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  Activity,
  ArrowUpDown,
  BriefcaseBusiness,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  LogOut,
  Sparkles,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageToggle } from "@/components/assistant/LanguageToggle";
import { PersonaAvatar } from "@/components/ui/PersonaAvatar";
import { CeyfiLogoIcon } from "@/components/brand/CeyfiLogoIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  animate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  animate: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm outline-none transition-colors duration-200",
        "focus-visible:ring-2 focus-visible:ring-sidebar-ring/60",
        active
          ? "text-sidebar-accent-foreground"
          : "text-sidebar-foreground/52 hover:text-sidebar-accent-foreground"
      )}
    >
      {active ? (
        <motion.span
          {...(animate ? { layoutId: "sidebar-active-pill" } : {})}
          transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.7 }}
          className="absolute inset-0 rounded-xl border border-sidebar-ring/25 bg-gradient-to-r from-sidebar-accent to-sidebar-accent/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        />
      ) : (
        <span className="absolute inset-0 rounded-xl bg-transparent transition-colors duration-200 group-hover:bg-sidebar-accent/45" />
      )}

      {active ? (
        <motion.span
          {...(animate ? { layoutId: "sidebar-active-bar" } : {})}
          transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.7 }}
          className="absolute left-[calc(0.75rem+1rem)] top-1/2 h-5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sidebar-ring shadow-[0_0_12px_rgba(52,211,153,0.75)] dark:shadow-[0_0_12px_rgba(224,175,73,0.75)]"
        />
      ) : null}

      <span
        className={cn(
          "relative z-10 grid h-8 w-8 place-items-center rounded-[11px] border transition-all duration-200",
          active
            ? "border-sidebar-ring/30 bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_6px_18px_rgba(5,150,105,0.35)] dark:shadow-[0_6px_18px_rgba(227,24,33,0.32)]"
            : "border-sidebar-border bg-sidebar/60 text-sidebar-foreground/55 group-hover:-translate-y-px group-hover:border-sidebar-ring/25 group-hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.8} />
      </span>
      <span className="relative z-10 font-medium transition-transform duration-200 group-hover:translate-x-0.5">
        {label}
      </span>
      {active ? (
        <motion.span
          {...(animate ? { layoutId: "sidebar-active-dot" } : {})}
          className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-ring shadow-[0_0_10px_rgba(52,211,153,0.7)] dark:shadow-[0_0_10px_rgba(224,175,73,0.7)]"
        />
      ) : null}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, locale, setLocale, scriptClassName } = useLocale();
  const reduceMotion = useReducedMotion();
  const animate = !reduceMotion;
  const personaLabel =
    user?.persona === "sme"
      ? t.nav.smeProfile
      : user?.persona === "borrower"
        ? t.nav.borrowerProfile
        : t.nav.diasporaProfile;

  const navGroups = [
    {
      label: t.nav.myMoney,
      items: [
        { href: "/", label: t.nav.overview, icon: LayoutDashboard },
        { href: "/wallet", label: t.nav.wallet, icon: Wallet },
        { href: "/market", label: t.nav.market, icon: LineChart },
        { href: "/transactions", label: t.nav.transactions, icon: ArrowUpDown },
        { href: "/loans", label: t.nav.loans, icon: CreditCard },
        { href: "/business", label: t.nav.business, icon: BriefcaseBusiness },
      ],
    },
    {
      label: t.nav.intelligence,
      items: [
        { href: "/intelligence", label: t.nav.intelligencePage, icon: Lightbulb },
        { href: "/scenarios", label: t.nav.scenarios, icon: FlaskConical },
        { href: "/decisions", label: t.nav.decisions, icon: Zap },
        { href: "/assistant", label: t.nav.assistant, icon: Sparkles },
      ],
    },
  ];

  const systemItems = [{ href: "/metrics", label: t.nav.metrics, icon: Activity }];

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden w-[17.5rem] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex",
        scriptClassName
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(120%_70%_at_15%_0%,rgba(52,211,153,0.16),transparent_70%)] dark:bg-[radial-gradient(120%_70%_at_15%_0%,rgba(224,175,73,0.14),transparent_70%)]"
      />

      <div className="relative border-b border-sidebar-border px-6 py-6">
        <Link href="/" className="group flex items-center gap-3">
          <CeyfiLogoIcon
            size={40}
            className="transition-transform duration-200 group-hover:scale-105"
          />
          <span>
            <span className="block font-heading text-base font-bold tracking-[0.16em]">
              {t.common.ceyfi}
            </span>
            <span className="block text-[11px] text-sidebar-foreground/42">
              {t.nav.tagline}
            </span>
          </span>
        </Link>
      </div>

      <div className="relative border-b border-sidebar-border px-4 py-4">
        <Link
          href="/profile"
          className="interactive-card flex items-center gap-3 rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-3 transition-all duration-200 hover:border-sidebar-ring/25 hover:bg-sidebar-accent"
        >
          <PersonaAvatar
            name={user?.name ?? t.nav.demoUser}
            persona={user?.persona}
            size="sm"
            className="rounded-[14px]"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">
              {user?.name ?? t.nav.demoUser}
            </div>
            <div className="truncate text-[10px] text-sidebar-foreground/38">
              {personaLabel}
            </div>
          </div>
        </Link>
      </div>

      <LayoutGroup>
        <nav
          aria-label="Main navigation"
          className="relative flex-1 overflow-y-auto px-4 py-5 [--nav-icon-rail:2.75rem]"
        >
          <div
            aria-hidden
            className="absolute bottom-8 left-[var(--nav-icon-rail)] top-8 w-px -translate-x-1/2 bg-gradient-to-b from-sidebar-ring/35 via-sidebar-border to-transparent"
          />
          {navGroups.map((group, groupIndex) => (
            <div
              key={group.label}
              className={cn("mb-6", groupIndex === navGroups.length - 1 && "mb-5")}
            >
              <div className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/28">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items
                  .filter((item) => item.href !== "/business" || user?.persona === "sme")
                  .map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isActive(item.href)}
                      animate={animate}
                    />
                  ))}
              </div>
            </div>
          ))}

          <div className="mt-auto border-t border-sidebar-border pt-4">
            <div className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/28">
              {t.nav.system}
            </div>
            <div className="space-y-1">
              {systemItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isActive(item.href)}
                  animate={animate}
                />
              ))}
            </div>
          </div>
        </nav>
      </LayoutGroup>

      <div className="relative border-t border-sidebar-border px-4 py-5">
        <div className="mb-3 flex items-center justify-between gap-2 px-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/35">
            {t.common.language}
          </span>
          <LanguageToggle
            language={locale}
            onChange={setLocale}
            ariaLabel={t.common.language}
            size="sm"
          />
        </div>
        <div className="mb-3 flex items-center justify-between px-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/35">
            {t.common.theme}
          </span>
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={logout}
          className="interactive-press mb-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-sidebar-foreground/45 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          {t.common.switchPersona}
        </button>
        <div className="flex items-center gap-2 px-2 text-[11px] leading-none text-sidebar-foreground/32">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sidebar-ring/70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sidebar-ring" />
          </span>
          {t.common.demoDataConnected}
        </div>
        <div className="mt-1 px-2 text-[10px] text-sidebar-foreground/20">
          {t.common.demoWorkspace}
        </div>
      </div>
    </aside>
  );
}
