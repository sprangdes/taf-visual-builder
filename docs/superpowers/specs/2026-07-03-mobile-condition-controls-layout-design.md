# Mobile Condition Controls Layout Design

## Goal

Keep wind numeric controls complete and right-aligned on mobile widths, and make cloud metadata wrap as one coherent second row when the complete cloud row cannot fit.

## Root Cause

At widths up to 640px, wind rows assign only 122px to a numeric control whose grid columns require 160px. The trailing increment button therefore overflows the assigned column and appears missing.

Cloud rows apply wrapping directly to every child. The browser can break between the unit, CB checkbox, and TCU checkbox, allowing TCU to appear alone on a new line.

## Wind Layout

Each wind row uses three logical columns:

- A flexible field label.
- A fixed-width 160px numeric control, aligned to the right.
- A fixed-width unit.

The numeric control's decrement button, value, and increment button retain their current widths and touch targets. At ordinary phone widths, the row stays on one line. At extremely narrow content widths where all three columns cannot fit, the complete control and unit may move together below the label; individual numeric-control buttons must never be clipped or split.

## Cloud Layout

Each cloud row contains two groups:

- Measurement group: cloud amount control, cloud-height control, and the height unit.
- Checkbox group: CB checkbox and TCU checkbox.

Both groups are internally unbreakable. If both groups fit, they remain on one line. If they do not fit, the complete checkbox group moves to the second line. The height unit always remains beside the cloud-height control, and CB and TCU never split across separate rows. A cloud delete action, when present, remains a distinct fixed-size action and must not overlap either group.

## Scope

The change is limited to `WindSection`, `CloudSection`, their responsive CSS, and focused tests. It does not change numeric values, control behavior, translated labels, desktop layout, or aviation output.

## Testing and Verification

- Add structural tests proving cloud measurements and checkboxes are grouped separately and wind rows expose a stable layout hook.
- Run all existing tests, lint, and production build.
- Verify the rendered layout at 393px and 635px viewport widths.
- At both widths, every wind row shows decrement and increment buttons, with controls right-aligned.
- At 393px, the checkbox group may occupy the second row while the unit remains with the two cloud controls.
- At 635px, cloud measurements and checkboxes remain on one row when space permits.
