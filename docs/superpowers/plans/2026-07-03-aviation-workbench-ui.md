# Aviation Workbench UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the existing TAF Visual Builder presentation as the approved aviation workbench while preserving every existing state transition, control, tour step, and generated TAF result.

**Architecture:** Keep `TafBuilder` as the state-owning page and retain all current component contracts. Add a small presentational section-header component, reorganize existing JSX into a responsive editor/output grid, and centralize visual tokens and component states in `index.css`; domain utilities, hooks, types, and API behavior are untouched.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, Tailwind CSS 4, Vitest, Testing Library, Intro.js.

---

## File map

- Create `src/components/layout/SectionHeader.tsx`: numbered workbench section heading with description and optional metadata/action slots.
- Create `src/test/setup.ts`: shared jest-dom assertions for Vitest.
- Create `src/TafBuilder.test.tsx`: structural, accessibility, workflow, and output-regression tests.
- Modify `src/TafBuilder.tsx`: presentation-only workbench shell and responsive editor/output composition.
- Modify `src/components/IssueTimeInput.tsx`: explicit ID support and refined presentational classes without changing parsing.
- Modify `src/components/ChangeEditor.tsx`: semantic class names and layout wrappers; preserve state/update logic.
- Modify `src/components/WindSection.tsx`: workbench block markup and accessible disable action label.
- Modify `src/components/VisibilitySection.tsx`: stable error region and semantic classes.
- Modify `src/components/CloudSection.tsx`: aligned cloud-layer markup and accessible action labels.
- Modify `src/components/Timeline.tsx`: semantic timeline classes and stronger focus/selection presentation.
- Modify `src/components/inputs/NumericControl.tsx`: shared control classes and labels; preserve bounds and stepping.
- Modify `src/index.css`: design tokens, light/dark themes, responsive grid, controls, focus, error, Intro.js, and reduced-motion rules.
- Modify `vite.config.ts`: Vitest jsdom configuration.
- Modify `package.json` and `package-lock.json`: test dependencies and `test` script only.

### Task 1: Establish UI regression test harness

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/TafBuilder.test.tsx`

- [ ] **Step 1: Install the test-only dependencies**

Run:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

Expected: dependencies are added to `devDependencies`; no production dependency changes.

- [ ] **Step 2: Add the test script and jsdom setup**

Add to `package.json` scripts:

```json
"test": "vitest run"
```

Extend `vite.config.ts` with:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Write structural tests for the approved layout**

Create `src/TafBuilder.test.tsx` with deterministic time mocks and tests that require:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TafBuilder from "./TafBuilder";

vi.mock("./utils/time", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./utils/time")>();
  return { ...actual, getCurrentIssueTimeUTC: () => "031100" };
});

describe("TafBuilder aviation workbench", () => {
  beforeEach(() => localStorage.clear());

  it("renders the unchanged workflow in sequence", () => {
    render(<TafBuilder />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent);
    expect(headings).toEqual([
      "Forecast context",
      "Base forecast",
      "Forecast timeline",
      "Generated TAF",
    ]);
  });

  it("associates context labels with their inputs", () => {
    render(<TafBuilder />);
    expect(screen.getByLabelText("ICAO station code")).toBeVisible();
    expect(screen.getByLabelText("Issue time (DDHHMM)")).toBeVisible();
  });

  it("keeps generated output connected to the existing state", () => {
    render(<TafBuilder />);
    fireEvent.change(screen.getByLabelText("ICAO station code"), { target: { value: "RCTP" } });
    expect(screen.getByTestId("generated-taf")).toHaveTextContent("TAF RCTP 031100Z");
  });
});
```

- [ ] **Step 4: Run the tests and verify the new layout assertions fail**

Run: `npm test`

Expected: FAIL because “Forecast context”, its explicit station label, and `generated-taf` are not implemented yet.

- [ ] **Step 5: Commit the failing regression tests**

```bash
git add package.json package-lock.json vite.config.ts src/test/setup.ts src/TafBuilder.test.tsx
git commit -m "test: define aviation workbench UI contract"
```

### Task 2: Build the responsive workbench shell

**Files:**
- Create: `src/components/layout/SectionHeader.tsx`
- Modify: `src/TafBuilder.tsx`
- Modify: `src/components/IssueTimeInput.tsx`
- Test: `src/TafBuilder.test.tsx`

