# English and Traditional Chinese Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent English/Traditional Chinese language menu that localizes the complete workbench and guided-tour experience without changing aviation codes or editor state.

**Architecture:** A dependency-free localization provider owns the `en | zh-TW` state, validated persistence, document language, and a compile-time checked dictionary. UI and tour components read the dictionary through context; stable tour IDs and selectors remain separate from translated content so language changes preserve active behavior.

**Tech Stack:** React 19, TypeScript 5.9, Vite, Vitest, Testing Library, CSS

---

## File Map

- Create `src/features/i18n/translations.ts`: language type, English source dictionary, Traditional Chinese dictionary, and formatter functions.
- Create `src/features/i18n/LanguageContext.ts`: typed context and `useLanguage` hook.
- Create `src/features/i18n/LanguageProvider.tsx`: persisted language state and document `lang` synchronization.
- Create `src/features/i18n/LanguageProvider.test.tsx`: persistence, fallback, and document-language tests.
- Create `src/features/i18n/LanguageMenu.tsx`: accessible app-bar language menu.
- Create `src/features/i18n/LanguageMenu.test.tsx`: menu interaction and focus tests.
- Modify `src/main.tsx`: mount the localization provider above the application.
- Modify `src/TafBuilder.tsx` and `src/TafBuilder.test.tsx`: app-shell translations, menu integration, state-preservation coverage.
- Modify `src/components/{ChangeEditor,CloudSection,GeneratedTafOutput,IssueTimeInput,Timeline,VisibilitySection,WindSection}.tsx`: localize visible and accessible copy.
- Modify `src/components/buttons/{ChangeDeleteButton,CloudDeleteButton,TypeButton}.tsx` and `src/components/inputs/NumericControl.tsx`: localize actions and tooltips.
- Modify `src/features/tour/{TourMenu,TourProvider,FlightStripTooltip,tourDefinitions}.tsx`: localize the complete tour flow.
- Modify corresponding tour tests and `src/index.css`: translated-tour assertions and menu styling.

### Task 1: Localization Core and Persistence

**Files:**
- Create: `src/features/i18n/translations.ts`
- Create: `src/features/i18n/LanguageContext.ts`
- Create: `src/features/i18n/LanguageProvider.tsx`
- Test: `src/features/i18n/LanguageProvider.test.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Write failing provider tests**

Create tests that render a context probe and verify default English, restored Traditional Chinese, invalid-value fallback, persistence, and document language:

```tsx
function Probe() {
  const { language, setLanguage, text } = useLanguage();
  return <button onClick={() => setLanguage("zh-TW")}>{language}:{text.app.pageTitle}</button>;
}

test("defaults to English and switches persistently to Traditional Chinese", async () => {
  render(<LanguageProvider><Probe /></LanguageProvider>);
  expect(screen.getByRole("button")).toHaveTextContent("en:Create Terminal Aerodrome Forecast");
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByRole("button")).toHaveTextContent("zh-TW:建立機場終端預報");
  expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-TW");
  expect(document.documentElement.lang).toBe("zh-Hant-TW");
});

