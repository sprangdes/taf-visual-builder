import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LanguageContext } from "./LanguageContext";
import { translations, type Language } from "./translations";

export const LANGUAGE_STORAGE_KEY = "taf-language";

function readStoredLanguage(): Language {
  try {
    const stored = globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
    return stored === "zh-TW" || stored === "en" ? stored : "en";
  } catch {
    return "en";
  }
}

export function LanguageProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [language, setLanguage] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Persistence is optional; in-memory language switching still works.
    }
    document.documentElement.lang = language === "zh-TW" ? "zh-Hant-TW" : "en";
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, text: translations[language] }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
