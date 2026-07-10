/** Date helpers for greetings and due-date copy. */

export function timeOfDayGreeting(now = new Date()): "Good morning" | "Good afternoon" | "Good evening" {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-LK", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/** Calendar-day difference (positive = future, negative = overdue). */
export function daysUntil(iso: string, now = new Date()): number {
  const target = new Date(iso);
  const start = new Date(now);
  target.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function dueLabel(iso: string, now = new Date()): string {
  const days = daysUntil(iso, now);
  if (days > 1) return `due in ${days} days`;
  if (days === 1) return "due tomorrow";
  if (days === 0) return "due today";
  if (days === -1) return "1 day overdue";
  return `${Math.abs(days)} days overdue`;
}

export function currentMonthLabel(now = new Date()): string {
  return new Intl.DateTimeFormat("en-LK", { month: "long" }).format(now);
}