test("restores only supported stored languages", () => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, "unsupported");
  render(<LanguageProvider><Probe /></LanguageProvider>);
  expect(screen.getByRole("button")).toHaveTextContent(/^en:/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/features/i18n/LanguageProvider.test.tsx`

Expected: FAIL because the i18n modules do not exist.

- [ ] **Step 3: Implement the typed dictionary and context**

Define these public contracts, with the complete English object as the dictionary shape and `zh-TW` checked against it:

```ts
export type Language = "en" | "zh-TW";
export const LANGUAGE_STORAGE_KEY = "taf-language";

export const en = {
  app: { title: "TAF Visual Builder", subtitle: "Aviation Weather Workbench", pageTitle: "Create Terminal Aerodrome Forecast" },
  language: { open: "Choose language", menu: "Languages", english: "English", traditionalChinese: "Traditional Chinese" },
  theme: { light: "Switch to light mode", dark: "Switch to dark mode" },
  sections: {
    context: { title: "Forecast context", description: "Identify the aerodrome and forecast issue time." },
    base: { title: "Base forecast", description: "Set prevailing conditions for the full validity period." },
    timeline: { title: "Forecast timeline", description: "Select a start and end hour to create a change block." },
    selectedChange: { title: "Selected change", description: "Fine-tune the conditions that change in this period." },
    output: { title: "Generated TAF", description: "Updates live as conditions change." },
  },
  fields: { station: "ICAO station code", stationPlaceholder: "ICAO Code", issueTime: "Issue time · DDHHMM" },
  conditions: conditionEnglishCopy,
  output: outputEnglishCopy,
  tour: tourEnglishCopy,
  actions: { increase: "Increase value", decrease: "Decrease value", selectHour: (hour: string) => `Select ${hour}Z` },
};

export type Translation = typeof en;
export const zhTW = traditionalChineseCopy satisfies Translation;
export const translations: Record<Language, Translation> = { en, "zh-TW": zhTW };
```

Define `conditionEnglishCopy`, `outputEnglishCopy`, `tourEnglishCopy`, and `traditionalChineseCopy` directly above these exports. They must enumerate every literal found by the final scan: condition titles and fields; activate/deactivate/add/remove/error/space copy; output metadata/note/live/count; four tour catalog entries; all nine quick-start steps; six tour controls; and all exit-dialog strings. Do not use index fallback at runtime: both language objects must be complete before export.

For formatter functions, widen return values in the source shape so Chinese functions are type-compatible; for example declare `blocks: (count: number): string => ...` rather than preserving a string-literal return type.

Define context without a nullable public API:

```ts
export interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  text: Translation;
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
```

The provider catches storage failures, accepts only `en` and `zh-TW`, writes changes in an effect, and maps document language to `en` or `zh-Hant-TW`. Wrap `<TafBuilder />` with `<LanguageProvider>` in `src/main.tsx`.

- [ ] **Step 4: Run provider tests and verify GREEN**

Run: `npm test -- src/features/i18n/LanguageProvider.test.tsx`

Expected: all provider tests PASS with no warnings.

- [ ] **Step 5: Commit the localization core**

```bash
git add src/features/i18n/translations.ts src/features/i18n/LanguageContext.ts src/features/i18n/LanguageProvider.tsx src/features/i18n/LanguageProvider.test.tsx src/main.tsx
git commit -m "feat: add persistent localization provider"
```

### Task 2: Accessible Language Menu

**Files:**
- Create: `src/features/i18n/LanguageMenu.tsx`
- Test: `src/features/i18n/LanguageMenu.test.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write failing menu behavior tests**

```tsx
test("selects Traditional Chinese and closes the menu", () => {
  render(<LanguageProvider><LanguageMenu /></LanguageProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Choose language" }));
  expect(screen.getByRole("menu", { name: "Languages" })).toBeVisible();
  fireEvent.click(screen.getByRole("menuitemradio", { name: "繁體中文" }));
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("zh-TW");
});

test("Escape closes the menu and returns focus", () => {
  render(<LanguageProvider><LanguageMenu /></LanguageProvider>);
  const trigger = screen.getByRole("button", { name: "Choose language" });
  fireEvent.click(trigger);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(trigger).toHaveFocus();
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/features/i18n/LanguageMenu.test.tsx`

Expected: FAIL because `LanguageMenu` does not exist.

- [ ] **Step 3: Implement the menu**

Use the same outside-pointer and Escape cleanup pattern as `TourMenu`. Render a globe SVG trigger with `aria-haspopup="menu"`, and menu options with `role="menuitemradio"` and `aria-checked={language === option.value}`:

```tsx
const options = [
  { value: "en" as const, label: "English" },
  { value: "zh-TW" as const, label: "繁體中文" },
];

{open && <div id="language-menu" className="language-menu" role="menu" aria-label={text.language.menu}>
  {options.map((option) => <button key={option.value} role="menuitemradio"
    aria-checked={language === option.value}
    onClick={() => { setLanguage(option.value); setOpen(false); }}>
    <span>{option.label}</span><i aria-hidden="true">{language === option.value ? "✓" : ""}</i>
  </button>)}
</div>}
```

Add `.language-menu-root` and `.language-menu` styles by sharing dimensions, border, shadow, focus-visible, dark-mode, mobile, and reduced-motion rules with `.tour-menu`, while keeping distinct selectors and IDs.

- [ ] **Step 4: Run menu tests and verify GREEN**

Run: `npm test -- src/features/i18n/LanguageMenu.test.tsx`

Expected: all language-menu tests PASS.

- [ ] **Step 5: Commit the language menu**

```bash
git add src/features/i18n/LanguageMenu.tsx src/features/i18n/LanguageMenu.test.tsx src/index.css
git commit -m "feat: add accessible language menu"
```

### Task 3: Localize the Workbench and Condition Editors

**Files:**
- Modify: `src/TafBuilder.tsx`
- Modify: `src/TafBuilder.test.tsx`
- Modify: `src/components/ChangeEditor.tsx`
- Modify: `src/components/CloudSection.tsx`
- Modify: `src/components/GeneratedTafOutput.tsx`
- Modify: `src/components/IssueTimeInput.tsx`
- Modify: `src/components/Timeline.tsx`
- Modify: `src/components/VisibilitySection.tsx`
- Modify: `src/components/WindSection.tsx`
- Modify: `src/components/buttons/ChangeDeleteButton.tsx`
- Modify: `src/components/buttons/CloudDeleteButton.tsx`
- Modify: `src/components/buttons/TypeButton.tsx`
- Modify: `src/components/inputs/NumericControl.tsx`

- [ ] **Step 1: Add failing end-to-end component assertions**

Extend the `TafBuilder` test helper to wrap the builder in `LanguageProvider`, then verify representative shell, editor, output, dynamic, and accessible strings after selecting Chinese:

```tsx
test("switches the complete workbench to Traditional Chinese without clearing editor data", () => {
  renderBuilder();
  fireEvent.change(screen.getByLabelText("ICAO station code"), { target: { value: "RCTP" } });
  fireEvent.click(screen.getByRole("button", { name: "Choose language" }));
  fireEvent.click(screen.getByRole("menuitemradio", { name: "繁體中文" }));

  expect(screen.getByRole("heading", { name: "建立機場終端預報" })).toBeVisible();
  expect(screen.getByLabelText("ICAO 機場代碼")).toHaveValue("RCTP");
  expect(screen.getByText("基本預報")).toBeVisible();
  expect(screen.getByText("風向")).toBeVisible();
  expect(screen.getByText("能見度與天氣現象")).toBeVisible();
  expect(screen.getByText("雲層")).toBeVisible();
  expect(screen.getByText("已設定")).toBeVisible();
  expect(screen.getByRole("button", { name: "切換至淺色模式" })).toBeVisible();
});
```

Add focused assertions for translated validation, add/delete controls, numeric increase/decrease labels, type-switch tooltip, timeline hour labels, output block-count grammar, and the fact that TAF/ICAO/TEMPO/BECMG/FM/KT/CB/TCU remain unchanged.

- [ ] **Step 2: Run the workbench test and verify RED**

Run: `npm test -- src/TafBuilder.test.tsx`

Expected: FAIL on missing menu and untranslated Chinese strings.

- [ ] **Step 3: Localize the shell and mount the menu**

In `TafBuilder`, call `const { text } = useLanguage()`, render `<LanguageMenu />` in `.workbench-actions`, and replace shell literals with dictionary fields. Keep TAF state hooks above no new keyed wrapper so language changes do not remount the editor.

- [ ] **Step 4: Localize editor components**

In each listed component, call `useLanguage()` and replace only human-language literals. Preserve standards and units. For dynamic labels, call typed functions:

```tsx
aria-label={text.actions.selectHour(String(h).padStart(2, "0"))}
aria-label={text.conditions.addWeather(opt.code === " " ? text.conditions.space : opt.code)}
<dd>{text.output.blocks(changeCount)}</dd>
```

Use `language === "zh-TW" ? "zh-TW" : "en-US"` for human-readable visibility number formatting. Do not change the generated TAF string or aviation-token highlighting.

- [ ] **Step 5: Run the workbench test and verify GREEN**

Run: `npm test -- src/TafBuilder.test.tsx`

Expected: all workbench tests PASS and the entered station remains `RCTP` after switching.

- [ ] **Step 6: Commit workbench localization**

```bash
git add src/TafBuilder.tsx src/TafBuilder.test.tsx src/components src/features/i18n/translations.ts
git commit -m "feat: localize TAF workbench"
```

### Task 4: Localize Guided Tours

**Files:**
- Modify: `src/features/tour/tourDefinitions.tsx`
- Modify: `src/features/tour/tourDefinitions.test.tsx`
- Modify: `src/features/tour/TourMenu.tsx`
- Modify: `src/features/tour/TourMenu.test.tsx`
- Modify: `src/features/tour/TourProvider.tsx`
- Modify: `src/features/tour/TourProvider.test.tsx`
- Modify: `src/features/tour/FlightStripTooltip.tsx`
- Modify: `src/features/tour/FlightStripTooltip.test.tsx`
- Modify: `src/features/i18n/translations.ts`

- [ ] **Step 1: Write failing Traditional Chinese tour tests**

Change `getTourSteps` to accept localized tour copy and assert stable IDs with translated content:

```tsx
test("returns Traditional Chinese steps without changing tour identity", () => {
  const steps = getTourSteps("quick-start", false, zhTW.tour);
  expect(steps[0]).toMatchObject({
    id: "forecast-context",
    target: '[data-tour-id="context"]',
    title: "預報基本資料",
  });
  expect(steps.at(-1)?.title).toBe("產生的 TAF");
});
```

Add provider/menu/tooltip tests that expect `導覽說明`, `略過`, `上一步`, `下一步`, `完成`, catalog descriptions, and the translated completion dialog. Add a provider test that switches language during an active tour and checks the current step remains selected while its title changes.

- [ ] **Step 2: Run tour tests and verify RED**

Run: `npm test -- src/features/tour`

Expected: FAIL because tour components and definitions still embed English.

- [ ] **Step 3: Separate stable tour structure from localized copy**

Keep IDs, groups, target selectors, and slices in `tourDefinitions.tsx`. Build labels/descriptions/titles/content from `text.tour`:

```ts
export function getTourCatalog(copy: Translation["tour"]): TourDefinition[] {
  const steps = getQuickStartSteps(copy);
  return [
    { id: "quick-start", group: "quick-start", label: copy.catalog.quickStart.label, description: copy.catalog.quickStart.description, steps },
    { id: "new-features", group: "new-features", label: copy.catalog.newFeatures.label, description: copy.catalog.newFeatures.description, steps: steps.slice(5) },
    { id: "topic-timeline", group: "topic-help", label: copy.catalog.timeline.label, description: copy.catalog.timeline.description, steps: steps.slice(5, 8) },
    { id: "topic-output", group: "topic-help", label: copy.catalog.output.label, description: copy.catalog.output.description, steps: steps.slice(8) },
  ];
}
export function getTourSteps(id: TourId, isMobile: boolean, copy: Translation["tour"]): GuidedTourStep[] {
  const definition = getTourCatalog(copy).find((tour) => tour.id === id);
  return definition?.steps.map((step) => ({ ...step, content: isMobile && step.mobileContent ? step.mobileContent : step.content })) ?? [];
}
```

Implement `getQuickStartSteps(copy)` by moving the existing nine step objects unchanged and replacing each English `title`, `content`, and `mobileContent` with its corresponding `copy.steps.<stepId>` field. This retains the exact existing IDs and target selectors while making every displayed value language-dependent.

Update catalog validation tests to call `getTourCatalog(en.tour)`.

- [ ] **Step 4: Localize all tour presentation**

Use `useLanguage()` in `TourMenu`, `TourProvider`, and `FlightStripTooltip`. Pass translated strings to Joyride:

```tsx
locale={{
  back: text.tour.controls.back,
  close: text.tour.controls.close,
  last: text.tour.controls.done,
  next: text.tour.controls.next,
  open: text.tour.controls.open,
  skip: text.tour.controls.skip,
}}
```

Include `text.tour` in the step `useMemo` dependency list. Do not key or recreate `Joyride`; recomputing the same stable step list preserves active tour identity and index.

- [ ] **Step 5: Run tour tests and verify GREEN**

Run: `npm test -- src/features/tour`

Expected: all tour tests PASS in English and Traditional Chinese.

- [ ] **Step 6: Commit tour localization**

```bash
git add src/features/tour src/features/i18n/translations.ts
git commit -m "feat: localize guided tours"
```

### Task 5: Full Verification and Cleanup

**Files:**
- Modify only files required to fix failures found below.

- [ ] **Step 1: Scan for remaining embedded English UI copy**

Run:

```bash
rg -n '>[A-Za-z]|aria-label="[A-Za-z]|title="[A-Za-z]|placeholder="[A-Za-z]' src --glob '*.tsx' --glob '!*.test.tsx'
```

Expected: remaining matches are aviation standards, SVG metadata, or values explicitly documented as untranslated. Move every other human-language literal into the typed dictionary and add a focused assertion for it.

- [ ] **Step 2: Run all tests**

Run: `npm test`

Expected: all tests PASS with no unhandled errors or React warnings.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: TypeScript and Vite build complete successfully.

- [ ] **Step 5: Review the final diff around existing work**

Run these commands separately:

```bash
git status --short
git diff --check
git diff --stat
```

Expected: no whitespace errors; only planned localization files plus pre-existing user changes appear. Confirm no existing guided-tour edits were reverted.

- [ ] **Step 6: Commit verification fixes, if any**

Stage each concrete file reported by `git status --short` that was changed solely to repair verification, then run `git commit -m "test: complete localization coverage"`.

Skip this commit when verification required no code changes.
