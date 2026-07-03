# Guided Tour System Design

**Date:** 2026-07-03

## Objective

Replace the current Intro.js implementation with a maintainable, user-initiated guided-tour system that supports three use cases:

1. A complete first-use walkthrough.
2. Focused tours for newly released features.
3. Topic-based help that users can reopen at any time.

The tour must support guided explanation and selected hands-on tasks. Desktop and tablet receive the complete experience; mobile receives a simplified explanatory experience. Tours never open automatically.

## Current State

The application is React 19, TypeScript, and Vite. The existing tour uses Intro.js 7.2 and is implemented inside `TafBuilder.tsx`. It coordinates dynamic targets with timers, direct DOM mutations, `MutationObserver`, tooltip visibility overrides, and access to Intro.js private fields. These workarounds make additional tour variants and interactive tasks difficult to maintain.

## Chosen Approach

Use `react-joyride` for target positioning, overlays, step lifecycle, scrolling, navigation, and keyboard behavior.

The decision is based on its React-oriented API, asynchronous step hooks, explicit lifecycle events, dynamic-target support, custom tooltip rendering, and controlled operation when application events must unlock a task step.

Rejected alternatives:

- **Driver.js:** lightweight and highly themeable, but its framework-neutral API would require more application-owned coordination for React state, dynamic targets, and task completion.
- **Refactored Intro.js:** lowest migration cost, but retains the lifecycle and DOM-coordination limitations already visible in the current implementation.

No additional global state package will be introduced.

## Scope

### Included

- Replace Intro.js with `react-joyride`.
- Add a user-initiated tour menu to the existing header control.
- Provide quick-start, new-feature, and topic-help tour definitions.
- Provide desktop/tablet and simplified mobile presentations.
- Support passive steps and selected task-gated steps.
- Preserve and optionally restore user TAF data when a walkthrough loads demonstration data.
- Support light mode, dark mode, reduced motion, keyboard navigation, and responsive layouts.
- Add unit, component, integration, and browser-level verification.

### Excluded

- Automatic first-visit or release-triggered tours.
- Server-side completion tracking, analytics, or cross-device progress synchronization.
- A non-developer content-management interface for authoring tours.
- Broad changes to the TAF editing workflow.

## Architecture

Create a bounded `src/features/tour/` feature with the following responsibilities:

- **`TourProvider`:** owns the active tour, lifecycle state, device presentation, task completion state, demonstration-data snapshot, and cleanup.
- **Tour definitions:** declarative definitions for quick-start, new-feature, and topic-help tours. Each step declares a stable ID, target, copy, mobile copy, task behavior, and optional lifecycle hooks.
- **`FlightStripTooltip`:** custom Joyride tooltip using the approved Responsive Flight Strip design.
- **Tour menu:** exposes the three user-initiated entry points from the existing header tour button.
- **Target contract:** components expose stable `data-tour-id` attributes. Tour behavior must not access Joyride private fields or mutate Joyride-owned DOM.

The tour feature depends on application callbacks and state passed through a narrow adapter. TAF domain components do not import tour definitions or Joyride APIs.

## Visual Design

The approved direction is **C. Responsive Flight Strip**.

### Desktop and tablet

- Highlight the active target while presenting instructions in a fixed bottom strip.
- Keep the strip visually connected to the Aviation Workbench through its typography, numbered section treatment, restrained blue accent, and technical progress display.
- Show the step number, title, concise instruction, task state, progress, Back, Next or completion action, and Close.
- Keep the strip away from the active target where possible and scroll the target into the unobscured viewport.

### Mobile

- Convert the strip into a compact bottom sheet.
- Use shorter mobile-specific copy.
- Do not require complex interactive tasks; provide explanation and an action to scroll to the relevant section.
- Preserve Back, Next, Close, progress, and visible focus states.

### Themes and motion

- Use the existing light and dark workbench tokens.
- Meet WCAG AA contrast for text and controls.
- Never use color as the only task-status signal.
- Disable nonessential animation when `prefers-reduced-motion: reduce` is active.

The visual-companion reference is stored under `.superpowers/brainstorm/74522-1783061872/`. It is a design reference, not production markup.

## Tour Definitions

### Quick start

A complete workflow covering forecast context, base forecast, wind, visibility/weather, clouds, timeline range creation, selected-change editing, change type, and generated TAF output.

Quick start may load demonstration data. Before doing so, `TourProvider` stores an in-memory snapshot of the current TAF and selected-change state. On completion or exit, the user chooses either:

- keep the demonstrated result; or
- restore the exact pre-tour snapshot.

### New feature tours

