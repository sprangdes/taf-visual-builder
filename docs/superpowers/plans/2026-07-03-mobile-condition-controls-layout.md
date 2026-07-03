# Mobile Condition Controls Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent mobile wind controls from clipping and keep cloud unit/checkbox metadata together when rows wrap.

**Architecture:** Add semantic layout wrappers to the existing wind and cloud components, then apply narrowly scoped responsive flex/grid rules. Keep `NumericControl` dimensions and behavior unchanged; only parent layout ownership changes.

**Tech Stack:** React 19, TypeScript, CSS media queries, Vitest, Testing Library

---

### Task 1: Add Responsive Layout Structure Tests

**Files:**
- Modify: `src/TafBuilder.test.tsx`

- [ ] **Step 1: Write failing structural tests**

Add assertions to the existing workbench hierarchy test:

```tsx
expect(document.querySelectorAll(".wind-control-group")).toHaveLength(3);
expect(document.querySelector(".cloud-measurement-group")).toContainElement(
  screen.getAllByRole("spinbutton")[3],
);
const cloudMeasurements = document.querySelector(".cloud-measurement-group");
expect(cloudMeasurements).toHaveTextContent("hundreds ft");
const cloudCheckboxes = document.querySelector(".cloud-checkbox-group");
expect(cloudCheckboxes).toHaveTextContent("CB");
expect(cloudCheckboxes).toHaveTextContent("TCU");
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/TafBuilder.test.tsx`

Expected: FAIL because the three layout-group classes do not exist.

### Task 2: Group Wind and Cloud Controls

**Files:**
- Modify: `src/components/WindSection.tsx`
- Modify: `src/components/CloudSection.tsx`
- Modify: `src/index.css`
- Test: `src/TafBuilder.test.tsx`

- [ ] **Step 1: Group each wind control with its unit**

Wrap every `NumericControl` and its following unit in a stable group:

```tsx
<span className="wind-control-group">
  <NumericControl {...numericProps} />
  <span className="condition-unit">KT</span>
</span>
```

Use the same wrapper for direction and place `°` in its unit span. This gives the parent one non-splittable, right-aligned item.

- [ ] **Step 2: Group cloud controls and metadata**

Inside each `.cloud-layer-row`, render:

```tsx
<span className="cloud-measurement-group">
  <NumericControl {...amountProps} />
  <NumericControl {...heightProps} />
  <span className="cloud-height-unit">{text.conditions.hundredsFeet}</span>
</span>
<span className="cloud-checkbox-group">
  <label className="cloud-checkbox">...</label>
  <label className="cloud-checkbox">...</label>
</span>
```

Keep `CloudDeleteButton` after these groups so its existing fixed action remains independent.

- [ ] **Step 3: Add responsive rules**

Replace the 640px wind grid rule with:

```css
.wind-block label {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}
.wind-control-group {
  display: inline-flex;
  align-items: center;
  justify-self: end;
  gap: 6px;
  white-space: nowrap;
}
.wind-block .numeric-control { flex: 0 0 160px; }
```

Add cloud grouping rules:

```css
.cloud-measurement-group,
.cloud-checkbox-group { display: inline-flex; align-items: center; gap: 8px; }
.cloud-measurement-group,
.cloud-checkbox-group { flex: 0 0 auto; white-space: nowrap; }
```

At `max-width: 640px`, keep `.cloud-layer-row` wrapping by group. At an additional narrow breakpoint around 420px, set `.cloud-checkbox-group { flex-basis: 100%; }` so the complete checkbox group moves to row two while the height unit remains in the measurement group.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/TafBuilder.test.tsx`

Expected: all workbench tests PASS, including the new grouping assertions.

### Task 3: Full and Visual Verification

**Files:**
- Modify only files required by failures found during verification.

- [ ] **Step 1: Run automated verification**

Run separately:

```bash
npm test
npm run lint
npm run build
```

Expected: 0 test failures, 0 lint errors, and a successful Vite build.

- [ ] **Step 2: Verify at 393px**

Start the local Vite server and inspect a 393px viewport. Confirm every wind row shows both `−` and `+`, numeric controls align right, and `百呎 / CB / TCU` occupy one intact metadata row.

- [ ] **Step 3: Verify at 635px**

Inspect a 635px viewport. Confirm wind controls remain complete and right-aligned, and the cloud row stays on one line when space permits.

- [ ] **Step 4: Commit**

```bash
git add src/TafBuilder.test.tsx src/components/WindSection.tsx src/components/CloudSection.tsx src/index.css
git commit -m "fix: repair mobile condition control layout"
```
