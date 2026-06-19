"use client";

/**
 * Apple Cards Carousel — adapted from Aceternity UI
 * @see https://ui.aceternity.com/components/apple-cards-carousel
 *
 * Self-contained horizontal carousel with click-to-expand modals,
 * framer-motion layout morphing, and CEYFI brand styling.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  BriefcaseBusiness,
  GraduationCap,
  Home,
  Landmark,
  PiggyBank,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useOutsideClick } from "@/hooks/use-outside-click";

export type CeyfiCarouselCard = {
  title: string;
  category: string;
  content: ReactNode;
  /** Short stat or hook shown on the collapsed card face */
  highlight?: string;
  icon?: LucideIcon;
  /** CSS linear-gradient for card background when no image is provided */
  gradient?: string;
  src?: string;
  href?: string;
};

interface CarouselProps {
  items: ReactNode[];
  initialScroll?: number;
  className?: string;
}

const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
}>({
  onCardClose: () => {},
});

function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < 768;
}

export function Carousel({ items, initialScroll = 0, className }: CarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollLeft = initialScroll;
    checkScrollability();
  }, [initialScroll, checkScrollability]);

  const scrollBy = (direction: "left" | "right") => {
    carouselRef.current?.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  const handleCardClose = (index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = isMobileViewport() ? 240 : 384;
    const gap = 16;
    el.scrollTo({
      left: (cardWidth + gap) * index,
      behavior: "smooth",
    });
  };

  return (
    <CarouselContext.Provider value={{ onCardClose: handleCardClose }}>
      <div className={cn("relative w-full", className)}>
        <div
          ref={carouselRef}
          onScroll={checkScrollability}
          className="flex w-full overflow-x-auto overscroll-x-contain scroll-smooth py-4 [scrollbar-width:none] md:py-6 [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex flex-row justify-start gap-4 pl-1 pr-[10%] md:pr-[28%]">
            {items.map((item, index) => (
              <motion.div
                key={`carousel-item-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.45,
                    delay: 0.12 * index,
                    ease: "easeOut",
                  },
                }}
                className="shrink-0 rounded-[22px]"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2 pr-1">
          <button
            type="button"
            aria-label="Scroll carousel left"
            className="flex size-10 items-center justify-center rounded-full border border-ceyfi-line/80 bg-ceyfi-paper text-ceyfi-ink transition hover:border-ceyfi-green/30 hover:bg-ceyfi-sprout disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/10"
            onClick={() => scrollBy("left")}
            disabled={!canScrollLeft}
          >
            <ArrowLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Scroll carousel right"
            className="flex size-10 items-center justify-center rounded-full border border-ceyfi-line/80 bg-ceyfi-paper text-ceyfi-ink transition hover:border-ceyfi-green/30 hover:bg-ceyfi-sprout disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/10"
            onClick={() => scrollBy("right")}
            disabled={!canScrollRight}
          >
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>
  );
}

interface CardProps {
  card: CeyfiCarouselCard;
  index: number;
  layout?: boolean;
  className?: string;
}

export function CarouselCard({ card, index, layout = true, className }: CardProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { onCardClose } = useContext(CarouselContext);

  const handleClose = useCallback(() => {
    setOpen(false);
    onCardClose(index);
  }, [index, onCardClose]);

  useOutsideClick(containerRef, handleClose);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleClose]);

  const cardBackground =
    card.gradient ??
    "linear-gradient(135deg, #052E16 0%, #059669 55%, #34D399 100%)";

  return (
    <>
      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ceyfi-deep/80 backdrop-blur-md dark:bg-black/75"
            />
            <motion.div
              ref={containerRef}
              layoutId={layout ? `card-${card.title}` : undefined}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="relative z-[60] mx-auto my-8 h-fit w-[min(100%-2rem,56rem)] rounded-[22px] border border-ceyfi-line/70 bg-ceyfi-paper p-5 shadow-brand-lg dark:border-white/10 dark:bg-ceyfi-deep/95 md:my-12 md:p-10"
            >
              <button
                type="button"
                aria-label="Close"
                className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-ceyfi-line/70 bg-ceyfi-sprout/80 text-ceyfi-ink transition hover:border-ceyfi-green/30 dark:border-white/10 dark:bg-white/10 dark:text-white"
                onClick={handleClose}
              >
                <X className="size-5" />
              </button>

              <motion.p
                layoutId={layout ? `category-${card.title}` : undefined}
                className="text-sm font-semibold uppercase tracking-[0.14em] text-ceyfi-green"
              >
                {card.category}
              </motion.p>
              <motion.h3
                layoutId={layout ? `title-${card.title}` : undefined}
                className="mt-3 max-w-2xl font-heading text-2xl font-semibold tracking-[-0.03em] text-ceyfi-ink dark:text-white md:text-4xl"
              >
                {card.title}
              </motion.h3>
              <div className="mt-6 text-sm leading-6 text-muted-foreground dark:text-white/65 md:text-base">
                {card.content}
              </div>
              {card.href ? (
                <div className="mt-8">
                  <Link
                    href={card.href}
                    className="inline-flex items-center rounded-full bg-ceyfi-green px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ceyfi-green/90"
                    onClick={handleClose}
                  >
                    Learn more
                  </Link>
                </div>
              ) : null}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={() => setOpen(true)}
        className={cn(
          "group relative flex h-72 w-60 flex-col items-start justify-end overflow-hidden rounded-[22px] border border-ceyfi-line/50 text-left shadow-brand transition hover:-translate-y-0.5 hover:shadow-brand-lg md:h-[28rem] md:w-96 dark:border-white/10",
          className
        )}
      >
        <CardBackground gradient={cardBackground} src={card.src} alt={card.title} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ceyfi-deep/90 via-ceyfi-deep/35 to-transparent" />
        {card.icon || card.highlight ? (
          <div className="relative z-10 flex flex-1 flex-col items-start justify-center gap-3 p-6 md:p-8">
            {card.icon ? (
              <span className="grid size-12 place-items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm md:size-14">
                <card.icon className="size-6 text-white md:size-7" strokeWidth={1.6} aria-hidden />
              </span>
            ) : null}
            {card.highlight ? (
              <p className="max-w-[14rem] text-sm font-medium leading-snug text-white/85 md:text-base">
                {card.highlight}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="relative z-10 p-6 md:p-8">
          <motion.p
            layoutId={layout ? `category-${card.title}` : undefined}
            className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-ceyfi-mint/90 md:text-sm"
          >
            {card.category}
          </motion.p>
          <motion.p
            layoutId={layout ? `title-${card.title}` : undefined}
            className="mt-2 max-w-[16rem] text-left font-heading text-xl font-semibold [text-wrap:balance] text-white transition group-hover:text-ceyfi-mint md:max-w-xs md:text-3xl"
          >
            {card.title}
          </motion.p>
        </div>
      </motion.button>
    </>
  );
}

function CardBackground({
  gradient,
  src,
  alt,
}: {
  gradient: string;
  src?: string;
  alt: string;
}) {
  const [loaded, setLoaded] = useState(!src);

  if (src) {
    return (
      <>
        <div
          className="absolute inset-0 z-0"
          style={{ background: gradient }}
          aria-hidden
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={cn(
            "absolute inset-0 z-[1] size-full object-cover transition duration-500",
            loaded ? "opacity-70 blur-0" : "opacity-40 blur-sm"
          )}
        />
      </>
    );
  }

  return (
    <div
      className="absolute inset-0 z-0"
      style={{ background: gradient }}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:18px_18px] opacity-50" />
      <div className="absolute -right-8 top-8 size-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-6 left-6 size-24 rounded-full bg-black/10 blur-xl" />
    </div>
  );
}

const LOAN_PRODUCT_CARDS: CeyfiCarouselCard[] = [
  {
    category: "Personal lending",
    title: "Flexible personal loans for everyday goals",
    icon: Landmark,
    highlight: "From 12.5% APR · LKR 250K–2M",
    gradient: "linear-gradient(145deg, #052E16 0%, #065F46 45%, #059669 100%)",
    href: "/assistant?prompt=Tell%20me%20about%20CEYFI%20personal%20loan%20options",
    content: (
      <>
        <p>
          Borrow from LKR 250,000 with transparent monthly instalments and no
          hidden fees. Ideal for medical bills, travel, or consolidating smaller
          debts.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Rates from 12.5% APR for qualified borrowers</li>
          <li>Repayment terms from 12 to 60 months</li>
          <li>Instant eligibility check through the CEYFI assistant</li>
        </ul>
      </>
    ),
  },
  {
    category: "Home & family",
    title: "Home improvement and renovation finance",
    icon: Home,
    highlight: "Up to LKR 5M · milestone drawdowns",
    gradient: "linear-gradient(145deg, #064E3B 0%, #047857 50%, #34D399 100%)",
    href: "/scenarios",
    content: (
      <>
        <p>
          Upgrade your family home with staged disbursements tied to renovation
          milestones — perfect for diaspora families supporting builds back home.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Up to LKR 5M for qualified homeowners</li>
          <li>Drawdowns aligned to contractor milestones</li>
          <li>Combine with wallet buckets for household planning</li>
        </ul>
      </>
    ),
  },
  {
    category: "Education",
    title: "Education finance for school and university",
    icon: GraduationCap,
    highlight: "Grace periods · school-bucket sync",
    gradient: "linear-gradient(145deg, #075C3E 0%, #059669 40%, #6EE7B7 100%)",
    href: "/wallet",
    content: (
      <>
        <p>
          Keep tuition and exam fees covered with predictable repayments that
          sync with your family wallet school bucket.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Preferential rates for education-linked accounts</li>
          <li>Grace periods during exam seasons</li>
          <li>Automatic reminders before each term instalment</li>
        </ul>
      </>
    ),
  },
  {
    category: "Diaspora",
    title: "Remittance-backed diaspora home loans",
    icon: Building2,
    highlight: "GBP & USD corridors · co-borrower options",
    gradient: "linear-gradient(145deg, #052E16 0%, #0A4424 55%, #10B981 100%)",
    href: "/wallet",
    content: (
      <>
        <p>
          Leverage regular remittance history to unlock larger home loans with
          lower documentation friction for overseas earners.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>GBP and USD remittance corridors supported</li>
          <li>Co-borrower options for family in Sri Lanka</li>
          <li>FX-aware repayment projections in CEYFI scenarios</li>
        </ul>
      </>
    ),
  },
  {
    category: "Business",
    title: "Micro business credit for growing ventures",
    icon: BriefcaseBusiness,
    highlight: "LKR 500K–3M · cash-flow based limits",
    gradient: "linear-gradient(145deg, #10261A 0%, #065F46 50%, #059669 100%)",
    href: "/assistant?prompt=Explain%20CEYFI%20micro%20business%20loan%20eligibility",
    content: (
      <>
        <p>
          Working capital for shops, services, and side hustles — with cash-flow
          based limits instead of heavy collateral requirements.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Limits from LKR 500K to LKR 3M</li>
          <li>Revolving line option for seasonal businesses</li>
          <li>P&L insights from CEYFI business tools</li>
        </ul>
      </>
    ),
  },
  {
    category: "Savings linked",
    title: "Savings-secured lower-rate lending",
    icon: PiggyBank,
    highlight: "From 8.9% APR · up to 90% of savings",
    gradient: "linear-gradient(145deg, #047857 0%, #059669 60%, #A7F3D0 100%)",
    href: "/profile",
    content: (
      <>
        <p>
          Use your CEYFI savings balance as collateral to access lower interest
          rates while keeping funds earmarked for emergencies.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>Up to 90% of savings balance as loan limit</li>
          <li>Rates from 8.9% APR</li>
          <li>Savings remain visible in your profile dashboard</li>
        </ul>
      </>
    ),
  },
];

export function LoanProductsCarousel({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "rounded-[22px] border border-ceyfi-line/70 bg-ceyfi-paper/80 p-4 shadow-brand sm:p-6 dark:border-white/10 dark:bg-white/[0.03]",
        className
      )}
      aria-labelledby="loan-products-carousel-heading"
    >
      <div className="mb-2 max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ceyfi-green">
          Lending products
        </p>
        <h2
          id="loan-products-carousel-heading"
          className="mt-1 font-heading text-xl font-semibold tracking-[-0.03em] text-ceyfi-ink dark:text-white sm:text-2xl"
        >
          Explore CEYFI financial products
        </h2>
        <p className="mt-2 text-sm text-muted-foreground dark:text-white/55">
          Swipe through loan and credit options. Tap a card to see rates, limits,
          and how each product fits your repayment plan.
        </p>
      </div>

      <Carousel
        items={LOAN_PRODUCT_CARDS.map((card, index) => (
          <CarouselCard key={card.title} card={card} index={index} />
        ))}
      />
    </section>
  );
}

export { LOAN_PRODUCT_CARDS };
