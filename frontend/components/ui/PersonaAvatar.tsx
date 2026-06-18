"use client";

import { cn } from "@/lib/utils";

export type PersonaKind = "diaspora" | "borrower" | "sme";

const PERSONA_STYLES: Record<
  PersonaKind,
  { gradient: string; ring: string; initials: string }
> = {
  diaspora: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    ring: "ring-emerald-500/25",
    initials: "NF",
  },
  borrower: {
    gradient: "from-blue-500 via-indigo-500 to-violet-600",
    ring: "ring-blue-500/25",
    initials: "SB",
  },
  sme: {
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    ring: "ring-amber-500/25",
    initials: "SS",
  },
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

const SIZE_CLASSES = {
  sm: "h-10 w-10 rounded-[11px] text-[10px]",
  md: "h-12 w-12 rounded-xl text-xs",
  lg: "h-24 w-24 rounded-full text-2xl sm:h-28 sm:w-28 sm:text-3xl",
} as const;

interface PersonaAvatarProps {
  name: string;
  persona?: PersonaKind;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function PersonaAvatar({
  name,
  persona,
  size = "md",
  className,
}: PersonaAvatarProps) {
  const style = persona ? PERSONA_STYLES[persona] : null;
  const initials = style?.initials ?? initialsFromName(name);

  return (
    <div
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center font-semibold text-white shadow-md ring-1",
        SIZE_CLASSES[size],
        style
          ? cn("bg-gradient-to-br", style.gradient, style.ring)
          : "bg-gradient-to-br from-muted-foreground to-foreground ring-border/40",
        className,
      )}
    >
      <span className="relative z-10 tracking-tight">{initials}</span>
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />
    </div>
  );
}