Small, version-named definitions that focus only on the affected controls. They are available from the tour menu and never appear automatically. Removing or archiving an obsolete definition must not affect quick start.

### Topic help

The menu lists user-facing topics. Selecting a topic opens the relevant focused sequence rather than forcing the complete walkthrough.

## Step Model

Each step contains:

- a unique stable step ID;
- a stable `data-tour-id` target;
- desktop title and copy;
- optional shorter mobile copy;
- step kind: passive or task;
- optional task-completion predicate or application event;
- optional asynchronous `before` and `after` hooks;
- an explicit policy for a missing target: wait, then skip.

Steps are passive by default. Task gating is used only where performing the action materially improves understanding, such as creating a timeline range. A gated desktop step disables Next until the application reports completion, but Back, Close, and Skip remain available. On mobile, the same step becomes passive.

## Interaction and Data Flow

1. The user activates the existing tour control.
2. The tour menu presents Quick Start, New Features, and Help by Topic.
3. The selected definition is loaded into `TourProvider`.
4. `TourProvider` prepares any required application state through a public adapter, then starts Joyride.
5. Joyride locates and highlights the target. `FlightStripTooltip` renders the current instruction.
6. Passive steps allow immediate navigation. Task steps listen for the declared application event and unlock Next when complete.
7. Step hooks open or close conditional UI before target lookup and restore temporary state afterward.
8. Finish, Close, Escape, and Skip all call the same idempotent cleanup path.
9. If demonstration data was loaded, the exit decision is resolved before cleanup completes.

## Missing Targets and Failure Handling

- Wait for a dynamic target for a bounded period.
- If the target remains unavailable, record a development warning, mark the step skipped, and continue.
- A missing optional target must never leave an overlay or focus trap active.
- Hook failures follow the same skip-and-cleanup behavior and include the step ID in the warning.
- Cleanup is idempotent and removes listeners, temporary UI state, task locks, overlays, and retained snapshots.
- The feature must tolerate React Strict Mode lifecycle repetition.

## Accessibility

- The active tooltip behaves as an appropriately labelled dialog.
- Focus moves into the strip and remains within its interactive controls while the step is active.
- Escape closes the tour through the normal cleanup path.
- Back, Next, Skip, Close, task state, and progress have explicit accessible names.
- Keyboard focus is visible in both themes.
- The target description is understandable without relying on its highlight color.
- After exit, focus returns to the tour trigger when it still exists.

## Testing

### Definition validation

- Step IDs are unique.
- Required copy and targets are present.
- Task steps declare a completion mechanism.
- Mobile copy and behavior satisfy the mobile simplification rules.

### Provider and lifecycle tests

- Start each tour type.
- Move forward and backward, skip, finish, close, and press Escape.
- Unlock a task step from the expected application event.
- Keep Next locked before the required desktop action.
- Restore or keep demonstration data according to the exit choice.
- Run cleanup more than once without an error or leaked state.
- Wait for a late target and safely skip a missing target.

### Presentation tests

- Render the desktop/tablet Flight Strip and mobile bottom sheet.
- Verify light, dark, reduced-motion, and visible-focus states.
- Verify copy, progress, task-status, and control labels.

### Integration and browser verification

- Complete Quick Start through the real editing workflow.
- Confirm the generated TAF remains consistent with current application behavior.
- Verify desktop, tablet, and mobile viewports.
- Run `npm test`, `npm run lint`, and `npm run build`.

## Migration

1. Install `react-joyride` and retain Intro.js temporarily while the new feature is built behind the existing trigger.
2. Add the tour feature boundary and stable `data-tour-id` targets.
3. Implement the Flight Strip tooltip and responsive behavior.
4. Port the quick-start sequence, then add focused new-feature and topic-help definitions.
5. Add task-gating and demonstration-data restoration.
6. Verify all paths and responsive modes.
7. Remove Intro.js, its stylesheet import, existing DOM workarounds, and obsolete Intro.js-specific CSS.

## Acceptance Criteria

- Tours start only after an explicit user action.
- Users can launch all three tour types from the header tour menu.
- Desktop/tablet tours support passive and task-gated steps.
- Mobile tours use simplified passive instructions.
- The approved Responsive Flight Strip works in light and dark modes without obscuring the active target.
- Closing at any point leaves the editor usable and free of tour-owned state.
- Demonstration data can be kept or fully reverted.
- Missing targets do not block or break the tour.
- The implementation contains no access to library private fields and no direct mutation of library-owned DOM.
- Existing TAF editing and output behavior remains unchanged outside tour-driven demonstration actions.
- Tests, lint, build, and responsive browser checks pass.
