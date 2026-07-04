# Tour Centered Highlight and Mobile Collapse Design

## Goal

Center and highlight each guided-tour target on desktop, and let mobile users temporarily collapse the tour card together with its overlay without losing progress.

## Desktop Steps

Every step runs a shared `before` hook that finds its target and calls `scrollIntoView` with smooth behavior, vertical centering, and nearest horizontal alignment. Joyride's own scroll is disabled to avoid a second competing movement. Steps are no longer marked fixed, because the forecast panels are normal document content. The overlay and spotlight remain active, so the centered target is highlighted.

## Mobile Collapse

`TourProvider` owns a collapse boolean. The tooltip reads this state through `TourContext` and renders a mobile-only toggle button. Expanded cards show a downward chevron above the full content. Collapsed cards hide the content and retain a compact bottom handle with an upward chevron.

While collapsed, Joyride receives `hideOverlay: true`. Expanding restores the overlay. Collapse does not change the active tour, step index, demo snapshot, or navigation state. Starting or finishing a tour and switching to desktop reset the card to expanded.

The card also supports vertical touch/pointer gestures. A predominantly vertical downward swipe of at least 40 px collapses an expanded card; an upward swipe of at least 40 px expands a collapsed card. Short gestures and gestures whose horizontal travel exceeds vertical travel do nothing, preserving normal taps and horizontal interaction. The arrow button and swipe gesture call the same state transition.

## Accessibility and Copy

The toggle is a real button with localized `Collapse guided tour` and `Expand guided tour` labels. Its `aria-expanded` value reflects card state. The decorative chevron is hidden from assistive technology.

## Testing

Tests cover the centered scroll helper, step configuration, overlay visibility, state reset, arrow and swipe behavior, gesture thresholds and direction filtering, localized labels, collapsed styling, and existing tour flows. Full tests, lint, and production build complete the verification.
