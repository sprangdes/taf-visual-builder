# Mobile Native Field Inputs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add native mobile numeric entry and cloud-amount selection while preserving the existing desktop minus/value/plus controls.

**Architecture:** Extend `NumericControl` with an optional mobile editor rendered beside the existing desktop display. CSS selects the correct presentation at the existing 639px breakpoint, while both presentations share the same value and callback. Wind and cloud sections configure the editor mode without introducing new state or dependencies.

**Tech Stack:** React 19, TypeScript, CSS media queries, Vitest, Testing Library

---

### Task 1: Specify mobile editor behavior

**Files:**
- Create: `src/components/inputs/NumericControl.test.tsx`
- Create: `src/components/IssueTimeInput.test.tsx`

- [ ] **Step 1: Write failing NumericControl tests**

Render `NumericControl` inside `LanguageProvider`. Assert that numeric mode exposes a textbox with `inputmode="numeric"`, `pattern="[0-9]*"`, `min`, and `max`; changing it to `120` emits the clamped maximum. Assert that select mode exposes a combobox containing `FEW`, `SCT`, `BKN`, and `OVC` in order and emits the selected option index. Also assert the existing spinbutton and two buttons remain present.

- [ ] **Step 2: Write the IssueTimeInput regression test**

Render `IssueTimeInput` with `value="031100"`. Assert its input has `inputmode="numeric"`, `pattern="[0-9]*"`, and `maxlength="6"`; changing it to `03A110099` emits `031100`.

- [ ] **Step 3: Run tests and verify RED**

Run: `npm test -- src/components/inputs/NumericControl.test.tsx src/components/IssueTimeInput.test.tsx`

Expected: Issue-time assertions pass, while NumericControl tests fail because the mobile textbox, combobox, and configuration props do not exist.

- [ ] **Step 4: Commit the test specification**

```bash
git add src/components/inputs/NumericControl.test.tsx src/components/IssueTimeInput.test.tsx
git commit -m "test: specify mobile native field inputs"
```

### Task 2: Implement reusable mobile editors

**Files:**
- Modify: `src/components/inputs/NumericControl.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Add editor configuration props**

Add `mobileEditor?: "numeric" | "select"` and `mobileOptions?: readonly string[]` to `NumericControlProps`. Keep the default undefined so existing callers retain their current markup and behavior.

- [ ] **Step 2: Add bounded numeric parsing**

Add a change handler that removes non-digits, ignores an empty intermediate value, parses the remaining digits, clamps the number between `min` and `max`, synchronizes `valueRef`, and calls `onChange`.

- [ ] **Step 3: Render the mobile editor**

Keep `.numeric-control-display` as the desktop center. For numeric mode, render a text input with class `.numeric-control-mobile-editor`, `inputMode="numeric"`, `pattern="[0-9]*"`, `min`, `max`, and the formatted display value. For select mode, render a native select with the same class, numeric index value, and one option per `mobileOptions` entry.

- [ ] **Step 4: Add responsive styling**

Hide `.numeric-control-mobile-editor` by default. Within `@media (max-width: 639px)`, hide `.numeric-control-display` only when a mobile editor is present and display the mobile editor. Reset input/select border, background, typography, width, appearance, and text alignment so the control retains its existing dimensions and dark-theme colors.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- src/components/inputs/NumericControl.test.tsx src/components/IssueTimeInput.test.tsx`

Expected: both test files pass.

- [ ] **Step 6: Commit the reusable control**

```bash
git add src/components/inputs/NumericControl.tsx src/index.css
git commit -m "feat: add mobile editors to numeric control"
```

### Task 3: Configure wind and cloud fields

**Files:**
- Modify: `src/components/WindSection.tsx`
- Modify: `src/components/CloudSection.tsx`
- Modify: `src/TafBuilder.test.tsx`

- [ ] **Step 1: Write failing integration assertions**

In the workbench hierarchy test, assert that five mobile numeric textboxes exist for issue time, wind direction, wind speed, wind gust, and cloud height. Assert one cloud-amount combobox has the ordered option labels `FEW`, `SCT`, `BKN`, and `OVC`.

- [ ] **Step 2: Run the integration test and verify RED**

Run: `npm test -- src/TafBuilder.test.tsx`

Expected: FAIL because wind and cloud callers have not enabled the mobile editors.

- [ ] **Step 3: Enable numeric wind editors**

Pass `mobileEditor="numeric"` to the direction, speed, and gust `NumericControl` instances in `WindSection`.

- [ ] **Step 4: Enable cloud select and height editor**

Pass `mobileEditor="select"` and `mobileOptions={cloudAmountOptions}` to cloud amount. Pass `mobileEditor="numeric"` to cloud height.

- [ ] **Step 5: Run integration and focused tests and verify GREEN**

Run: `npm test -- src/TafBuilder.test.tsx src/components/inputs/NumericControl.test.tsx src/components/IssueTimeInput.test.tsx`

Expected: all selected tests pass.

- [ ] **Step 6: Commit field integration**

```bash
git add src/components/WindSection.tsx src/components/CloudSection.tsx src/TafBuilder.test.tsx
git commit -m "feat: enable native mobile weather inputs"
```

### Task 4: Verify the complete change

**Files:**
- Modify only if verification exposes a defect in an already listed file.

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: ESLint exits successfully with zero errors.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: TypeScript and Vite build exit successfully.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff HEAD~3 --check` and `git status --short --branch`

Expected: no whitespace errors; only the planned source, test, CSS, spec, and plan changes are present.
