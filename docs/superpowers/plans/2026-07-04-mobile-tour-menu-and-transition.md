# Mobile Tour Menu and Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the guided-tour menu inside the mobile viewport and eliminate Joyride's visible step-transition flash.

**Architecture:** Add narrowly scoped responsive and Joyride override rules to the existing stylesheet. Test the required CSS contract directly and retain component tests for menu and tour behavior.

**Tech Stack:** React 19, React Joyride, CSS media queries, Vitest, Testing Library

---

### Task 1: Keep the mobile tour menu inside the viewport

**Files:**
- Create: `src/features/tour/tourStyles.test.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Write the failing mobile positioning test**

Read `src/index.css` in the test and extract the `@media (max-width: 639px)` block. Assert it includes a `.tour-menu` rule with `position: fixed`, `top: 72px`, `left: 12px`, `right: 12px`, `width: auto`, `max-height: calc(100dvh - 84px)`, and `overflow-y: auto`.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- src/features/tour/tourStyles.test.ts`

Expected: FAIL because no mobile `.tour-menu` positioning override exists.

- [ ] **Step 3: Add the mobile fixed menu rule**

Inside the existing 639 px media query, add the exact fixed positioning, viewport insets, dynamic maximum height, and vertical overflow rules. Keep desktop `.tour-menu` unchanged.

- [ ] **Step 4: Run menu style and component tests and verify GREEN**

Run: `npm test -- src/features/tour/tourStyles.test.ts src/features/tour/TourMenu.test.tsx`

Expected: both test files pass.

- [ ] **Step 5: Commit the menu fix**

```bash
git add src/features/tour/tourStyles.test.ts src/index.css
git commit -m "fix: keep mobile tour menu in viewport"
```

### Task 2: Remove guided-tour step flashing

**Files:**
- Modify: `src/features/tour/tourStyles.test.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Write failing transition assertions**

Assert the stylesheet forces `.react-joyride__floater:has(.tour-flight-strip)` to `opacity: 1 !important` and `transition: none !important`. Assert `.react-joyride__spotlight path + path` has `opacity: 0 !important` and `transition: none !important`.

- [ ] **Step 2: Run the style test and verify RED**

Run: `npm test -- src/features/tour/tourStyles.test.ts`

Expected: FAIL because Joyride's transient opacity styles are not overridden.

- [ ] **Step 3: Add scoped anti-flash rules**

Extend the existing flight-strip floater rule with forced opacity and no transition. Add a selector for the temporary second spotlight path that keeps it transparent and disables its transition. Do not alter scrolling, the main spotlight path, or non-tour animation.

- [ ] **Step 4: Run tour tests and verify GREEN**

Run: `npm test -- src/features/tour/tourStyles.test.ts src/features/tour/TourProvider.test.tsx src/features/tour/FlightStripTooltip.test.tsx`

Expected: all selected tests pass.

- [ ] **Step 5: Commit the transition fix**

```bash
git add src/features/tour/tourStyles.test.ts src/index.css
git commit -m "fix: prevent guided tour step flashing"
```

### Task 3: Verify combined work

**Files:**
- Modify only if verification exposes a defect in an already listed file.

- [ ] **Step 1: Run all project tests**

Run: `npx vitest run --exclude '.worktrees/**'`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run lint and build**

Run: `npm run lint` and `npm run build`.

Expected: both commands exit successfully.

- [ ] **Step 3: Inspect final state**

Run: `git diff --check` and `git status --short --branch`.

Expected: no whitespace errors and no uncommitted implementation files.
