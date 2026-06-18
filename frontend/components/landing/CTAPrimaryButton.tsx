"use client";

import React from "react";
import { motion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import { APP_URL } from "@/lib/config";

const animationTransition = {
  repeat: Infinity,
  repeatType: "loop",
  repeatDelay: 1,
  type: "spring",
  stiffness: 20,
  damping: 15,
  mass: 2,
  scale: {
    type: "spring",
    stiffness: 200,
    damping: 5,
    mass: 0.5,
  },
} satisfies Transition;

const animationProps = {
  initial: { "--x": "100%", scale: 0.8 } as never,
  animate: { "--x": "-100%", scale: 1 } as never,
  whileTap: { scale: 0.95 },
  transition: animationTransition,
};

interface CTAPrimaryButtonProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CTAPrimaryButton({
  href = `${APP_URL}/wallet`,
  children,
  className,
}: CTAPrimaryButtonProps) {
  return (
    <a href={href} className="inline-block">
      <motion.button
        {...animationProps}
        className={cn(
          "relative rounded-lg px-8 py-3.5 font-medium backdrop-blur-xl",
          "transition-shadow duration-300 ease-in-out",
          "hover:shadow-[0_8px_28px_rgba(227,24,33,0.38)]",
          "bg-seylan-red",
          className
        )}
      >
        {/* Shimmer text */}
        <span
          className="relative flex items-center gap-2.5 text-base font-semibold text-white/90"
          style={{
            maskImage:
              "linear-gradient(-75deg, rgb(255,255,255) calc(var(--x) + 20%), rgba(255,255,255,0.4) calc(var(--x) + 30%), rgb(255,255,255) calc(var(--x) + 100%))",
          }}
        >
          {children ?? "Open SeylanHub"}
          <span aria-hidden="true">→</span>
        </span>

        {/* Shiny border sweep */}
        <span
          style={{
            mask: "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box, linear-gradient(rgb(0,0,0), rgb(0,0,0))",
            maskComposite: "exclude",
          }}
          className="absolute inset-0 z-10 block rounded-[inherit] bg-[linear-gradient(-75deg,rgba(255,255,255,0.08)_calc(var(--x)+20%),rgba(255,255,255,0.4)_calc(var(--x)+25%),rgba(255,255,255,0.08)_calc(var(--x)+100%))] p-px"
        />
      </motion.button>
    </a>
  );
}
