"use client";

import Link from "next/link";
import { Compass, MessageCircle, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";
import type { Bucket } from "@/types";

interface SenderGuidanceCardProps {
  buckets: Bucket[];
  accountId: string;
  onTuneSplit: () => void;
  className?: string;
}

function utilPct(bucket: Bucket): number {
  const total = bucket.balance_lkr + bucket.spent_lkr;
  if (total <= 0) return 0;
  return Math.round((bucket.spent_lkr / total) * 100);
}

export function SenderGuidanceCard({
  buckets,
  accountId,
  onTuneSplit,
  className,
}: SenderGuidanceCardProps) {
  const { t, scriptClassName } = useLocale();

  const school = buckets.find((b) => b.icon === "school" || b.bucket_id.includes("school"));
  const household = buckets.find(
    (b) => b.icon === "household" || b.bucket_id.includes("household")
  );
  const savings = buckets.find(
    (b) => b.icon === "savings" || b.bucket_id.includes("savings")
  );

  const tips: string[] = [t.guidance.tipBlueCollar];
  if (school && utilPct(school) >= 70) tips.push(t.guidance.tipSchool);
  if (household && utilPct(household) >= 60) tips.push(t.guidance.tipHousehold);
  if (savings && utilPct(savings) < 15) tips.push(t.guidance.tipSavings);
  if (tips.length === 1) tips.push(t.guidance.tipBalanced);

  const assistantHref = `/assistant?prompt=${encodeURIComponent(
    "How should I guide my family to spend and save the remittance this month?"
  )}&context=wallet&accountId=${encodeURIComponent(accountId)}`;

  return (
    <section
      data-demo-target="sender-guidance"
      className={cn(
        "rounded-2xl border border-ceyfi-line/70 bg-gradient-to-br from-ceyfi-sprout/80 to-card p-5 dark:border-white/[0.08] dark:from-white/[0.04]",
        scriptClassName,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ceyfi-green/15 text-ceyfi-green">
          <Compass className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold text-ceyfi-ink dark:text-white">
            {t.guidance.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.guidance.subtitle}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {tips.slice(0, 3).map((tip) => (
          <li
            key={tip}
            className="rounded-xl border border-ceyfi-line/50 bg-background/70 px-3.5 py-2.5 text-sm leading-relaxed text-ceyfi-ink dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/85"
          >
            {tip}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={onTuneSplit}
        >
          <PieChart className="mr-1.5 h-3.5 w-3.5" />
          {t.guidance.ctaTune}
        </Button>
        <Link
          href={assistantHref}
          className="inline-flex h-7 items-center justify-center gap-1 rounded-full bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {t.guidance.ctaAsk}
        </Link>
      </div>
    </section>
  );
}
