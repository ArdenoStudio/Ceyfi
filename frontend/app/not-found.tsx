import Link from "next/link";
import { CeyfiMark } from "@/components/brand/CeyfiMark";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/wallet", label: "Wallet" },
  { href: "/assistant", label: "Assistant" },
  { href: "/profile", label: "Profile" },
  { href: "/status", label: "Status" },
] as const;

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ceyfi-canvas p-6 dark:bg-ceyfi-deep">
      <div className="w-full max-w-lg rounded-[2rem] border border-ceyfi-line bg-ceyfi-paper p-8 text-center shadow-brand-lg dark:border-white/10 dark:bg-white/[0.05]">
        <Link href="/" className="inline-flex flex-col items-center gap-3">
          <span className="grid size-14 place-items-center rounded-2xl bg-ceyfi-sprout text-ceyfi-green dark:bg-ceyfi-green/15">
            <CeyfiMark className="size-8" title="" aria-hidden />
          </span>
          <span className="font-heading text-sm font-bold tracking-[0.2em] text-ceyfi-ink dark:text-white">
            CEYFI
          </span>
        </Link>

        <p className="mt-6 text-5xl font-bold text-ceyfi-green">404</p>
        <h1 className="mt-2 text-xl font-semibold text-ceyfi-ink dark:text-white">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This route isn&apos;t part of CEYFI yet. Head back to a main section below.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-ceyfi-line px-3 py-1.5 text-xs font-medium text-ceyfi-ink transition hover:border-ceyfi-green hover:text-ceyfi-green dark:border-white/15 dark:text-white/80 dark:hover:border-ceyfi-mint dark:hover:text-ceyfi-mint"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link href="/" className="mt-8 inline-block">
          <Button className="min-w-[10rem]">Back to overview</Button>
        </Link>
      </div>
    </div>
  );
}
