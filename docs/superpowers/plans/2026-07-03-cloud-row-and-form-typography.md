# Cloud Row and Form Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each cloud layer render on its own line and align requested labels, units, visibility text, Weather heading, and CB/TCU controls with the existing workbench design system.

**Architecture:** Preserve all React state and event handlers. Add semantic CSS hooks to existing markup, enforce row layout in CSS, and cover the structural behavior with the existing TafBuilder integration test.

**Tech Stack:** React, TypeScript, CSS, Vitest, Testing Library, Vite

---

### Task 1: Lock cloud rows to separate lines

**Files:**
- Modify: `src/TafBuilder.test.tsx`
- Modify: `src/index.css`

- [x] **Step 1: Write the failing test**

Create two additional layers and assert that `.cloud-layers-controls` is a column whose `.cloud-layer-row` children remain separate containers.

```tsx
const addLayer = screen.getByRole("button", { name: "Add Layer" });
fireEvent.click(addLayer);
fireEvent.click(addLayer);
expect(document.querySelectorAll(".cloud-layers-controls > .cloud-layer-row")).toHaveLength(3);
expect(document.querySelector(".cloud-layers-controls")).toHaveClass("cloud-layers-stack");
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- src/TafBuilder.test.tsx`
Expected: FAIL because `cloud-layers-stack` is absent.

- [x] **Step 3: Implement the row layout**

Add `cloud-layers-stack` to the layer container and style it as a vertical stack with each layer taking the available width.

```css
.cloud-layers-stack { flex-direction: column; align-items: stretch; }
.cloud-layers-stack > .cloud-layer-row { width: 100%; }
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- src/TafBuilder.test.tsx`
Expected: all TafBuilder tests pass.

### Task 2: Standardize requested typography and checkboxes

**Files:**
- Modify: `src/components/WindSection.tsx`
- Modify: `src/components/VisibilitySection.tsx`
- Modify: `src/components/CloudSection.tsx`
- Modify: `src/index.css`

- [x] **Step 1: Add semantic style hooks**

Use `condition-field-label`, `condition-unit`, `visibility-value`, `condition-subheading`, and `cloud-checkbox` classes without changing text, values, or handlers.

- [x] **Step 2: Implement shared typography**

```css
.condition-field-label, .condition-subheading { color: var(--taf-text); font-size: 11px; font-weight: 700; }
.condition-unit { color: var(--taf-muted); font-size: 11px; font-weight: 650; }
.visibility-value { font-size: 13px; font-weight: 760; font-variant-numeric: tabular-nums; }
```

- [x] **Step 3: Implement system checkbox styling**

```css
.cloud-checkbox input { width: 14px; height: 14px; accent-color: var(--taf-accent); }
.cloud-checkbox span { color: var(--taf-muted); font-size: 11px; font-weight: 650; }
```

- [x] **Step 4: Verify responsive behavior**

Keep `.cloud-layer-row` wrapping enabled for narrow widths while the stack continues to separate layers.

### Task 3: Full verification

**Files:**
- Verify: `src/TafBuilder.test.tsx`
- Verify: `src/index.css`
- Verify: affected components

- [x] **Step 1: Run all checks**

Run: `npm test && npm run lint && npm run build && git diff --check`
Expected: zero test failures, zero lint errors, successful production build, and no whitespace errors.

- [x] **Step 2: Review scope**

Confirm the diff contains only markup class additions, CSS, structural tests, and documentation; no state, API, formatter, or navigation logic changes.
