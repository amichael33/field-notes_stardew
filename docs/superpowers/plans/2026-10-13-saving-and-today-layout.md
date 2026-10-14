# Saving and Today Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist progress, notes and the route choice in the browser, with JSON export/import, and rebuild the Today page as the dashboard layout from the mockup.

**Architecture:** A pure `src/state/save.ts` module defines the versioned `SaveData` shape and its parse/toggle/serialize functions. A `SaveProvider` context wraps it with localStorage and exposes `useSave()`. The Today page is split into small components under `src/components/today/` that read saved state and the existing JSON data through selectors.

**Tech Stack:** Vite, React 18, TypeScript, react-router-dom (HashRouter), Vitest, @testing-library/react, @testing-library/user-event.

**Spec:** `docs/superpowers/specs/2026-10-13-saving-and-today-layout-design.md`

## Global Constraints

- No backend, no logins. Saved state is one object in localStorage under the key `field-notes-save`.
- `season` stays unsaved UI state in `AppState`. `route` moves into the saved profile.
- Fonts are unchanged (Fisherman headings stay). Other mockup styling follows the spec: colors `#EEF1E6` page, `#1F3B2D` / `#2D5240` forest, `#F0B33D` amber, `#3C7A4F` done green, `#2F6690` rain blue, `#8A3B00` warning brown, `#D3D9C6` card border; card radius 10, padding 20; max width 1280.
- One breakpoint, 900px. All buttons and chips have a 44px minimum height.
- The ribbon's 7 milestones are the path steps with `order` 1 to 7 from `path-steps.json`.
- Views reach data only through selectors in `src/data/selectors.ts`.
- Print hides the header, banner controls and weather toggle, and stacks cards in one column on white.
- Out of scope: working clock, weather, villager schedules, farm layout, checkable bundle items.

## Review Focus

1. localStorage missing, corrupt or throwing: the app loads with defaults, does not crash, and shows "Couldn't save" on write failure (Tasks 1 and 2).
2. Import of a file with a newer `version` or wrong types: rejected with a clear message, data unchanged (Tasks 1 and 3).
3. All 7 ribbon steps ticked: shows "7 of 7" and no crash with no "next up" row (Task 4).
4. Every step ticked: "Next goal" shows its empty state (Task 5).
5. A very long note: saves and the card does not overflow its column (Task 5).

---

## File Structure

- `src/state/save.ts`, `save.test.ts`: pure save-data functions
- `src/state/SaveContext.tsx`: `SaveProvider`, `useSave`
- `src/data/selectors.ts` (modify): `peopleToVisit`, `firstUnchecked`
- `src/components/today/{StatusBanner,PathRibbon,PathCard,NotesCard,NextGoalCard,NeededCard,WhereCard}.tsx`
- `src/components/Layout.tsx` (modify): Export and Import
- `src/views/PathView.tsx`, `src/views/NotesView.tsx`, `src/state/AppState.tsx`, `src/components/RouteToggle.tsx`, `src/views/BundlesView.tsx`, `src/test-utils.tsx`, `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `README.md` (modify)

### Task 1: Save data module

**Files:**
- Create: `src/state/save.ts`, `src/state/save.test.ts`
- Modify: `src/data/types.ts`

**Interfaces:**
- Produces in `types.ts`: `interface SaveData { version: 1; profile: { route: Route; farmType: string }; checked: string[]; notes: string }`
- Produces in `save.ts`:
  - `defaultSave(): SaveData` (route `'community-center'`, farmType `'standard'`, `checked: []`, `notes: ''`)
  - `parseSave(json: string): { ok: true; data: SaveData } | { ok: false; error: string }`
  - `toggleChecked(save: SaveData, id: string): SaveData` (returns a new object, input not mutated)
  - `serializeSave(save: SaveData): string`

- [ ] **Step 1: Write failing tests** in `save.test.ts` (each name is a test):
  - `defaultSave has the community-center route and no progress`
  - `toggleChecked adds then removes an id without mutating the input`
  - `serializeSave then parseSave round-trips`
  - `parseSave rejects text that is not JSON` (`ok: false`, non-empty `error`)
  - `parseSave rejects a newer version` (`version: 2`, error mentions "newer")
  - `parseSave rejects wrong field types` (e.g. `checked: 'path:1'`, `profile.route: 'moon'`, `notes: 5`)
- [ ] **Step 2: Run** `npm test -- save`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** the type and the four functions. `parseSave` validates every field of the shape by hand (no library) and never throws.
- [ ] **Step 4: Run** `npm test -- save`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add versioned save data module`

### Task 2: SaveProvider and route moves into the profile

**Files:**
- Create: `src/state/SaveContext.tsx`, `src/state/SaveContext.test.tsx`
- Modify: `src/state/AppState.tsx`, `src/components/RouteToggle.tsx`, `src/views/BundlesView.tsx`, `src/test-utils.tsx`, `src/main.tsx`, `src/App.tsx`, `src/test-setup.ts`