- [ ] **Step 1: Add the reusable section heading**

Create `SectionHeader.tsx`:

```tsx
import type { ReactNode } from "react";

interface SectionHeaderProps {
  step: string;
  title: string;
  description: string;
  aside?: ReactNode;
}

export default function SectionHeader({ step, title, description, aside }: Readonly<SectionHeaderProps>) {
  return (
    <header className="workbench-section-header">
      <div className="workbench-section-title">
        <span className="workbench-step" aria-hidden="true">{step}</span>
        <div><h2>{title}</h2><p>{description}</p></div>
      </div>
      {aside && <div className="workbench-section-aside">{aside}</div>}
    </header>
  );
}
```

- [ ] **Step 2: Recompose `TafBuilder` without changing handlers**

Replace only the returned JSX with this hierarchy while reusing the existing input, `ChangeEditor`, `Timeline`, and output expressions verbatim:

```tsx
<div className={`taf-app ${isDark ? "taf-dark" : ""}`}>
  <header className="workbench-appbar">{/* existing tour/theme buttons */}</header>
  <main className="workbench-shell">
    <div className="workbench-grid">
      <div className="workbench-editor">
        <section id="tour-header" className="workbench-panel">
          <SectionHeader step="01" title="Forecast context" description="Identify the aerodrome and forecast issue time." />
          {/* existing station and IssueTimeInput controls with visible labels */}
        </section>
        <section id="tour-base-forecast" className="workbench-panel">
          <SectionHeader step="02" title="Base forecast" description="Set prevailing conditions for the full validity period." />
          {/* existing base ChangeEditor expression */}
        </section>
        <section id="tour-timeline" className="workbench-panel">
          <SectionHeader step="03" title="Forecast timeline" description="Select a start and end hour to create a change block." aside={/* existing legend */} />
          {/* existing Timeline expression */}
        </section>
        {/* existing selectedChangeIndex conditional; title becomes Selected change */}
      </div>
      <section id="tour-generated-taf" className="workbench-panel workbench-output">
        <SectionHeader step="05" title="Generated TAF" description="Updates live as conditions change." />
        <pre data-testid="generated-taf" className="taf-code">{generateTAF(taf)}</pre>
      </section>
    </div>
  </main>
</div>
```

Use visible `<label htmlFor="taf-station">` and `id="taf-station"`; add an optional `id` prop to `IssueTimeInput` and pass `id="taf-issue-time"`. Do not change either `onChange` implementation.

- [ ] **Step 3: Run focused tests**

Run: `npm test -- src/TafBuilder.test.tsx`

Expected: PASS for sequence, labels, and generated-output state linkage.

- [ ] **Step 4: Commit the shell**

```bash
git add src/TafBuilder.tsx src/TafBuilder.test.tsx src/components/IssueTimeInput.tsx src/components/layout/SectionHeader.tsx
git commit -m "feat: compose aviation workbench layout"
```

### Task 3: Unify editor controls and state presentation

**Files:**
- Modify: `src/components/ChangeEditor.tsx`
- Modify: `src/components/WindSection.tsx`
- Modify: `src/components/VisibilitySection.tsx`
- Modify: `src/components/CloudSection.tsx`
- Modify: `src/components/Timeline.tsx`
- Modify: `src/components/inputs/NumericControl.tsx`
- Modify: `src/components/buttons/ChangeDeleteButton.tsx`
- Modify: `src/components/buttons/CloudDeleteButton.tsx`
- Modify: `src/components/buttons/TypeButton.tsx`
- Test: `src/TafBuilder.test.tsx`

- [ ] **Step 1: Add interaction regression tests before changing presentation**

Add tests that use existing accessible names and assert:

```tsx
it("creates and selects a change through the existing timeline", () => {
  render(<TafBuilder />);
  fireEvent.click(screen.getByLabelText("Select 12Z"));
  fireEvent.click(screen.getByLabelText("Select 14Z"));
  expect(screen.getByRole("heading", { name: "Selected change" })).toBeVisible();
});

it("retains theme persistence", () => {
  render(<TafBuilder />);
  fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
  expect(localStorage.getItem("taf-dark-mode")).toBe("1");
});
```

- [ ] **Step 2: Run the focused tests before refactoring**

Run: `npm test -- src/TafBuilder.test.tsx`

Expected: PASS, establishing the behavior baseline.

