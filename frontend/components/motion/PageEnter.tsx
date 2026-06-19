"use client";

import { motion, useReducedMotion } from "motion/react";

interface PageEnterProps {
  children: React.ReactNode;
  className?: string;
}

export function PageEnter({ children, className }: PageEnterProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
