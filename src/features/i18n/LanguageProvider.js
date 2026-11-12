import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { LanguageContext } from "./LanguageContext";
import { translations } from "./translations";
export const LANGUAGE_STORAGE_KEY = "taf-language";
function readStoredLanguage() {
    try {
        const stored = globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
        return stored === "zh-TW" || stored === "en" ? stored : "en";
    }
    catch {
        return "en";
    }
}
export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(readStoredLanguage);
    useEffect(() => {
        try {
            globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, language);
        }
        catch {
            // Persistence is optional; in-memory language switching still works.
        }
        document.documentElement.lang = language === "zh-TW" ? "zh-Hant-TW" : "en";
    }, [language]);
    const value = useMemo(() => ({ language, setLanguage, text: translations[language] }), [language]);
    return _jsx(LanguageContext.Provider, { value: value, children: children });
}
