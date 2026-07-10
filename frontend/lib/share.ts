/** WhatsApp / Web Share helpers for receipts and recovery messages. */

export function buildWhatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function shareText(opts: {
  title: string;
  text: string;
  fallbackCopy?: boolean;
}): Promise<"shared" | "whatsapp" | "copied" | "failed"> {
  const { title, text, fallbackCopy = true } = opts;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "failed";
      }
    }
  }

  if (typeof window !== "undefined") {
    window.open(buildWhatsAppUrl(text), "_blank", "noopener,noreferrer");
    return "whatsapp";
  }

  if (fallbackCopy && typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      return "failed";
    }
  }

  return "failed";
}

export function formatReceiptMessage(opts: {
  title: string;
  amountLkr: number;
  reference: string;
  detail?: string;
  when?: string;
}): string {
  const when = opts.when ?? new Date().toLocaleString("en-LK");
  const amount = new Intl.NumberFormat("en-LK").format(opts.amountLkr);
  return [
    `CEYFI — ${opts.title}`,
    `Amount: LKR ${amount}`,
    `Reference: ${opts.reference}`,
    opts.detail ? `Detail: ${opts.detail}` : null,
    `Time: ${when}`,
    "",
    "Clarity for every rupee · ceyfi.app",
  ]
    .filter(Boolean)
    .join("\n");
}
