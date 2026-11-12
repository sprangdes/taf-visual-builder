import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { useLanguage } from "./LanguageContext";
import { LANGUAGE_STORAGE_KEY, LanguageProvider } from "./LanguageProvider";
function Probe() {
    const { language, setLanguage, text } = useLanguage();
    return (_jsxs("button", { type: "button", onClick: () => setLanguage("zh-TW"), children: [language, ":", text.app.pageTitle] }));
}
describe("LanguageProvider", () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.lang = "";
    });
    test("defaults to English and persists a switch to Traditional Chinese", () => {
        render(_jsx(LanguageProvider, { children: _jsx(Probe, {}) }));
        expect(screen.getByRole("button")).toHaveTextContent("en:Create Terminal Aerodrome Forecast");
        fireEvent.click(screen.getByRole("button"));
        expect(screen.getByRole("button")).toHaveTextContent("zh-TW:建立機場終端預報");
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-TW");
        expect(document.documentElement.lang).toBe("zh-Hant-TW");
    });
    test("restores a supported language from storage", () => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, "zh-TW");
        render(_jsx(LanguageProvider, { children: _jsx(Probe, {}) }));
        expect(screen.getByRole("button")).toHaveTextContent(/^zh-TW:/);
    });
    test("falls back to English for an unsupported stored language", () => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, "unsupported");
        render(_jsx(LanguageProvider, { children: _jsx(Probe, {}) }));
        expect(screen.getByRole("button")).toHaveTextContent(/^en:/);
        expect(document.documentElement.lang).toBe("en");
    });
});
