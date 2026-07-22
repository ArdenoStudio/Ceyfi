"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Language } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  formatMessage,
  getMessages,
  isLanguage,
  LOCALE_STORAGE_KEY,
  scriptClass,
  type MessageTree,
} from "@/lib/i18n";

interface LocaleContextValue {
  locale: Language;
  setLocale: (locale: Language) => void;
  t: MessageTree;
  tf: (template: string, vars: Record<string, string | number>) => string;
  scriptClassName: string | undefined;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Language | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLanguage(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [storedChoice] = useState<Language | null>(() => readStoredLocale());
  const [locale, setLocaleState] = useState<Language>(() => storedChoice ?? "en");
  const [userChose, setUserChose] = useState(() => storedChoice != null);

  const userPref = user?.language_preference;
  const localeFromPersona =
    !userChose && isLanguage(userPref) ? userPref : null;
  const effectiveLocale = localeFromPersona ?? locale;

  useEffect(() => {
    document.documentElement.lang =
      effectiveLocale === "si"
        ? "si-LK"
        : effectiveLocale === "ta"
          ? "ta-LK"
          : "en-LK";
    document.documentElement.dataset.locale = effectiveLocale;
  }, [effectiveLocale]);

  const setLocale = useCallback((next: Language) => {
    setUserChose(true);
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const t = getMessages(effectiveLocale);
    return {
      locale: effectiveLocale,
      setLocale,
      t,
      tf: formatMessage,
      scriptClassName: scriptClass(effectiveLocale),
    };
  }, [effectiveLocale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
