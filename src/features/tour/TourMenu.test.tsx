import { fireEvent, render as rtlRender, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TourExitDialog, TourMenu } from "./TourMenu";
import { LanguageProvider } from "../i18n/LanguageProvider";

function render(node: React.ReactNode) {
  return rtlRender(<LanguageProvider>{node}</LanguageProvider>);
}

describe("TourMenu", () => {
  it("renders the tour catalog in Traditional Chinese", () => {
    localStorage.setItem("taf-language", "zh-TW");
    render(<TourMenu onStart={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "開啟導覽" }));
    expect(screen.getByRole("menu", { name: "導覽" })).toHaveTextContent("快速開始");
    expect(screen.getByRole("menu", { name: "導覽" })).toHaveTextContent("時間軸說明");
    localStorage.clear();
  });
  it("opens on demand and starts the selected tour", () => {
    const onStart = vi.fn();
    render(<TourMenu onStart={onStart} />);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open guided tours" }));
    expect(screen.getByRole("menu")).toBeVisible();
    fireEvent.click(screen.getByRole("menuitem", { name: /Timeline Help/ }));

    expect(onStart).toHaveBeenCalledWith("topic-timeline");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes with Escape and returns focus to the trigger", () => {
    render(<TourMenu onStart={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "Open guided tours" });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe("TourExitDialog", () => {
  it("lets the user keep or restore the demo", () => {
    const onResolve = vi.fn();
    const { rerender } = render(<TourExitDialog onResolve={onResolve} />);
    fireEvent.click(screen.getByRole("button", { name: "Restore my forecast" }));
    expect(onResolve).toHaveBeenLastCalledWith("restore");

    rerender(<LanguageProvider><TourExitDialog onResolve={onResolve} /></LanguageProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Keep demo result" }));
    expect(onResolve).toHaveBeenLastCalledWith("keep");
  });
});
