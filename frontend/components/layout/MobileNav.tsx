"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpDown,
  CreditCard,
  LayoutDashboard,
  Sparkles,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/transactions", label: "Activity", icon: ArrowUpDown },
  { href: "/loans", label: "Loans", icon: CreditCard },
  { href: "/assistant", label: "AI", icon: Sparkles },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 flex rounded-[22px] border border-ceyfi-line/80 bg-white/94 p-1.5 shadow-[0_16px_44px_rgba(5,46,22,0.14)] backdrop-blur-xl md:hidden">
      {MOBILE_NAV.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));

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
            <item.icon
              className="h-[18px] w-[18px]"
              strokeWidth={active ? 2.2 : 1.8}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
