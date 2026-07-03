# Cloud Delete Button Refinement

## Scope

Restyle the existing cloud-layer delete control to match the current workbench design system. Preserve its visibility rule, click handler, tooltip behavior, cloud state updates, and layer ordering.

## Visual design

- Keep the compact `X` symbol so the control fits within a cloud-layer row.
- Use a 26 × 26 px square button with an 8 px system radius.
- Use a pale red surface, subtle red border, and dark red symbol in light mode.
- Increase border and surface emphasis on hover without changing layout.
- Provide coordinated dark-mode border, surface, symbol, and hover colors.
- Use the shared keyboard focus treatment already defined for buttons.

## Accessibility

- Add the accessible name `Delete cloud layer` to the button.
- Preserve native button semantics and the existing hover tooltip.
- Keep the target visually compact while retaining the existing row spacing.

## Verification

- Assert the button exposes the `Delete cloud layer` accessible name and the `cloud-delete-button` style hook after a second layer is added.
- Confirm clicking it still removes exactly one cloud layer through the existing handler.
- Run tests, lint, TypeScript, production build, and whitespace checks.

## Non-goals

- No changes to cloud creation, deletion logic, data structures, APIs, navigation, or TAF generation.
