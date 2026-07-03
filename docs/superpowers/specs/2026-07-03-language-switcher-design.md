# English and Traditional Chinese Interface Design

## Goal

Add a language control to the upper-right application bar. Users can switch between English and Traditional Chinese (`zh-TW`) without losing their current forecast work. The selected language persists across reloads and future visits.

## Scope

Translate all user-facing application copy, including:

- Page headings, section headings, descriptions, field labels, empty states, helper text, buttons, tooltips, and accessibility labels.
- Generated-output metadata labels and explanatory text.
- Guided-tour menu labels, tour names and descriptions, every tour step, tour controls, and the completion dialog.
- Theme-control and language-control labels.

Do not translate aviation-standard syntax or values. `TAF`, `ICAO`, `BECMG`, `TEMPO`, `FM`, weather codes, cloud amount codes, units, time formats, and the generated TAF message remain unchanged.

## User Experience

The application bar gains a globe icon button beside the existing guided-tour and theme controls. Activating it opens a compact menu with two options:

- English
- 繁體中文

The current option is visually and semantically identified. Selecting an option immediately updates the interface and closes the menu. The menu supports pointer interaction, keyboard focus, Escape to close and restore trigger focus, and outside-click dismissal. Its light and dark appearances follow the existing application-bar and guided-tour menu styles.

Changing language must not recreate or clear the current TAF editor state. If a guided tour is active, its current step remains active and its content changes to the selected language.

## Architecture

Create a small localization module owned by the application rather than introducing a third-party dependency. It contains:

- A `Language` union of `en | zh-TW`.
- A typed English dictionary that defines the complete translation-key shape.
- A Traditional Chinese dictionary satisfying the same shape at compile time.
- A localization context/provider that exposes the current language, a language setter, and translation data.
- Local-storage initialization and persistence under a dedicated key.

English remains the fallback when storage is unavailable or contains an unsupported value. The provider also updates the document `lang` attribute to `en` or `zh-Hant-TW`.

Components consume localized copy from the context. Copy that needs runtime values, such as the number of change blocks or a timeline hour, is represented by typed formatter functions rather than string replacement in components.

Tour definitions become a function of the active language or localized dictionary. Tour IDs, target selectors, and control flow remain language-independent, so language changes cannot alter tour behavior or editor state.

## Components

### Language Provider

Owns language state, validates the stored value, persists changes, updates the document language, and provides localized copy. It is mounted high enough to serve both the workbench and `TourProvider`.

### Language Menu

Owns only open/closed state and menu focus behavior. It receives the active language and selection callback from the localization context. It follows the interaction pattern already used by `TourMenu` and uses distinct element IDs and accessible labels.

### Existing Interface

Existing form and output components replace embedded English copy with typed dictionary values. Component APIs should remain focused: components that already consume context can localize themselves; no language prop is threaded through the entire tree.

### Guided Tours

The tour catalog, tooltip controls, Joyride locale, and exit dialog consume the same localization source. An active tour recomputes displayed step content when language changes while preserving the tour ID and step index.

## Persistence and Failure Handling

- Default to English when no language has been saved.
- Accept only `en` and `zh-TW` from local storage.
- Ignore storage read/write failures and continue with in-memory state.
- Never infer language from browser locale; the user explicitly chooses it.
- Preserve all TAF data, selected change, theme state, and active tour state during language changes.

## Testing

Use test-driven development for implementation. Automated tests cover:

- Default English rendering and invalid-storage fallback.
- Restoring `zh-TW` from local storage and persisting user selection.
- Opening and closing the language menu, selecting both options, Escape behavior, and current-selection semantics.
- Representative strings from the page shell, editor sections, controls, output summary, and accessibility labels.
- Traditional Chinese tour catalog content, tooltip controls, Joyride locale, and completion dialog.
- Switching language without clearing editor data and while a tour is active.
- Existing tests continuing to pass in the default English language.

Run the focused localization tests first, followed by the complete test, lint, and build commands.

## Out of Scope

- Additional languages.
- Browser-locale auto-detection.
- Translation of generated aviation messages or meteorological codes.
- Remote translation services or runtime-loaded translation files.
- URL-based locale routing.