- [ ] **Step 3: Apply semantic presentation classes**

Keep all props, state, callbacks, bounds, and conditional rendering intact. Replace utility-only presentation with these stable class contracts:

```tsx
<div className="condition-grid">
  <WindSection {...existingWindProps} />
  <VisibilitySection {...existingVisibilityProps} />
</div>
<CloudSection {...existingCloudProps} />
```

Use `condition-block`, `condition-block-header`, `field-row`, `unit-label`, `weather-options`, `weather-selection`, `cloud-layer-row`, `timeline-track`, `timeline-hour`, `numeric-control`, `icon-button`, `type-chip`, and `inline-error` consistently. Add `aria-label="Deactivate wind"`, `aria-label="Deactivate visibility and weather"`, and `aria-label="Deactivate clouds"` to existing `X` buttons; do not change their callbacks.

- [ ] **Step 4: Re-run interaction tests**

Run: `npm test -- src/TafBuilder.test.tsx`

Expected: PASS with identical change creation and theme persistence.

- [ ] **Step 5: Commit the control refactor**

```bash
git add src/components src/TafBuilder.test.tsx
git commit -m "refactor: unify forecast editor presentation"
```

### Task 4: Implement the approved visual system and responsive states

**Files:**
- Modify: `src/index.css`
- Test: `src/TafBuilder.test.tsx`

- [ ] **Step 1: Add the shared tokens and workbench layout**

Define tokens at `:root` and override theme roles under `.taf-dark`:

```css
:root {
  --taf-page: #eef3f7;
  --taf-shell: #102b42;
  --taf-surface: #ffffff;
  --taf-surface-subtle: #f7fafc;
  --taf-border: #d7e1e9;
  --taf-text: #172533;
  --taf-muted: #617887;
  --taf-accent: #237aa6;
  --taf-focus: #38a6dc;
  --taf-danger: #a23f3f;
  --taf-radius-panel: 14px;
  --taf-radius-control: 9px;
}

.workbench-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: start;
}

.workbench-output { position: sticky; top: 84px; }
```

Add consistent panel, header, field, numeric control, chip, disabled, error, code-surface, type-color, hover, active, and focus-visible rules. Preserve all existing Intro.js z-index and visibility safeguards.

- [ ] **Step 2: Add responsive and accessibility rules**

```css
@media (max-width: 1023px) {
  .workbench-grid { grid-template-columns: minmax(0, 1fr); }
  .workbench-output { position: static; }
  .condition-grid { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 640px) {
  .workbench-shell { padding: 12px; }
  .forecast-context-fields { grid-template-columns: minmax(0, 1fr); }
  .workbench-section-header { align-items: flex-start; }
}

:where(button, input, select):focus-visible {
  outline: 3px solid color-mix(in srgb, var(--taf-focus) 55%, transparent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; }
}
```

- [ ] **Step 3: Run automated verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit the visual system**

```bash
git add src/index.css
git commit -m "feat: style responsive aviation workbench"
```

### Task 5: Browser regression and final cleanup

**Files:**
- Modify only files required by defects found during verification.

- [ ] **Step 1: Start the application and load representative data**

Run: `npm run dev -- --host 127.0.0.1 --port 4173`

In the browser, enter `RCTP`, retain deterministic issue time, configure base weather, create a TEMPO range, edit its wind/visibility/cloud values, and compare the generated TAF against the same pre-redesign state.

- [ ] **Step 2: Verify responsive layouts**

Inspect 1440×1000, 1024×768, 768×1024, and 390×844. Expected: desktop has a sticky output rail; narrower widths use one column; only the timeline scrolls horizontally; no control or unit label is clipped.

- [ ] **Step 3: Verify accessibility and themes**

Keyboard-tab through all controls in workflow order, activate timeline hours with keyboard, check visible focus, trigger the existing visibility error, toggle light/dark mode, and run the existing guided tour to completion. Expected: all controls remain operable and all tour targets/tooltips stay visible.

- [ ] **Step 4: Run final verification after any fixes**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: all commands exit 0 and `git diff --check` prints nothing.

- [ ] **Step 5: Commit defects corrected during browser verification**

```bash
git add src package.json package-lock.json vite.config.ts
git commit -m "fix: complete aviation workbench verification"
```

If browser verification found no defects and `git status --short` is empty, skip this commit.
