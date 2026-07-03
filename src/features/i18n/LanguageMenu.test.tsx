import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { LANGUAGE_STORAGE_KEY, LanguageProvider } from "./LanguageProvider";
import { LanguageMenu } from "./LanguageMenu";

beforeEach(() => localStorage.clear());

test("selects Traditional Chinese and closes the menu", () => {
  render(<LanguageProvider><LanguageMenu /></LanguageProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Choose language" }));
  expect(screen.getByRole("menu", { name: "Languages" })).toBeVisible();
  fireEvent.click(screen.getByRole("menuitemradio", { name: "繁體中文" }));
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-TW");
});

test("Escape closes the menu and restores trigger focus", () => {
  render(<LanguageProvider><LanguageMenu /></LanguageProvider>);
  const trigger = screen.getByRole("button", { name: "Choose language" });
  fireEvent.click(trigger);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});
