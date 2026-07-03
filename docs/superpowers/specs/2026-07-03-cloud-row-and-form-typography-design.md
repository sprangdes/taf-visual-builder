# Cloud Row and Form Typography Refinement

## Scope

Refine the existing forecast condition editors without changing their fields, events, state, generated TAF output, or workflow.

## Cloud-layer layout

- Each cloud layer occupies one full row within the cloud section.
- Adding a layer appends it below the existing layers.
- The Add Layer action remains on its own row below the complete layer list.
- Amount, height, unit, CB, TCU, and delete controls remain in their current order.
- Rows may wrap internally on narrow screens, but separate cloud layers must never share one row container.

## Form typography

- Wind Direction, Wind Speed, and Wind Gust use one shared field-label style aligned with the system's form labels.
- Degree and KT use one shared unit style with tabular alignment and secondary text color.
- The current visibility value uses the system's emphasized numeric style and retains the `m` suffix.
- The Weather heading uses the same compact uppercase field-label treatment as comparable editor labels.

## Cloud checkboxes

- CB and TCU keep native checkbox semantics and their existing change handlers.
- Checkbox dimensions, border, selected color, label typography, hover cursor, and keyboard focus ring are standardized.
- Labels remain clickable and maintain their existing accessible association through wrapping.

## Responsive behavior

- Desktop and tablet show one cloud layer per row.
- On mobile, controls may wrap within that layer's row while maintaining readable spacing and touch targets.

## Verification

- Add two cloud layers and assert that each has a separate `.cloud-layer-row` container.
- Assert the Add Layer button remains outside `.cloud-layers-controls`.
- Run the full test suite, lint, TypeScript check, and production build.

## Non-goals

- No business-logic, API, navigation, state-shape, or TAF-generation changes.
- No field additions, removals, or reordering.
