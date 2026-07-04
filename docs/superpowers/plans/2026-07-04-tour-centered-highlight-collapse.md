# Tour Centered Highlight and Mobile Collapse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Center and spotlight every tour target and add a reversible mobile card collapse that hides the overlay.

**Architecture:** Add a tested target-centering helper used by each Joyride step. Store collapse state in `TourProvider`, expose it through `TourContext`, and render the mobile control in `FlightStripTooltip` with responsive CSS.

**Tech Stack:** React 19, React Joyride, TypeScript, CSS, Vitest, Testing Library

---

### Task 1: Center every tour target

**Files:**
- Create: `src/features/tour/tourScroll.ts`
- Create: `src/features/tour/tourScroll.test.ts`
- Modify: `src/features/tour/TourProvider.tsx`
- Modify: `src/features/tour/TourProvider.test.tsx`

- [ ] Write failing tests that require smooth centered `scrollIntoView`, `skipScroll: true`, no `isFixed`, and a step `before` hook.
- [ ] Run the focused tests and confirm they fail for missing behavior.
- [ ] Implement `centerTourTarget` and configure every step to call it before display.
- [ ] Run focused tests and confirm they pass.
- [ ] Commit with `feat: center guided tour targets`.

### Task 2: Add mobile collapse and overlay control

**Files:**
- Modify: `src/features/tour/TourContext.ts`
- Modify: `src/features/tour/TourProvider.tsx`
- Modify: `src/features/tour/TourProvider.test.tsx`
- Modify: `src/features/tour/FlightStripTooltip.tsx`
- Modify: `src/features/tour/FlightStripTooltip.test.tsx`
- Create: `src/features/tour/tourGesture.ts`
- Create: `src/features/tour/tourGesture.test.ts`
- Modify: `src/features/i18n/translations.ts`
- Modify: `src/index.css`
- Modify: `src/features/tour/tourStyles.test.ts`

- [ ] Write failing provider tests for collapse toggling, `hideOverlay`, and reset behavior.
- [ ] Write failing gesture tests for the 40 px vertical threshold, upward/downward direction, and horizontal-gesture rejection.
- [ ] Write failing tooltip and CSS tests for mobile chevrons, labels, `aria-expanded`, pointer gestures, and compact state.
- [ ] Run focused tests and confirm expected failures.
- [ ] Implement the pure gesture classifier, context state, localized controls, tooltip pointer handling, and responsive styling.
- [ ] Run all focused tour tests and confirm they pass.
- [ ] Commit with `feat: add collapsible mobile tour card`.

### Task 3: Verify

- [ ] Run `npx vitest run --exclude '.worktrees/**'`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check` and inspect repository status.
