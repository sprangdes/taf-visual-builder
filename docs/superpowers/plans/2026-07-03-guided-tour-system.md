# Guided Tour System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Intro.js walkthrough with a user-initiated React Joyride system that offers quick-start, new-feature, and topic-help tours in the approved responsive Flight Strip UI.

**Architecture:** A focused `src/features/tour/` module owns definitions, lifecycle, menu, tooltip, and demo-state restoration. `TafBuilder` exposes stable targets and a narrow adapter for editor state; editing components remain unaware of Joyride. Desktop supports task-gated steps, while mobile turns those steps into passive instructions.

**Tech Stack:** React 19, TypeScript 5.9, React Joyride, Vitest, Testing Library, CSS

---

## File Structure

- Create `src/features/tour/types.ts`: tour IDs, step metadata, task events, and editor adapter contracts.
- Create `src/features/tour/tourDefinitions.tsx`: quick-start, new-feature, and topic-help definitions plus validation.
- Create `src/features/tour/tourDemo.ts`: deterministic demo TAF factory and snapshot helpers.
- Create `src/features/tour/FlightStripTooltip.tsx`: accessible custom desktop/mobile Joyride tooltip.
- Create `src/features/tour/TourMenu.tsx`: user-initiated menu and exit-data decision dialog.
- Create `src/features/tour/TourProvider.tsx`: Joyride orchestration, task gating, missing-target behavior, and cleanup.
- Create `src/features/tour/*.test.tsx`: focused unit/component tests for the files above.
- Modify `src/TafBuilder.tsx`: remove Intro.js orchestration, add the provider adapter, menu, targets, and timeline task event.
- Modify `src/TafBuilder.test.tsx`: integrated menu, demo restoration, and walkthrough behavior.
- Modify `src/index.css`: Flight Strip, menu, dialog, spotlight, responsive, dark, focus, and reduced-motion styles; remove Intro.js rules.
- Modify `src/main.tsx`: remove Intro.js stylesheet import.
- Modify `package.json` and `package-lock.json`: replace `intro.js` with `react-joyride`.

### Task 1: Replace the tour dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/main.tsx`

- [ ] **Step 1: Install React Joyride and remove Intro.js**

Run: `npm uninstall intro.js && npm install react-joyride`

Expected: `package.json` lists `react-joyride`, no longer lists `intro.js`, and the lockfile resolves the new dependency.

- [ ] **Step 2: Remove the obsolete stylesheet import**

Delete this line from `src/main.tsx`:

```ts
import 'intro.js/introjs.css';
```

- [ ] **Step 3: Verify dependency and TypeScript resolution**

Run: `npm ls react-joyride intro.js`

