# Mobile Native Picker Controls Design

## Goal

Replace mobile numeric keyboard entry for wind direction, wind speed, wind gust, and cloud height with operating-system-native picker controls. Keep cloud amount on the same native picker pattern and leave issue time on the numeric keyboard.

## Interaction

At the existing mobile breakpoint (`max-width: 639px`), tapping the center value opens a native `select` control. On iOS this appears as the system wheel picker associated with `UIPickerView`; other mobile operating systems use their native selection interface.

Picker values are:

- Wind direction: `0` through `360` in increments of `10`.
- Wind speed: `0` through `99` in increments of `1`, displayed as two digits.
- Wind gust: `0` through `99` in increments of `1`, displayed as two digits.
- Cloud amount: `FEW`, `SCT`, `BKN`, and `OVC`.
- Cloud height: `0` through `999` in increments of `1`, displayed as three digits.

Issue time remains a six-digit text input with a numeric mobile keyboard. Desktop controls retain the existing minus/value/plus interaction and existing ranges.

## Component Design

`NumericControl` will use one generalized mobile select API. Each option carries an explicit numeric value and a display label, allowing non-unit steps such as wind direction while preserving padded labels for speed, gust, and height.

The current mobile numeric-input mode and its parsing handler will be removed because no remaining `NumericControl` caller needs keyboard entry. Cloud amount will use explicit indexed values mapped to its four labels. All controls continue to update state through the existing `onChange` callbacks.

Option generation belongs in the field components:

- `WindSection` creates direction and two-digit speed option collections.
- `CloudSection` creates amount options and three-digit height options.
- Stable module-level constants prevent rebuilding the collections on every render.

No user-agent detection, custom wheel implementation, or third-party dependency is introduced.

## Error Handling and Compatibility

Every native option value is parsed as a number before reaching forecast state. The selected value must match an explicit option, so free-form invalid input is no longer possible for these fields on mobile.

Values already present in state remain valid because the picker ranges match the existing control ranges. The desktop minus and plus buttons and keyboard arrow behavior continue to use the existing `min`, `max`, and `step` constraints.

## Testing

Tests will verify:

- Wind direction provides 37 values from `0` to `360` with a step of `10`.
- Wind speed and gust each provide 100 values from `00` to `99`.
- Cloud amount provides `FEW`, `SCT`, `BKN`, and `OVC`.
- Cloud height provides 1,000 values from `000` to `999`.
- Selecting a non-index numeric option emits its explicit value.
- Issue time retains numeric keyboard attributes.
- Desktop spinbutton and minus/plus controls remain present.

The full test suite, lint, and production build will run after implementation.
