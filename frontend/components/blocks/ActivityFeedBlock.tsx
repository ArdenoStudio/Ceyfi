"use client";

/**
 * Expandable activity feed adapted from Watermelon UI transaction-list-base.
 * @see https://ui.watermelon.sh/
 * @see https://github.com/WatermelonCorp/watermellon-registry/blob/main/src/components/watermelon-ui/transaction-list-base.tsx
 */

import { useState } from "react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  type Transition,
} from "motion/react";
import { ArrowRight, Receipt, X, type LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";

export interface ActivityFeedItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  amount: string;
  amountTone?: "credit" | "debit" | "neutral";
  date: string;
  time?: string;
  transactionId?: string;
  paymentMethod?: string;
  accountLabel?: string;
}

export interface ActivityFeedBlockProps {
  title?: string;
  eyebrow?: string;
  items: ActivityFeedItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  footerLabel?: string;
  onFooterClick?: () => void;
  className?: string;
}

const springConfig: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.55,
};

const opacityConfig: Transition = {
  duration: 0.35,
  ease: [0.19, 1, 0.22, 1],
};

const amountToneClass: Record<NonNullable<ActivityFeedItem["amountTone"]>, string> = {
  credit: "text-emerald-500 dark:text-emerald-400",
  debit: "text-foreground dark:text-white/85",
  neutral: "text-muted-foreground dark:text-white/60",
};

export function ActivityFeedBlock({
  title = "Recent activity",
  eyebrow = "Transactions",
  items,
  emptyTitle = "No recent activity",
  emptyDescription = "Your latest account activity will appear here once transactions are recorded.",
  emptyIcon = Receipt,
  footerLabel = "View all transactions",
  onFooterClick,
  className,
}: ActivityFeedBlockProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = items.find((item) => item.id === openId) ?? null;

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.04]",
          className
        )}
      >
        <FeedHeader eyebrow={eyebrow} title={title} />
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          className="py-8"
        />
      </div>
    );
  }

  return (
    <MotionConfig transition={springConfig}>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-border bg-card/80 shadow-brand backdrop-blur-sm dark:border-white/[0.08] dark:bg-white/[0.04]",
          className
        )}
      >
        <div className="p-5">
          <FeedHeader eyebrow={eyebrow} title={title} count={items.length} />

          <AnimatePresence mode="wait" initial={false}>
            {!selected ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={opacityConfig}
                className="mt-4 space-y-1"
              >
                {items.map((item) => (
                  <ActivityRow
                    key={item.id}
                    data={item}
                    onClick={() => setOpenId(item.id)}
                  />
                ))}

                {footerLabel ? (
                  <button
                    type="button"
                    onClick={onFooterClick}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-seylan-red transition hover:bg-seylan-red/5 dark:hover:bg-seylan-red/10"
                  >
                    {footerLabel}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={opacityConfig}
                className="mt-4"
              >
                <ActivityDetail data={selected} onClose={() => setOpenId(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

function FeedHeader({
  eyebrow,
  title,
  count,
}: {
  eyebrow: string;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-seylan-red">
          {eyebrow}
        </p>
        <h3 className="mt-1 font-heading text-lg font-semibold text-foreground dark:text-white">
          {title}
        </h3>
      </div>
      {count !== undefined ? (
        <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-white/40">
          {count} items
        </span>
      ) : null}
    </div>
  );
}

function ActivityRow({
  data,
  onClick,
}: {
  data: ActivityFeedItem;
  onClick: () => void;
}) {
  const tone = data.amountTone ?? "neutral";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-muted/50 dark:hover:bg-white/[0.04]"
    >
      <motion.div
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/70 dark:bg-white/10"
        layoutId={`activity-icon-${data.id}`}
      >
        {data.icon}
      </motion.div>

      <div className="min-w-0 flex-1">
        <motion.p
          className="truncate text-sm font-medium text-foreground dark:text-white/90"
          layoutId={`activity-title-${data.id}`}
        >
          {data.title}
        </motion.p>
        <motion.p
          className="truncate text-xs text-muted-foreground dark:text-white/40"
          layoutId={`activity-subtitle-${data.id}`}
        >
          {data.subtitle}
        </motion.p>
      </div>

      <motion.p
        className={cn("shrink-0 text-sm font-semibold tabular-nums", amountToneClass[tone])}
        layoutId={`activity-amount-${data.id}`}
      >
        {data.amount}
      </motion.p>
    </button>
  );
}

function ActivityDetail({
  data,
  onClose,
}: {
  data: ActivityFeedItem;
  onClose: () => void;
}) {
  const tone = data.amountTone ?? "neutral";

  return (
    <div className="relative rounded-xl border border-border bg-muted/30 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted dark:text-white/50 dark:hover:bg-white/10"
        aria-label="Close details"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <motion.div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/70 dark:bg-white/10"
          layoutId={`activity-icon-${data.id}`}
        >
          {data.icon}
        </motion.div>

        <div className="min-w-0 flex-1 space-y-1">
          <motion.p
            className="font-semibold text-foreground dark:text-white"
            layoutId={`activity-title-${data.id}`}
          >
            {data.title}
          </motion.p>
          <motion.p
            className="text-sm text-muted-foreground dark:text-white/45"
            layoutId={`activity-subtitle-${data.id}`}
          >
            {data.subtitle}
          </motion.p>
          <motion.p
            className={cn("text-lg font-semibold tabular-nums", amountToneClass[tone])}
            layoutId={`activity-amount-${data.id}`}
          >
            {data.amount}
          </motion.p>
        </div>
      </div>

      <motion.div
        className="mt-4 grid gap-2 border-t border-border pt-4 text-xs dark:border-white/[0.06]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...opacityConfig, delay: 0.08 }}
      >
        {data.transactionId ? (
          <DetailRow label="Reference" value={`#${data.transactionId}`} />
        ) : null}
        <DetailRow label="Date" value={data.date} />
        {data.time ? <DetailRow label="Time" value={data.time} /> : null}
        {data.paymentMethod ? (
          <DetailRow label="Paid via" value={data.paymentMethod} />
        ) : null}
        {data.accountLabel ? (
          <DetailRow label="Account" value={data.accountLabel} />
        ) : null}
      </motion.div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground dark:text-white/40">{label}</span>
      <span className="font-medium text-foreground dark:text-white/80">{value}</span>
    </div>
  );
}
