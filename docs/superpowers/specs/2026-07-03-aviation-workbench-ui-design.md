# TAF Visual Builder — Aviation Workbench UI Design

Date: 2026-07-03  
Status: Approved design direction  
Branch: `feature/aviation-workbench-ui`

## 1. Objective

Redesign the existing TAF Visual Builder as an aviation workbench that serves both professional aviation meteorologists and aviation-weather learners. The redesign must improve visual hierarchy, consistency, readability, responsive behavior, and accessibility without changing any business rule, workflow, API, data structure, generated TAF behavior, or backend logic.

## 2. Scope and invariants

### In scope

- Page layout and responsive composition.
- Typography, spacing, colors, borders, shadows, and visual hierarchy.
- Consistent presentation of buttons, numeric controls, inputs, cards, tooltips, and feedback states.
- Semantic labels, focus states, keyboard visibility, and contrast.
- Presentation of the existing guided tour and light/dark theme controls.
- Sticky placement of the generated TAF on desktop.

### Explicitly out of scope

- Adding or removing features, fields, buttons, validation rules, or forecast types.
- Changing the order in which users complete the forecast.
- Changing any event handler or the action performed by an existing control.
- Changing TAF generation, weather utilities, time calculations, hooks, types, APIs, controllers, services, databases, or backend code.
- Introducing new persistence, submission, copy, export, syntax-validation, or status features.

The mockup uses phrases such as “Live” only to describe the existing real-time output behavior. It does not imply a new validation or network status.

## 3. Existing workflow analysis

The application is a single-page visual editor with this fixed workflow:

1. Enter the ICAO station code and six-digit UTC issue time.
2. Configure the base forecast for the calculated validity period.
3. Set wind, visibility/weather, and cloud layers.
4. Select a free range on the 24-hour timeline to create a change block.
5. Select an existing change block and configure its type and enabled weather sections.
6. Read the generated TAF, which updates as the editor state changes.
7. Optionally use the existing guided tour or light/dark theme toggle.

All of these steps and their sequence remain unchanged.

## 4. Current UI/UX findings

### Layout and hierarchy

- Every major section currently has similar visual weight, so context, editing, timeline, change selection, and output are harder to distinguish at a glance.
- Generated TAF appears after all editors, forcing desktop users to scroll between inputs and results.
- Nested cards use similar white backgrounds and rounded corners, weakening parent/child relationships.
- Desktop width is available but the principal editor still behaves mostly as a single vertical column.

### Spacing and alignment

- Compact controls are functional but labels, control widths, suffixes, and section headers do not follow one alignment grid.
- Weather and cloud controls wrap without a clear alignment system at intermediate widths.
- Section spacing is locally consistent but lacks a page-level rhythm that communicates stages.

### Typography and color

- Heading sizes are close together, producing limited hierarchy.
- Technical values and UTC times are not visually distinguished from descriptive interface text.
- The neutral palette does not strongly communicate an aviation workstation identity.
- Change-type colors are useful but need consistent tokens and sufficient contrast in both themes.

### Controls and feedback

- Icon-only actions need stronger visible focus and consistent accessible names.
- Numeric controls, inputs, type buttons, weather chips, and destructive actions look like separate systems.
- Existing validation text can compete with selected weather chips instead of occupying a stable feedback region.
- Disabled change sections rely heavily on opacity and grayscale, which reduces legibility.

### Accessibility

- Some visible field labels are implicit or placeholder-based rather than consistently explicit.
- Focus rings are not standardized across all interactive elements.
- Small targets and low-emphasis secondary text need review against touch target and contrast requirements.
- Color must not be the only signal for TEMPO, BECMG, and FM; text labels remain visible.

## 5. Considered design directions

### A. Aviation Workbench — selected

A structured main editor with sequentially numbered sections and a sticky generated-output rail on desktop. It balances fast professional scanning with clear guidance for learners.

### B. Guided Stage Panel

A prominent step indicator and lower information density. This is easier for first-time learners but makes repeated expert editing slower and risks implying a wizard flow that the current application does not have.

### C. Professional Monitoring Console

A dense, dark-first control surface. This supports expert scanning but increases the learning threshold and gives insufficient guidance to the mixed target audience.

