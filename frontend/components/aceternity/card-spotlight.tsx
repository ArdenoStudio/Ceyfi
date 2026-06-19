"use client";

import {
  useMotionValue,
  motion,
  useMotionTemplate,
} from "motion/react";
import React, { type MouseEvent as ReactMouseEvent, useState } from "react";
import { cn } from "@/lib/utils";

const CEYFI_SPOTLIGHT = "#052E16";

export const CardSpotlight = ({
  children,
  radius = 350,
  color = CEYFI_SPOTLIGHT,
  className,
  ...props
}: {
  radius?: number;
  color?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: ReactMouseEvent<HTMLDivElement>) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className={cn(
        "group/spotlight relative rounded-xl border border-ceyfi-line/70 bg-ceyfi-paper p-5 dark:border-white/10 dark:bg-ceyfi-deep/30",
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px z-0 rounded-xl opacity-0 transition duration-300 group-hover/spotlight:opacity-100"
        style={{
          backgroundColor: color,
          maskImage: useMotionTemplate`
            radial-gradient(
              ${radius}px circle at ${mouseX}px ${mouseY}px,
              white,
              transparent 80%
            )
          `,
        }}
      >
        {isHovering ? (
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(52, 211, 153, 0.55) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          />
        ) : null}
      </motion.div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};
