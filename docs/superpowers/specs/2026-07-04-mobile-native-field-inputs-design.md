# Mobile Native Field Inputs Design

## Goal

Improve mobile data entry without changing the current desktop controls:

- Tapping issue time, wind direction, wind speed, wind gust, or cloud height opens a numeric mobile keyboard.
- Tapping cloud amount opens the operating system's native picker with `FEW`, `SCT`, `BKN`, and `OVC`.
- Desktop users continue to use the existing minus/value/plus controls.

## Scope

The change applies to the issue-time field and the reusable numeric controls used by wind and cloud layers. Visibility, weather phenomena, CB/TCU toggles, timeline controls, and generated TAF formatting remain unchanged.

## Interaction Design

### Numeric fields

On mobile-sized viewports, the center of each applicable numeric control becomes a text input with `inputMode="numeric"` and `pattern="[0-9]*"`. A text input is used instead of `type="number"` so mobile browsers request a numeric keypad while the application retains control over leading zeros and formatting.

The minus and plus buttons remain available. Typed input accepts digits only and is clamped to the field's existing minimum and maximum. Empty intermediate input is allowed while editing; on blur it resolves to the last valid value. Formatted values retain their existing widths: wind speed and gust use two digits, and cloud height uses three digits.

Issue time keeps its existing six-digit filtering, maximum length, and numeric keyboard attributes.

### Cloud amount

On mobile-sized viewports, the center of the cloud amount control becomes a native `select` containing, in order, `FEW`, `SCT`, `BKN`, and `OVC`. iOS presents its native wheel picker; other mobile operating systems may use their own native selection UI.

The minus and plus buttons continue to cycle through the same ordered values. Desktop retains the existing non-editable center display.

### Responsive behavior

The existing mobile breakpoint (`max-width: 639px`) determines which center control is visible. Both variants remain connected to the same value and callback, so changing viewport presentation does not create separate state.

## Component Design

`NumericControl` gains an optional mobile editor mode:

- Numeric mode renders the mobile numeric input.
- Select mode receives explicit string options and renders the mobile native select.
- The existing spinbutton keyboard behavior and minus/plus behavior remain intact.

`WindSection` uses numeric mode for direction, speed, and gust. `CloudSection` uses select mode for cloud amount and numeric mode for cloud height. `IssueTimeInput` requires no behavior change unless tests expose a missing accessibility or input attribute.

CSS switches between the desktop display and mobile editor at the established breakpoint while preserving the current control dimensions, dark theme, and grouped cloud layout.

## Validation and State Flow

All edits continue through existing `onChange`, `onUpdateWind`, and `onUpdateCloud` callbacks. Numeric parsing happens inside `NumericControl`; invalid characters never reach forecast state. Values are bounded by the same `min` and `max` values already used by the minus and plus buttons.

No user-agent sniffing, new dependency, modal, or custom picker is introduced.

## Testing

Component tests will verify:

- Issue time exposes numeric keyboard attributes and filters input to six digits.
- Mobile numeric editors expose `inputMode="numeric"`, digit-only patterns, and field bounds.
- Typed numeric values update state and out-of-range values are clamped.
- Cloud amount exposes exactly the four ordered native options and updates cloud state.
- Existing minus/plus controls and desktop display markup remain present.

The full test suite, TypeScript build, and lint checks will run after implementation.
