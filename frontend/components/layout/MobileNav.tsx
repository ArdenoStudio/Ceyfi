"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  Activity,
  ArrowUpDown,
  BriefcaseBusiness,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  MoreHorizontal,
  Sparkles,
  User,
  Wallet,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";

export function MobileNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const { t, scriptClassName } = useLocale();

  const mobilePrimary = [
    { href: "/wallet", label: t.nav.wallet, icon: Wallet },
    { href: "/", label: t.nav.overview, icon: LayoutDashboard },
    { href: "/decisions", label: t.nav.decide, icon: Zap },
    { href: "/assistant", label: t.nav.ai, icon: Sparkles },
  ];

  const mobileMore = [
    { href: "/market", label: t.nav.market, icon: LineChart },
    { href: "/transactions", label: t.nav.activity, icon: ArrowUpDown },
    { href: "/loans", label: t.nav.loans, icon: CreditCard },
    { href: "/business", label: t.nav.business, icon: BriefcaseBusiness },
    { href: "/intelligence", label: t.nav.intel, icon: Lightbulb },
    { href: "/scenarios", label: t.nav.scenarios, icon: FlaskConical },
    { href: "/profile", label: t.nav.profile, icon: User },
    { href: "/metrics", label: t.nav.metrics, icon: Activity },
  ].filter((item) => item.href !== "/business" || user?.persona === "sme");

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const moreActive = mobileMore.some((item) => isActive(item.href));

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "fixed inset-x-3 bottom-3 z-30 flex rounded-[22px] border border-border/80 bg-card/92 p-1.5 shadow-[0_16px_44px_rgba(5,46,22,0.12)] backdrop-blur-xl dark:bg-card/88 dark:shadow-[0_16px_44px_rgba(0,0,0,0.45)] md:hidden",
        scriptClassName
      )}
    >
      {mobilePrimary.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[16px] py-2 text-[10px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && !reduceMotion ? (
              <motion.span
                layoutId="mobile-nav-pill"
                className="absolute inset-0 rounded-[16px] bg-primary/10"
                transition={{ type: "spring", stiffness: 480, damping: 36 }}
              />
            ) : active ? (
              <span className="absolute inset-0 rounded-[16px] bg-primary/10" />
            ) : null}
            <item.icon className="relative z-10 h-4 w-4" strokeWidth={1.8} />
            <span className="relative z-10 truncate px-1">{item.label}</span>
          </Link>
        );
      })}

      <Sheet>
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "relative flex h-auto min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[16px] py-2 text-[10px] font-medium",
                moreActive ? "text-primary" : "text-muted-foreground"
              )}
            />
          }
        >
          <MoreHorizontal className="h-4 w-4" />
          <span>{t.nav.morePages}</span>
        </SheetTrigger>
        <SheetContent side="bottom" className={cn("rounded-t-3xl", scriptClassName)}>
          <SheetHeader>
            <SheetTitle>{t.nav.morePages}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4 pb-6">
            {mobileMore.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-3 text-sm"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
