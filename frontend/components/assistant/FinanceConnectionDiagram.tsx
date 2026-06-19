"use client";

import { forwardRef, useRef } from "react";
import Image from "next/image";
import { Brain, CreditCard, Wallet } from "lucide-react";

import { AnimatedBeam } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils";

const CEYFI_GREEN = "#059669";
const CEYFI_MINT = "#34D399";
const CEYFI_DEEP = "#052E16";

const BeamNode = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode; label?: string }
>(({ className, children, label }, ref) => (
  <div className="flex flex-col items-center gap-1.5">
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-11 items-center justify-center rounded-2xl border border-ceyfi-green/20 bg-ceyfi-paper shadow-[0_0_24px_-10px_rgba(5,150,105,0.45)] ring-1 ring-ceyfi-green/10 sm:size-12",
        "dark:border-white/15 dark:bg-white/10 dark:shadow-[0_0_24px_-10px_rgba(52,211,153,0.35)] dark:ring-white/10",
        className
      )}
    >
      {children}
    </div>
    {label ? (
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-ceyfi-green/80 dark:text-ceyfi-mint/80">
        {label}
      </span>
    ) : null}
  </div>
));

BeamNode.displayName = "BeamNode";

export function FinanceConnectionDiagram({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const brainRef = useRef<HTMLDivElement>(null);
  const walletRef = useRef<HTMLDivElement>(null);
  const loansRef = useRef<HTMLDivElement>(null);

  const beamProps = {
    containerRef,
    pathColor: CEYFI_DEEP,
    pathWidth: 2,
    pathOpacity: 0.18,
    gradientStartColor: CEYFI_MINT,
    gradientStopColor: CEYFI_GREEN,
    duration: 4,
  };

  return (
    <div
      className={cn("relative mx-auto w-full max-w-md px-2", className)}
      aria-hidden
    >
      <div
        ref={containerRef}
        className="relative flex h-28 items-center justify-center overflow-hidden sm:h-32"
      >
        <div className="flex w-full max-w-sm items-center justify-between gap-4 sm:gap-6">
          <BeamNode ref={logoRef} label="CEYFI">
            <Image
              src="/ceyfi-logo.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain dark:brightness-0 dark:invert"
            />
          </BeamNode>

          <BeamNode
            ref={brainRef}
            label="AI"
            className="size-12 sm:size-14"
          >
            <Brain className="h-6 w-6 text-ceyfi-green dark:text-ceyfi-mint sm:h-7 sm:w-7" />
          </BeamNode>

          <div className="flex flex-col justify-center gap-3 sm:gap-4">
            <BeamNode ref={walletRef} label="Wallet">
              <Wallet className="h-5 w-5 text-ceyfi-green dark:text-ceyfi-mint" />
            </BeamNode>
            <BeamNode ref={loansRef} label="Loans">
              <CreditCard className="h-5 w-5 text-ceyfi-green dark:text-ceyfi-mint" />
            </BeamNode>
          </div>
        </div>

        <AnimatedBeam
          {...beamProps}
          fromRef={logoRef}
          toRef={brainRef}
          curvature={-12}
        />
        <AnimatedBeam
          {...beamProps}
          fromRef={brainRef}
          toRef={walletRef}
          curvature={20}
          delay={0.4}
        />
        <AnimatedBeam
          {...beamProps}
          fromRef={brainRef}
          toRef={loansRef}
          curvature={-20}
          delay={0.8}
        />
      </div>

      <p className="mt-1 text-center text-xs text-muted-foreground dark:text-white/45">
        CEYFI connects your wallet, loans, and spending in one bilingual assistant
      </p>
    </div>
  );
}
