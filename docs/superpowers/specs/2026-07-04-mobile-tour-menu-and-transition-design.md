# Mobile Tour Menu and Transition Design

## Goal

Prevent the guided-tour menu from extending outside the mobile viewport and remove the visible flash between guided-tour steps.

## Root Causes

The tour launcher is the first of three actions in the mobile app bar. Its menu is absolutely positioned with `right: 0` relative to the launcher, so the language and theme buttons to its right shift the menu's right edge inward. A nearly viewport-wide menu therefore extends beyond the left edge and is clipped.

React Joyride deliberately sets its floater opacity to zero while positioning each new step and applies a 300 ms opacity transition. Its spotlight also adds a temporary cover path with a 200 ms opacity transition while the new target is measured. Because this application replaces the normal tooltip with a fixed bottom flight strip, those positioning transitions produce a visible flash without improving the tooltip placement.

## Mobile Menu Design

At `max-width: 639px`, the tour menu becomes viewport-fixed below the app bar:

- `top: 72px`
- `left: 12px`
- `right: 12px`
- automatic width
- maximum height limited to the remaining dynamic viewport height
- vertical scrolling inside the menu when required

Desktop positioning remains anchored to the tour launcher. Outside-click and Escape handling remain unchanged because the rendered menu stays inside `TourMenu`'s React and DOM ownership.

## Transition Design

The fixed flight-strip floater remains visible while Joyride changes targets. CSS overrides Joyride's transient inline opacity and transition for floaters containing the flight strip. The temporary spotlight cover path is kept transparent and its opacity transition is disabled, allowing the primary even-odd spotlight path to update directly.

Target measurement, spotlight highlighting, automatic target scrolling, navigation controls, focus handling, and overlay interaction behavior remain enabled. The change does not disable all application animation and does not modify desktop layout.

## Testing

Automated tests will verify:

- The mobile media query contains fixed tour-menu positioning with 12 px viewport insets, bounded height, and vertical overflow.
- The flight-strip floater is forced visible without an opacity transition.
- The temporary spotlight cover path cannot fade over the current spotlight.
- Existing menu open, selection, Escape, and tour navigation tests continue to pass.

The complete test suite, lint, and production build will run after implementation. Browser verification will be attempted when a local browser target is available; the current sandbox reports all local ports unavailable, so automated DOM and CSS verification remains the required fallback.
