/** CEYFI brand palette for Tremor-style chart components */
export const CEYFI_COLORS = {
  green: "#059669",
  mint: "#34D399",
  deep: "#052E16",
  muted: "#8C9A91",
  warn: "#D97706",
  error: "#E11D48",
} as const;

export const CEYFI_PALETTE = [
  CEYFI_COLORS.green,
  CEYFI_COLORS.mint,
  CEYFI_COLORS.deep,
  CEYFI_COLORS.warn,
  CEYFI_COLORS.muted,
] as const;
