"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";

interface PageEnterProps {
  children: React.ReactNode;
  className?: string;
}

export function PageEnter({ children, className }: PageEnterProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
