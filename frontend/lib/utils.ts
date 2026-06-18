import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const lkrFormatter = new Intl.NumberFormat("en-LK", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatLKR(amount: number): string {
  return `LKR ${lkrFormatter.format(amount)}`;
}

export const formatters = {
  currency: ({
    number,
    maxFractionDigits = 2,
  }: {
    number: number;
    maxFractionDigits?: number;
  }) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      currencyDisplay: "code",
      maximumFractionDigits: maxFractionDigits,
    }).format(number),
  compact: (number: number) =>
    new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(number),
  percent: (number: number) => `${(number * 100).toFixed(1)}%`,
};

export function cx(
  ...args: Array<string | undefined | null | false>
): string {
  return args.filter(Boolean).join(" ");
}
