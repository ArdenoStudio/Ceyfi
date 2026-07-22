import type { Language } from "@/types";
import { en, type MessageTree } from "./messages/en";
import { si } from "./messages/si";
import { ta } from "./messages/ta";

export type { MessageTree };

const CATALOG: Record<Language, MessageTree> = { en, si, ta };

export const LOCALE_STORAGE_KEY = "ceyfi.locale";

export function isLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "si" || value === "ta";
}

export function getMessages(locale: Language): MessageTree {
  return CATALOG[locale] ?? en;
}

/** Replace `{name}` placeholders in a message string. */
export function formatMessage(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`
  );
}

export function scriptClass(locale: Language): string | undefined {
  if (locale === "si") return "sinhala";
  if (locale === "ta") return "tamil";
  return undefined;
}
