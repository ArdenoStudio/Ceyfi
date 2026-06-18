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
  MoreHorizontal,
  Sparkles,
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

const MOBILE_PRIMARY = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Activity", icon: ArrowUpDown },
  { href: "/decisions", label: "Decisions", icon: Zap },
  { href: "/intelligence", label: "Intel", icon: Lightbulb },
  { href: "/assistant", label: "CEYFI AI", icon: Sparkles },
];

const MOBILE_MORE = [
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/loans", label: "Loans", icon: CreditCard },
  { href: "/business", label: "Business", icon: BriefcaseBusiness },
  { href: "/scenarios", label: "Scenarios", icon: FlaskConical },
  { href: "/metrics", label: "Metrics", icon: Activity },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const moreActive = MOBILE_MORE.some((item) => isActive(item.href));

  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 flex rounded-[22px] border border-ceyfi-line/80 bg-white/94 p-1.5 shadow-[0_16px_44px_rgba(5,46,22,0.14)] backdrop-blur-xl md:hidden">
      {MOBILE_PRIMARY.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[16px] py-2 text-[10px] font-medium transition-colors",
              active
                ? "bg-ceyfi-sprout text-ceyfi-green"
                : "text-ceyfi-muted hover:text-ceyfi-ink"
            )}
          >
            <item.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.8} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}

      <Sheet>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              className={cn(
                "flex h-auto min-w-0 flex-1 flex-col items-center gap-1 rounded-[16px] py-2 text-[10px] font-medium",
                moreActive ? "bg-ceyfi-sprout text-ceyfi-green" : "text-ceyfi-muted"
              )}
            />
          }
        >
          <MoreHorizontal className="h-[18px] w-[18px]" />
          <span>More</span>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-[22px]">
          <SheetHeader>
            <SheetTitle>More pages</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 px-4 pb-6">
            {MOBILE_MORE.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-center text-xs font-medium",
                  isActive(item.href)
                    ? "border-ceyfi-green/30 bg-ceyfi-sprout text-ceyfi-green"
                    : "border-ceyfi-line text-ceyfi-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