**Interfaces:**
- Consumes: Task 1 functions.
- Produces: `SaveProvider({ children })` and `useSave(): { save: SaveData; setRoute(r: Route): void; toggle(id: string): void; setNotes(text: string): void; importSave(json: string): { ok: true } | { ok: false; error: string }; exportSave(): string; saveError: boolean }`. `AppState` loses `route`/`setRoute` and keeps `season`/`setSeason`.

- [ ] **Step 1: Write failing tests** in `SaveContext.test.tsx`:
  - `starts from defaults when localStorage is empty`
  - `loads saved data from localStorage` (pre-seed key `field-notes-save`)
  - `falls back to defaults when stored data is corrupt` (value `'{nope'`)
  - `persists a toggle to localStorage`
  - `survives localStorage.getItem throwing` (spy throws; renders defaults)
  - `sets saveError when localStorage.setItem throws`
  - `importSave rejects bad data and leaves the save unchanged`
- [ ] **Step 2: Run** `npm test -- SaveContext`. Expected: FAIL.
- [ ] **Step 3: Implement** `SaveProvider` (load once with try/catch, write on change with try/catch setting `saveError`) and `useSave` (throws outside the provider). Remove `route` from `AppState`; `RouteToggle` and `BundlesView` read and set route through `useSave`.
- [ ] **Step 4: Update test harness.** `renderWithState` in `test-utils.tsx` wraps in `SaveProvider` as well. `test-setup.ts` clears `localStorage` in `afterEach`. `main.tsx` and `App.tsx` wrap the app in `SaveProvider`. Update existing tests that set the route via the Route select. They must still pass without edits to their assertions.
- [ ] **Step 5: Run** `npm test`. Expected: all PASS. Run `npm run build`. Expected: succeeds.
- [ ] **Step 6: Commit** `feat: add SaveProvider and persist the route choice`

### Task 3: Export and Import in the header

**Files:**
- Modify: `src/components/Layout.tsx`, `src/styles.css`
- Create: `src/components/Layout.test.tsx`

**Interfaces:**
- Consumes: `useSave().{exportSave, importSave, saveError}`.
- Produces: header buttons `Export` and `Import` after `Print page`. Export downloads `field-notes-save.json`. Import opens a file input (accessible name `Import save file`, visually hidden) and shows a status message with `role="status"` under the header actions.

- [ ] **Step 1: Write failing tests** in `Layout.test.tsx` (render `Layout` inside `MemoryRouter` with `SaveProvider`):
  - `Export builds a download with the stored JSON` (spy on `URL.createObjectURL`; assert the Blob text equals `exportSave()`)
  - `Import replaces the save from a valid file` (upload a File with a ticked `path:1`; status says "Imported")
  - `Import shows an error for invalid JSON and keeps data` (status role contains the parse error; `checked` unchanged)
  - `Import rejects a newer version file` (status mentions "newer")
  - `shows Couldn't save when storage writes fail`
- [ ] **Step 2: Run** `npm test -- Layout`. Expected: FAIL.
- [ ] **Step 3: Implement** the buttons and handlers in `Layout.tsx` (Blob + temporary anchor for download; `FileReader`/`file.text()` for import).
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add export and import of saved progress`

### Task 4: Path selectors, ribbon, banner and path card

**Files:**
- Modify: `src/data/selectors.ts`, `src/data/selectors.test.ts`, `src/views/PathView.tsx`, `src/views/PathView.test.tsx`, `src/styles.css`
- Create: `src/components/today/{StatusBanner,PathRibbon,PathCard}.tsx`

**Interfaces:**
- Produces in `selectors.ts`:
  - `pathId(step: PathStep): string` returns `` `path:${step.order}` ``
  - `firstUnchecked(steps: PathStep[], checked: string[]): PathStep | undefined` (steps in `order`)
- `StatusBanner({ nextStep }: { nextStep?: PathStep })`: dark card; shows the season and day of `nextStep` as "Spring 2" (or the season alone) and falls back to "Opening route" when none; the clock block, Pause, -10, +10, Resync and a Sunny/Rain segmented toggle are `disabled` with the text "coming with the clock".
- `PathRibbon({ steps })` takes the 7 steps; header "x of 7 on track"; each chip is a button with `aria-pressed` that calls `useSave().toggle`.
- `PathCard({ steps })`: title row with a `done/total` tag, a static rain-day banner, ordered list (`aria-label="Path steps"`), each row a grid with the season/day label, a checkbox labelled with the step title, and the existing "Rainy day" badge. Done rows carry class `done`; the first unchecked row carries class `next`.

- [ ] **Step 1: Write failing tests.**
  - selectors: `firstUnchecked returns the lowest order step not checked`; `firstUnchecked returns undefined when all are checked`.
  - PathView: `ticking a row marks it done and moves next-up` (the checked row has class `done`, the following row gets `next`); `ribbon shows 0 of 7 on track then 1 of 7 after a tick`; `ticking a ribbon chip ticks the matching path row`; `shows 7 of 7 and no next-up row when all seven ribbon steps and the rest are ticked`; `clock and weather controls are disabled`; keep the existing three PathView tests and the heading test (updating the "Live day tracking" text to the new banner copy).
- [ ] **Step 2: Run** `npm test -- selectors PathView`. Expected: FAIL.
- [ ] **Step 3: Implement** the selectors and the three components, and compose them in `PathView.tsx` as the mockup structure (banner, ribbon, grid, recipes below). Add CSS for banner, ribbon (7 columns, 4 at 900px), the two-column `minmax(0,1.55fr) minmax(0,1fr)` grid (one column at 900px), the `78px 1fr` row grid, `done` at 65% opacity and `next` with a 2px amber border and pale amber background.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add today banner, ribbon and checkable path card`

