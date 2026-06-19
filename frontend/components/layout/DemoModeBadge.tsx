"use client";

import { Shield } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export function DemoModeBadge() {
  const reduceMotion = useReducedMotion();

  const content = (
    <div
      className="flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/95 px-3 py-1.5 text-[10px] font-semibold text-amber-800 shadow-sm backdrop-blur-sm dark:border-amber-500/30 dark:bg-amber-950/85 dark:text-amber-200"
      role="status"
      aria-label="Demo environment"
    >
      <Shield className="h-3 w-3 animate-pulse-soft" aria-hidden />
      Demo environment
    </div>
  );

  if (reduceMotion) {
    return (
      <div className="pointer-events-none fixed bottom-[5.75rem] right-4 z-40 md:bottom-4">
        {content}
      </div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none fixed bottom-[5.75rem] right-4 z-40 md:bottom-4"
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.6, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {content}
    </motion.div>
  );
}