## 6. Approved information architecture

Desktop uses a two-column workbench:

```text
┌──────────────────────────────────────────────────────────────────┐
│ TAF Visual Builder                         Tour   Theme           │
├───────────────────────────────────────────────┬──────────────────┤
│ 01 Forecast context                           │ 05 Generated TAF │
│ ICAO station            Issue time            │ live output      │
├───────────────────────────────────────────────┤ stays visible    │
│ 02 Base forecast                             │ while editing    │
│ Wind          Visibility & weather            │                  │
│ Cloud layers                                  │                  │
├───────────────────────────────────────────────┤                  │
│ 03 Forecast timeline                          │                  │
├───────────────────────────────────────────────┤                  │
│ 04 Selected change (when one is selected)     │                  │
│ Type, time, delete, existing weather controls │                  │
└───────────────────────────────────────────────┴──────────────────┘
```

The right rail is a presentation change only. `generateTAF(taf)` remains the only output source and continues to update through the existing React render cycle.

## 7. Component design

### Application header

- Use a deep aviation-navy header with the existing product name.
- Retain the guided-tour and theme-toggle buttons in their current order and with their current handlers.
- Give both icon controls a 40–44 px target, visible tooltip/title, accessible name, hover state, and focus-visible ring.
- Do not add navigation or account controls.

### Forecast context

- Rename the visible generic “Header” heading to “Forecast context”; this changes presentation copy only.
- Present ICAO and issue time as two labeled fields on desktop and a single column on narrow screens.
- Preserve the existing station and issue-time values, events, maximum length, numeric input behavior, and `Z` suffix.

### Base forecast

- Present the calculated validity period as secondary monospace metadata.
- Preserve Wind, Visibility/Weather, and Clouds in their current order.
- Use Wind and Visibility/Weather as a two-column group at wide widths; Clouds remains a full-width row below.
- Standardize label columns, numeric-control heights, unit suffixes, chip shapes, and feedback regions.
- Preserve every weather option, visibility range, cloud amount, cloud height, CB/TCU checkbox, and Add Layer action.

### Timeline

- Preserve all 24 hourly buttons, circular range behavior, pointer behavior, and current selection logic.
- Keep the TEMPO, BECMG, and FM legend with both text and color.
- Strengthen hover, selected, and keyboard-focus states without changing timeline semantics.
- Retain horizontal scrolling on smaller screens.

### Selected change

- Render only when `selectedChangeIndex !== null`, as it does today.
- Keep type switching, time range, delete action, and block activation/deactivation behavior unchanged.
- Visually separate the destructive delete action from change-type selection.
- Disabled blocks retain readable labels and expose the existing activation button; opacity alone is not used as the sole state indicator.

### Generated TAF

- Move the existing output card to the right column on desktop and make it sticky below the header.
- Keep the existing `<pre>` semantics, wrapping, and `generateTAF(taf)` content.
- Use a high-contrast dark code surface in both themes to make the forecast easy to scan.
- On Tablet and Mobile, place output after the editor content, preserving the current workflow order.
- Do not add copy, export, validation, readiness, or submission controls.

### Guided tour

- Retain the current tour trigger, step sequence, target IDs, sample data, cleanup behavior, and Intro.js logic.
- Update styling and target placement only as needed to match the new layout.
- Verify every tour tooltip remains visible at Desktop, Tablet, and Mobile widths.

## 8. Visual system

### Color roles

- Page background: cool gray-blue to reduce glare and separate white work surfaces.
- Primary shell: deep aviation navy.
- Primary interactive accent: accessible sky/steel blue.
- Text: dark slate with muted blue-gray secondary text.
- Surface borders: cool neutral gray with restrained shadows.
- TEMPO: amber; BECMG: green; FM: orange. Each state also retains a text label.
- Destructive actions: muted red with a stronger hover/focus state.

Exact values will be defined as CSS custom properties so light/dark themes and all components share one token source.

### Typography

- Continue using a system font stack; do not introduce an external font dependency.
- Use four clear levels: application title, section heading, block heading, field/help text.
- Use a system monospace stack for UTC values, timeline hours, and generated TAF.
- Maintain at least 14 px body text where practical; compact technical labels may use 12 px with sufficient contrast.

