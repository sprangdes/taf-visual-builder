# Cloud Delete Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the cloud-layer delete X as a compact system-consistent destructive action while preserving deletion behavior.

**Architecture:** Keep `CloudDeleteButton` and its existing callback and tooltip. Replace utility styling with one semantic CSS hook, add an accessible name, and define coordinated light/dark states in the shared stylesheet.

**Tech Stack:** React, TypeScript, CSS, Vitest, Testing Library, Vite

---

### Task 1: Specify the delete control contract

**Files:**
- Modify: `src/TafBuilder.test.tsx`
- Modify: `src/components/buttons/CloudDeleteButton.tsx`
- Modify: `src/index.css`

- [x] **Step 1: Write the failing test**

```tsx
const addLayer = screen.getByRole("button", { name: "Add Layer" });
fireEvent.click(addLayer);
const deleteLayer = screen.getByRole("button", { name: "Delete cloud layer" });
expect(deleteLayer).toHaveClass("cloud-delete-button");
fireEvent.click(deleteLayer);
expect(screen.queryByRole("button", { name: "Delete cloud layer" })).not.toBeInTheDocument();
```

- [x] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/TafBuilder.test.tsx`
Expected: FAIL because the current X has no `Delete cloud layer` accessible name.

- [x] **Step 3: Implement the semantic button hook**

```tsx
<button
  aria-label="Delete cloud layer"
  className="cloud-delete-button"
  type="button"
  onClick={onClick}
>
  <span aria-hidden="true">×</span>
</button>
```

Retain the existing ref, mouse handlers, z-index, and tooltip.

- [x] **Step 4: Implement light and dark styles**

```css
.cloud-delete-button {
  width: 26px;
  height: 26px;
  border: 1px solid #e4c6c6;
  border-radius: 8px;
  background: #fff7f7;
  color: #9e3b3b;
}
.cloud-delete-button:hover { border-color: #d69f9f; background: #fdecec; }
.taf-dark .cloud-delete-button { border-color: #804d55; background: #3a2026; color: #ffc8cf; }
```

- [x] **Step 5: Verify the focused test passes**

Run: `npm test -- src/TafBuilder.test.tsx`
Expected: all TafBuilder tests pass.

### Task 2: Verify the branch

**Files:**
- Verify: `src/components/buttons/CloudDeleteButton.tsx`
- Verify: `src/index.css`
- Verify: `src/TafBuilder.test.tsx`

- [x] **Step 1: Run all checks**

Run: `npm test && npm run lint && npm run build && git diff --check`
Expected: zero failures, zero lint errors, successful production build, and no whitespace errors.

- [x] **Step 2: Confirm scope**

Inspect the diff and confirm the delete callback, tooltip timing, cloud state, APIs, navigation, and TAF generation are unchanged.
