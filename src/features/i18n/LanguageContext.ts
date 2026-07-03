import { createContext, useContext } from "react";
import type { Language, Translation } from "./translations";

export interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  text: Translation;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
