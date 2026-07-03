# Mobile Native Picker Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mobile numeric keyboard editors for wind and cloud height with native picker controls using the required ranges and formatting.

**Architecture:** Generalize `NumericControl` mobile select options from index-only strings to explicit numeric value/label objects. Generate stable option collections in the wind and cloud modules, while preserving issue-time keyboard entry and all desktop spinbutton behavior.

**Tech Stack:** React 19, TypeScript, native HTML select, CSS media queries, Vitest, Testing Library

---

### Task 1: Generalize native picker options

**Files:**
- Modify: `src/components/inputs/NumericControl.test.tsx`
- Modify: `src/components/inputs/NumericControl.tsx`

- [ ] **Step 1: Write the failing explicit-value test**

Update the select test to pass `mobileOptions={[{ value: 0, label: "000" }, { value: 10, label: "010" }, { value: 20, label: "020" }]}`. Assert the option values are `0`, `10`, and `20`; change the select to `20`; expect `onChange(20)`. Retain assertions that the desktop spinbutton and two buttons remain present.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/components/inputs/NumericControl.test.tsx`

Expected: FAIL because `mobileOptions` currently accepts strings and emits array indices.

- [ ] **Step 3: Implement explicit picker values**

Define `interface MobileOption { value: number; label: string }`, change `mobileOptions` to `readonly MobileOption[]`, remove the unused `"numeric"` editor branch and `handleNumericChange`, and render each option with `value={option.value}` and text `option.label`. Parse the selected option value and pass it unchanged to `onChange`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/components/inputs/NumericControl.test.tsx`

Expected: the updated component tests pass.

- [ ] **Step 5: Commit the reusable picker API**

```bash
git add src/components/inputs/NumericControl.test.tsx src/components/inputs/NumericControl.tsx
git commit -m "refactor: support explicit mobile picker values"
```

### Task 2: Configure wind and cloud picker ranges

**Files:**
- Modify: `src/TafBuilder.test.tsx`
- Modify: `src/components/WindSection.tsx`
- Modify: `src/components/CloudSection.tsx`

- [ ] **Step 1: Write failing integration assertions**

Query the five `.numeric-control-mobile-editor` selects in base forecast order. Assert direction has 37 values from `0` to `360` and its second value is `10`; speed and gust each have 100 labels from `00` to `99`; cloud amount labels equal `FEW`, `SCT`, `BKN`, `OVC`; cloud height has 1,000 labels from `000` to `999`. Assert only the issue-time input retains `inputmode="numeric"`.

- [ ] **Step 2: Run the integration test and verify RED**

Run: `npm test -- src/TafBuilder.test.tsx`

Expected: FAIL because wind and cloud height still render numeric inputs and cloud amount still supplies string options.

- [ ] **Step 3: Add stable wind option collections**

At module scope in `WindSection.tsx`, build direction options with `Array.from({ length: 37 }, (_, index) => ({ value: index * 10, label: String(index * 10) }))` and two-digit options with `Array.from({ length: 100 }, (_, value) => ({ value, label: String(value).padStart(2, "0") }))`. Configure direction, speed, and gust with `mobileEditor="select"` and the matching collection.

- [ ] **Step 4: Add stable cloud option collections**

At module scope in `CloudSection.tsx`, map cloud amounts to `{ value: index, label }` objects and build 1,000 height options with three-digit labels. Configure both cloud controls with `mobileEditor="select"` and their matching collections.

- [ ] **Step 5: Run integration and component tests and verify GREEN**

Run: `npm test -- src/TafBuilder.test.tsx src/components/inputs/NumericControl.test.tsx src/components/IssueTimeInput.test.tsx`

Expected: all selected tests pass.

- [ ] **Step 6: Commit field picker integration**

```bash
git add src/TafBuilder.test.tsx src/components/WindSection.tsx src/components/CloudSection.tsx
git commit -m "feat: use native pickers for mobile weather values"
```

### Task 3: Verify the complete change

**Files:**
- Modify only if verification exposes a defect in an already listed file.

- [ ] **Step 1: Run all project tests excluding nested worktrees**

Run: `npx vitest run --exclude '.worktrees/**'`

Expected: all project tests pass with zero failures.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: ESLint exits with zero errors.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: TypeScript and Vite exit successfully.

- [ ] **Step 4: Inspect repository state**

Run: `git diff --check` and `git status --short --branch`.

Expected: no whitespace errors and no uncommitted implementation files.