### Task 5: Aside cards and conditional "Where is everyone"

**Files:**
- Modify: `src/data/selectors.ts`, `src/data/selectors.test.ts`, `src/views/PathView.tsx`, `src/views/PathView.test.tsx`, `src/styles.css`
- Create: `src/components/today/{NotesCard,NextGoalCard,NeededCard,WhereCard}.tsx`

**Interfaces:**
- Produces in `selectors.ts`: `peopleToVisit(steps: PathStep[], checked: string[], villagers: Villager[]): { who: string; step: PathStep }[]`. It returns `[]` when step order 2 is checked. Otherwise, for each unchecked step, one entry per villager name found as a whole word in its title or detail, plus owners of phrases matching `<Name>'s ... (Shop|Store)`, de-duplicated per (who, step).
- Aside order in `PathView`: `NotesCard`, `NextGoalCard`, `NeededCard`, `WhereCard`.
- `NotesCard`: heading "Notes for tomorrow", labelled textarea bound to `useSave().notes`, `overflow-wrap: anywhere`.
- `NextGoalCard`: first unchecked step with `order` 9 or 10; empty state "All goals done" when none.
- `NeededCard`: uses `bundleItemsBySeason` and the season filter; per bundle a name and "0 of N" count, a progress bar, "Still needed" list. Joja route renders "Bundles are not used on the Joja route." Empty season renders "No bundle items available this season."
- `WhereCard`: heading "Where is everyone"; renders nothing when `peopleToVisit` is empty; otherwise a list of `who: step title (label)` and the note "Locations by time come with the schedule data."

- [ ] **Step 1: Write failing tests.**
  - selectors: `peopleToVisit finds a villager named in an unchecked step` (Willy via the fishing step); `peopleToVisit attributes a shop phrase to its owner` (Pierre from "Pierre's General Store"); `peopleToVisit is empty once step 2 is checked`; `peopleToVisit ignores checked steps`; `peopleToVisit is empty when no step mentions anyone` (inject steps with none).
  - PathView: `aside cards appear in order: Notes for tomorrow, Next goal, Needed this season, Where is everyone` (compare heading order); `Where is everyone hides after Meet the town is ticked`; `Next goal shows All goals done when steps 9 and 10 are ticked`; `notes persist across a remount` (type, unmount, render again, same text); `a very long unbroken note stays in the textarea` (value equals input); `Needed this season shows the Joja message on the Joja route`; `Needed this season respects the season filter`.
- [ ] **Step 2: Run** `npm test -- selectors PathView`. Expected: FAIL.
- [ ] **Step 3: Implement** `peopleToVisit` (case-sensitive whole-word match on villager names, `RegExp` escaped) and the four cards; compose in the aside. Style the cards with the mockup card styles and progress bar.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add today aside cards`

### Task 6: Notes tab, print rules, README

**Files:**
- Create: `src/views/NotesView.tsx`, `src/views/NotesView.test.tsx`
- Modify: `src/App.tsx`, `src/styles.css`, `README.md`

**Interfaces:**
- Produces: `NotesView` default export, `<h1>Notes</h1>` and a large textarea labelled "Notes" bound to the same `useSave().notes`, registered on `/notes` replacing the ComingSoon route.

- [ ] **Step 1: Write failing test** `NotesView edits the same note the Today card shows` (type in `NotesView`, remount `PathView`, see the text in the Today textarea).
- [ ] **Step 2: Run** `npm test -- NotesView`. Expected: FAIL.
- [ ] **Step 3: Implement** `NotesView` and the route. Finalize `@media print` in `styles.css`: hide header, banner controls and weather toggle, one column, white background.
- [ ] **Step 4: Update README:** Features (checklist, notes, route saved in browser, export/import, "Where is everyone"), Roadmap (saving done, clock and schedules next), and a note that data lives only in the browser and clearing site data erases it unless exported.
- [ ] **Step 5: Verify:** `npm test`, `npm run lint` and `npm run build` all pass. Run `npm run dev` and in the browser check the Today layout at wide and under 900px width, tick rows, reload to confirm persistence, export then import, and the print preview.
- [ ] **Step 6: Commit** `feat: add notes tab, print styles and docs for saving`
