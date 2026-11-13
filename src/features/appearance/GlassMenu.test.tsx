import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "../i18n/LanguageProvider";
import { GlassMenu } from "./GlassMenu";
import { DEFAULT_GLASS_CLARITY, GLASS_STORAGE_KEY, getGlassStyle } from "./glass";

function renderMenu() {
  return render(<LanguageProvider><GlassMenu /></LanguageProvider>);
}

const rootVar = (name: string) => document.documentElement.style.getPropertyValue(name);

describe("getGlassStyle", () => {
  it("keeps less tint and blurs less as the glass gets clearer", () => {
    expect(getGlassStyle(0)).toEqual({ fill: 100, blur: 26 });
    expect(getGlassStyle(100)).toEqual({ fill: 25, blur: 8 });
    expect(getGlassStyle(DEFAULT_GLASS_CLARITY)).toEqual({ fill: 70, blur: 18.8 });
    expect(getGlassStyle(250)).toEqual(getGlassStyle(100));
  });
});

describe("GlassMenu", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("style");
  });

  it("applies the default transparency before the menu is opened", () => {
    renderMenu();
    expect(rootVar("--lg-fill")).toBe("70%");
    expect(rootVar("--glass-blur")).toBe("blur(18.8px) saturate(180%)");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("restores the stored transparency", () => {
    localStorage.setItem(GLASS_STORAGE_KEY, "100");
    renderMenu();
    expect(rootVar("--lg-fill")).toBe("25%");
  });

  it("updates the glass live from the slider, remembers it and resets", () => {
    renderMenu();
    fireEvent.click(screen.getByRole("button", { name: "Adjust glass transparency" }));
    const slider = screen.getByRole("slider", { name: "Glass transparency" });
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();

    fireEvent.change(slider, { target: { value: "80" } });
    expect(slider).toHaveAttribute("aria-valuetext", "80% transparent");
    expect(rootVar("--lg-fill")).toBe(`${getGlassStyle(80).fill}%`);
    expect(localStorage.getItem(GLASS_STORAGE_KEY)).toBe("80");

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(rootVar("--lg-fill")).toBe("70%");
  });

  it("closes with Escape and returns focus to the trigger", () => {
    renderMenu();
    const trigger = screen.getByRole("button", { name: "Adjust glass transparency" });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