Expected: `react-joyride` is present and `intro.js` is absent.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/main.tsx
git commit -m "build: replace intro.js with react joyride"
```

### Task 2: Define the tour contracts and definitions

**Files:**
- Create: `src/features/tour/types.ts`
- Create: `src/features/tour/tourDefinitions.tsx`
- Create: `src/features/tour/tourDefinitions.test.tsx`

- [ ] **Step 1: Write failing definition-validation tests**

Create tests that assert all IDs are unique, all targets begin with `[data-tour-id=`, task steps name an event, and mobile task steps become passive:

```tsx
import { describe, expect, it } from "vitest";
import { getTourSteps, tourCatalog, validateTourCatalog } from "./tourDefinitions";

describe("tour definitions", () => {
  it("contains valid unique steps", () => {
    expect(validateTourCatalog(tourCatalog)).toEqual([]);
  });

  it("turns desktop tasks into passive mobile steps", () => {
    const desktop = getTourSteps("quick-start", false);
    const mobile = getTourSteps("quick-start", true);
    expect(desktop.find((step) => step.id === "create-change")?.taskEvent).toBe("timeline-range-created");
    expect(mobile.find((step) => step.id === "create-change")?.taskEvent).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/features/tour/tourDefinitions.test.tsx`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Add contracts and declarative definitions**

Define these public types in `types.ts`:

```ts
import type { ReactNode } from "react";
import type { TAF } from "../../types/taf";

export type TourId = "quick-start" | "new-features" | "topic-timeline" | "topic-output";
export type TourTaskEvent = "timeline-range-created";
export interface GuidedTourStep {
  id: string;
  target: `[data-tour-id="${string}"]`;
  title: string;
  content: ReactNode;
  mobileContent?: ReactNode;
  taskEvent?: TourTaskEvent;
}
export interface TourDefinition { id: TourId; label: string; description: string; steps: GuidedTourStep[]; }
export interface TourEditorSnapshot { taf: TAF; selectedChangeIndex: number | null; }
export interface TourEditorAdapter {
  capture(): TourEditorSnapshot;
  loadDemo(): void;
  restore(snapshot: TourEditorSnapshot): void;
}
```

Implement `tourCatalog`, with quick-start steps targeting `context`, `base`, `wind`, `visibility`, `clouds`, `timeline`, `selected-change`, `change-type`, and `output`. Implement `getTourSteps(id, isMobile)` as an immutable mapping that substitutes `mobileContent` and removes `taskEvent` on mobile. Implement `validateTourCatalog` to return concrete error strings for duplicate IDs, malformed targets, and task steps without a known event.

- [ ] **Step 4: Run definition tests**

Run: `npm test -- src/features/tour/tourDefinitions.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tour/types.ts src/features/tour/tourDefinitions.tsx src/features/tour/tourDefinitions.test.tsx
git commit -m "feat: define guided tour catalog"
```

### Task 3: Add deterministic demo data and restoration

**Files:**
- Create: `src/features/tour/tourDemo.ts`
- Create: `src/features/tour/tourDemo.test.ts`

- [ ] **Step 1: Write failing snapshot tests**

```ts
import { describe, expect, it } from "vitest";
import { cloneTourSnapshot, createTourDemoTaf } from "./tourDemo";

describe("tour demo state", () => {
  it("creates an RCTP demo with one selected change", () => {
    const demo = createTourDemoTaf("031100");
    expect(demo.station).toBe("RCTP");
    expect(demo.changes).toHaveLength(1);
  });

  it("deep-clones snapshots", () => {
    const source = { taf: createTourDemoTaf("031100"), selectedChangeIndex: 0 };
    const clone = cloneTourSnapshot(source);
    clone.taf.station = "RCSS";
    expect(source.taf.station).toBe("RCTP");
  });
});
```

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/features/tour/tourDemo.test.ts`

Expected: FAIL because `tourDemo.ts` does not exist.

- [ ] **Step 3: Implement the demo factory and clone**

Move the existing RCTP demo values out of `TafBuilder.tsx` into `createTourDemoTaf(issueTime)`. Implement `cloneTourSnapshot` with `structuredClone`, preserving the full `TAF` and selected index.

- [ ] **Step 4: Verify pass and commit**

Run: `npm test -- src/features/tour/tourDemo.test.ts`

Expected: PASS.

```bash
git add src/features/tour/tourDemo.ts src/features/tour/tourDemo.test.ts
git commit -m "feat: add guided tour demo snapshots"
```

### Task 4: Build the Flight Strip tooltip

**Files:**
- Create: `src/features/tour/FlightStripTooltip.tsx`
- Create: `src/features/tour/FlightStripTooltip.test.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write failing tooltip tests**

Mock `TooltipRenderProps` with one passive step and one locked task step. Assert the strip exposes `role="alertdialog"`, renders `03 / 09`, labels Close/Back/Next, and disables Next only for a locked desktop task.

```tsx
expect(screen.getByRole("alertdialog")).toHaveClass("tour-flight-strip");
expect(screen.getByText("03 / 09")).toBeVisible();
expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
expect(screen.getByText("Complete the highlighted action to continue.")).toBeVisible();
```

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/features/tour/FlightStripTooltip.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the custom tooltip**

Use `TooltipRenderProps` from `react-joyride`, spread `tooltipProps`, `closeProps`, `backProps`, `primaryProps`, and `skipProps`, and read `step.data` for `{ taskLocked, isMobile }`. Preserve Joyride-provided event handlers and accessible names. Add a segmented progress bar with `aria-hidden="true"`.

- [ ] **Step 4: Add approved responsive styling**

Add `.tour-flight-strip` as a fixed, full-width bottom surface with a maximum content width, technical progress label, blue progress segments, and workbench-aligned borders. Add `.taf-dark .tour-flight-strip` variants. Below `640px`, render it as a compact bottom sheet. Add `:focus-visible` rules and disable transitions under `prefers-reduced-motion: reduce`.

- [ ] **Step 5: Verify tooltip tests and commit**

Run: `npm test -- src/features/tour/FlightStripTooltip.test.tsx`

Expected: PASS.

```bash
git add src/features/tour/FlightStripTooltip.tsx src/features/tour/FlightStripTooltip.test.tsx src/index.css
git commit -m "feat: add responsive flight strip tour UI"
```

### Task 5: Build the user-initiated menu and exit decision

**Files:**
- Create: `src/features/tour/TourMenu.tsx`
- Create: `src/features/tour/TourMenu.test.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write failing interaction tests**

Assert that the icon opens a menu, Escape closes it, focus returns to the trigger, each catalog item calls `onStart(id)`, and the exit dialog calls `onResolve("keep")` or `onResolve("restore")`.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/features/tour/TourMenu.test.tsx`

Expected: FAIL because `TourMenu.tsx` does not exist.

- [ ] **Step 3: Implement menu and decision dialog**

Export `TourMenu({ onStart })` and `TourExitDialog({ onResolve })`. Use native buttons, `aria-expanded`, `aria-controls`, `role="menu"`, outside-click cleanup, Escape handling, and explicit labels: Quick Start, New Features, Timeline Help, Generated TAF Help, Keep demo result, and Restore my forecast.

- [ ] **Step 4: Style and verify**

Add workbench menu/dialog styles, dark variants, mobile sizing, and focus-visible states.

Run: `npm test -- src/features/tour/TourMenu.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tour/TourMenu.tsx src/features/tour/TourMenu.test.tsx src/index.css
git commit -m "feat: add guided tour launcher menu"
```

### Task 6: Implement tour lifecycle orchestration

**Files:**
- Create: `src/features/tour/TourProvider.tsx`
- Create: `src/features/tour/TourProvider.test.tsx`

- [ ] **Step 1: Write failing lifecycle tests**

Mock `react-joyride` as a capture component. Verify `startTour("quick-start")` captures the current editor, loads demo data, supplies quick-start steps, locks `create-change`, unlocks it after `notifyTask("timeline-range-created")`, skips `error:target_not_found`, and requests an exit decision on finish/skip/close.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/features/tour/TourProvider.test.tsx`

Expected: FAIL because the provider does not exist.

- [ ] **Step 3: Implement provider and hook**

Export:

```ts
export interface TourContextValue {
  startTour(id: TourId): void;
  notifyTask(event: TourTaskEvent): void;
  isRunning: boolean;
}
export function useTour(): TourContextValue;
```

Render Joyride with `continuous`, explicit `run`, custom `FlightStripTooltip`, spotlight clicks for desktop task steps, target wait timeout, localized labels, and an `onEvent` handler. Keep current index internal unless task gating requires controlled navigation. Treat missing targets and hook errors as skip-and-continue events with `console.warn` including the step ID. Use one idempotent `finishTour` path for all exits. Only quick-start loads demo data and opens `TourExitDialog`; focused tours clean up immediately.

- [ ] **Step 4: Add mobile detection**

Use `matchMedia("(max-width: 639px)")`, subscribe with `addEventListener("change", ...)`, and remove the listener during cleanup. Generate mobile steps through `getTourSteps`.

- [ ] **Step 5: Verify provider tests and commit**

Run: `npm test -- src/features/tour/TourProvider.test.tsx`

Expected: PASS.

```bash
git add src/features/tour/TourProvider.tsx src/features/tour/TourProvider.test.tsx
git commit -m "feat: orchestrate guided tour lifecycle"
```

### Task 7: Integrate the tour with TafBuilder

**Files:**
- Modify: `src/TafBuilder.tsx`
- Modify: `src/components/WindSection.tsx`
- Modify: `src/components/VisibilitySection.tsx`
- Modify: `src/components/CloudSection.tsx`
- Modify: `src/TafBuilder.test.tsx`

- [ ] **Step 1: Add failing integration tests**

Mock Joyride and verify the header button opens the menu rather than starting immediately, Quick Start loads RCTP demo data, Timeline Help does not replace current input, creating a timeline range sends the task event, and choosing Restore returns the exact pre-tour station and issue time.

- [ ] **Step 2: Verify failure**

Run: `npm test -- src/TafBuilder.test.tsx`

Expected: new tour integration assertions FAIL.

- [ ] **Step 3: Remove Intro.js orchestration**

Delete `handleStartTour`, all Intro.js timers, observers, private-field reads, and DOM visibility workarounds from `TafBuilder.tsx`.

- [ ] **Step 4: Add provider adapter and launcher**

Wrap the workbench content in `TourProvider`. Implement `capture`, `loadDemo`, and `restore` with current state setters and ref-backed current values. Render `TourMenu` in the header action area.

- [ ] **Step 5: Add stable targets and task event**

Replace tour-specific IDs with `data-tour-id="context|base|timeline|selected-change|change-type|output"`. Add `data-tour-id="wind|visibility|clouds"` to the three section roots. After `handleSelectRange` succeeds, call `notifyTask("timeline-range-created")`.

- [ ] **Step 6: Verify integrated tests and commit**

Run: `npm test -- src/TafBuilder.test.tsx`

Expected: PASS, including all existing workbench tests.

```bash
git add src/TafBuilder.tsx src/TafBuilder.test.tsx src/components/WindSection.tsx src/components/VisibilitySection.tsx src/components/CloudSection.tsx
git commit -m "feat: integrate guided tours with taf builder"
```

### Task 8: Remove obsolete styles and verify all quality gates

**Files:**
- Modify: `src/index.css`
- Test: all test files

- [ ] **Step 1: Remove Intro.js-only CSS**

Delete all `.introjs-*` and `.taf-dark-page .introjs-*` rules. Retain unrelated user-authored workbench styles.

- [ ] **Step 2: Run focused and full automated checks**

Run: `npm test`

Expected: all tests PASS.

Run: `npm run lint`

Expected: exit 0 with no errors.

Run: `npm run build`

Expected: TypeScript and Vite build exit 0.

- [ ] **Step 3: Run browser verification**

Start the app with `npm run dev`. Verify at desktop, tablet, and 390px mobile widths: all three launch groups, passive navigation, timeline task gating on desktop, passive mobile behavior, Close/Escape cleanup, demo keep/restore, missing target continuation, light/dark themes, visible focus, and reduced motion. Confirm no console errors.

- [ ] **Step 4: Commit final cleanup**

```bash
git add src/index.css
git commit -m "refactor: remove intro.js tour styles"
```

## Self-Review Result

- Every acceptance criterion in the approved spec maps to Tasks 2–8.
- Package API usage follows the current named-export React Joyride documentation.
- Tour state and editor state communicate only through the declared adapter and task event.
- The plan contains no automatic tour trigger, analytics, server persistence, or authoring CMS.
- Existing unrelated worktree changes must be preserved; stage only the files and hunks belonging to each task.
