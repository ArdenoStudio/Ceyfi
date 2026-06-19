"use client";

/**
 * Animated gradient border adapted from 21st.dev community component by easemize.
 * @see https://21st.dev/community/components/easemize/animated-gradient-border
 */

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnimationMode = "auto-rotate" | "rotate-on-hover" | "stop-rotate-on-hover";

export interface GradientBorderProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  children: ReactNode;
  className?: string;
  animationMode?: AnimationMode;
  animationSpeed?: number;
  gradientColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  backgroundColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  style?: CSSProperties;
}

const CEYFI_GRADIENT = {
  primary: "#052E16",
  secondary: "#059669",
  accent: "#34D399",
};

function getAnimationClass(mode: AnimationMode) {
  switch (mode) {
    case "auto-rotate":
      return "gradient-border-auto";
    case "rotate-on-hover":
      return "gradient-border-hover";
    case "stop-rotate-on-hover":
      return "gradient-border-stop-hover";
    default:
      return "";
  }
}

export function GradientBorder({
  children,
  className = "",
  animationMode = "rotate-on-hover",
  animationSpeed = 5,
  gradientColors = CEYFI_GRADIENT,
  backgroundColor = "var(--card)",
  borderWidth = 1.5,
  borderRadius = 16,
  style = {},
  ...props
}: GradientBorderProps) {
  const combinedStyle: CSSProperties = {
    "--gradient-primary": gradientColors.primary,
    "--gradient-secondary": gradientColors.secondary,
    "--gradient-accent": gradientColors.accent,
    "--bg-color": backgroundColor,
    "--border-width": `${borderWidth}px`,
    "--border-radius": `${borderRadius}px`,
    "--animation-duration": `${animationSpeed}s`,
    border: `${borderWidth}px solid transparent`,
    borderRadius: `${borderRadius}px`,
    backgroundImage: `
      linear-gradient(${backgroundColor}, ${backgroundColor}),
      conic-gradient(
        from var(--gradient-angle, 0deg),
        ${gradientColors.primary} 0%,
        ${gradientColors.secondary} 37%,
        ${gradientColors.accent} 30%,
        ${gradientColors.secondary} 33%,
        ${gradientColors.primary} 40%,
        ${gradientColors.primary} 50%,
        ${gradientColors.secondary} 77%,
        ${gradientColors.accent} 80%,
        ${gradientColors.secondary} 83%,
        ${gradientColors.primary} 90%
      )
    `,
    backgroundClip: "padding-box, border-box",
    backgroundOrigin: "padding-box, border-box",
    ...style,
  } as CSSProperties;

  return (
    <div
      className={cn("gradient-border-component", getAnimationClass(animationMode), className)}
      style={combinedStyle}
      {...props}
    >
      {children}
    </div>
  );
}