### Spacing and shape

- Use a 4 px base spacing scale with primary gaps of 8, 12, 16, 24, and 32 px.
- Use one consistent panel radius, one inner-block radius, and one control radius.
- Avoid decorative rounding on every nested element; hierarchy comes from spacing, border, and surface contrast.

## 9. Responsive behavior

### Desktop (primary, approximately 1024 px and above)

- Two-column layout: flexible editor plus approximately 340–380 px output rail.
- Generated TAF remains sticky while the user edits.
- Wind and Visibility/Weather share a row; Clouds spans the editor width.

### Tablet

- Collapse to one main column when the output rail would constrain controls.
- Preserve all section order and place Generated TAF after Selected Change.
- Wind and Visibility may stack when labels or controls would wrap poorly.

### Mobile

- Preserve the same workflow and content sequence.
- Stack fields and condition blocks.
- Keep the timeline horizontally scrollable and all buttons operable.
- Use full-width feedback messages and avoid clipped unit labels or action buttons.

No breakpoint introduces, removes, or reorders a functional step.

## 10. Accessibility requirements

- Associate every visible field label with its input through `htmlFor`/`id` or an equivalent accessible grouping.
- Preserve or improve existing `aria-label` and title text on icon-only controls.
- Provide a consistent, high-contrast `:focus-visible` ring for buttons, inputs, selects, checkboxes, and timeline cells.
- Maintain a minimum 44 px target where layout allows; compact numeric buttons must remain comfortably keyboard and pointer operable.
- Ensure text and essential controls meet WCAG AA contrast targets.
- Never rely on color alone for change types, errors, selected states, or disabled states.
- Preserve native keyboard behavior and logical DOM/tab order matching the visual workflow.
- Errors remain adjacent to the relevant control and are readable without displacing unrelated content.

## 11. State and data flow

No state or data-flow changes are planned.

- `TafBuilder` remains the page-level owner of `taf`, `selectedChangeIndex`, and `isDark`.
- Existing callbacks continue to update the same state fields.
- `ChangeEditor`, `Timeline`, `IssueTimeInput`, and weather-section component contracts remain unchanged unless a purely presentational prop is demonstrably required.
- All utilities under `src/utils`, domain constants, and TAF types remain behaviorally unchanged.
- Existing local-storage behavior for dark mode remains unchanged.

## 12. Error and feedback presentation

- Preserve the current visibility/weather validation condition and message text behavior.
- Give errors a dedicated inline region with icon-independent text, sufficient contrast, and stable spacing.
- Use hover, active, selected, disabled, and focus-visible states consistently across controls.
- Do not invent success toasts or syntactic-validity messages; the current application has no corresponding business state.

## 13. Verification criteria

### Functional regression

- Station and issue-time editing behave exactly as before.
- Base wind, visibility, weather, and cloud controls produce the same state changes.
- Timeline free-range selection, existing-change selection, and deselection behave exactly as before.
- TEMPO/BECMG/FM switching, block activation, cloud addition/removal, weather addition/removal, and change deletion behave exactly as before.
- Generated TAF text is identical for the same application state before and after the redesign.
- Guided-tour initialization, navigation, completion, and cleanup remain functional.
- Theme preference remains persisted in local storage.

### Visual and accessibility checks

- Inspect Desktop, Tablet, and Mobile breakpoints in light and dark themes.
- Verify no horizontal page overflow; timeline-only horizontal scrolling is allowed on smaller screens.
- Verify focus visibility and keyboard access across the full workflow.
- Verify labels, accessible names, color contrast, error placement, and selected/disabled states.
- Verify the sticky output does not obscure content and collapses correctly below the desktop breakpoint.

### Engineering checks

- `npm run lint` passes.
- `npm run build` passes.
- Any available component or interaction tests pass.
- Browser verification covers representative end-to-end editing and generated-output behavior.

## 14. Approved reference

The approved visual direction is “A. Aviation Workbench,” shown in the local visual-companion mockup generated during design review. The mockup is a design reference, not production code. Production implementation must reuse the current React components and preserve their existing behavior rather than copying mockup-only markup or introducing mockup-only features.
