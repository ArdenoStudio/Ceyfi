"use client";

import { motion } from "motion/react";
import { CreditCard, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentMode = "card" | "demo";

interface PaymentModeToggleProps {
  value: PaymentMode;
  onChange: (mode: PaymentMode) => void;
  cardLabel?: string;
  demoLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

export function PaymentModeToggle({
  value,
  onChange,
  cardLabel = "Card (MPGS)",
  demoLabel = "Demo Mode",
  size = "md",
  className,
}: PaymentModeToggleProps) {
  const py = size === "sm" ? "py-1.5" : "py-2";
  const text = size === "sm" ? "text-sm" : "text-xs";

  return (
    <div className={cn("relative flex rounded-xl bg-muted p-1", className)}>
      <motion.div
        className="absolute inset-y-1 rounded-lg bg-background shadow-sm ring-1 ring-border/60"
        layout
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        style={{
          width: "calc(50% - 4px)",
          left: value === "card" ? 4 : "calc(50%)",
        }}
      />
      {(["card", "demo"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            "relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-lg font-medium transition-colors",
            py,
            text,
            value === mode ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {mode === "card" ? (
            <CreditCard className="h-3.5 w-3.5" />
          ) : (
            <Zap className="h-3.5 w-3.5" />
          )}
          {mode === "card" ? cardLabel : demoLabel}
        </button>
      ))}
    </div>
  );
}
