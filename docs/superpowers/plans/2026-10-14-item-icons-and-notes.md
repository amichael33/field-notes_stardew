# Item Icons, Obtained Items and Markdown Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each bundle item's in-game icon, let the player mark items obtained (they leave the Today "Still needed" list and are struck through on the Community Center tab), open an item detail panel from the icon, and render Notes for tomorrow as Markdown.

**Architecture:** A build-time script crops item icons from the author's locally unpacked game files into committed PNGs plus a name-to-file map. Obtained flags are ids in the existing saved `checked` list. Two shared components (`ItemRow`, `ItemDetail`) serve both bundle views; one shared `MarkdownNotes` component serves both notes surfaces.

**Tech Stack:** Vite, React 18, TypeScript, Vitest, @testing-library/react, `pngjs` (dev only, icon script), `react-markdown` (runtime).

**Spec:** `docs/superpowers/specs/2026-10-14-item-icons-and-notes-design.md`

## Global Constraints

- The game files live in `Content (unpacked)/` at the repo root. It is git-ignored and must never be committed, imported by the app, or required by `npm test`, `npm run build` or CI. Only the cropped icons and the map are committed.
- The wiki is not contacted. Nothing in this plan may fetch from stardewvalleywiki.com.
- Obtained ids are `bundle:<bundle id>:<item name>` in the existing `save.checked` array. No save-format change, no version bump.
- Icons are 16x16 sources displayed at 48px with `image-rendering: pixelated`. Gold amounts ("2,500g", "5,000g", "10,000g", "25,000g") render an inline SVG gold coin, not game art. Any other item with no file renders a text tile.
- Markdown renders with `react-markdown` and no raw HTML. Links open in a new tab with `rel="noopener noreferrer"`.
- Exact messages stay: "Bundles are not used on the Joja route." and "No bundle items available this season." Other strings: "Complete", "k of N" count, "Still needed".
- Fonts unchanged. One 900px breakpoint. Buttons and chips keep `min-height: 44px`.
- Style: no semicolons, single quotes, 2-space indent.

## Review Focus

1. An item that appears in two bundles: ticking one does not tick the other (Task 3).
2. A bundle that reaches its required slots before all its items are ticked shows "Complete" and no "Still needed" list (Tasks 2 and 3).
3. A stored or imported `bundle:` id for an item that no longer exists: no crash, no visible entry, id kept in the save (Task 3).
4. An item whose icon file is missing or fails to load shows a text tile, not a broken image (Task 2).
5. A very long note and Markdown containing HTML or a `<script>` tag: the card does not break and nothing executes (Task 4).

---

## File Structure

- `scripts/icons/{crop.mjs,match.mjs,build-icons.mjs}` and `crop.test.mjs`, `match.test.mjs`: icon script
- `public/items/*.png`, `src/data/item-icons.json`: generated and committed
- `src/data/selectors.ts` (modify): `bundleItemId`, `bundleProgress`
- `src/components/{ItemIcon,ItemDetail,ItemRow}.tsx` (create): shared bundle-item UI
- `src/components/today/NeededCard.tsx`, `src/views/BundlesView.tsx` (modify)
- `src/components/MarkdownNotes.tsx` (create); `src/components/today/NotesCard.tsx`, `src/views/NotesView.tsx` (modify)
- `src/test-setup.ts`, `src/styles.css`, `package.json`, `README.md` (modify)

### Task 1: Icon script and generated icons

**Files:**
- Create: `scripts/icons/crop.mjs`, `scripts/icons/match.mjs`, `scripts/icons/build-icons.mjs`, `scripts/icons/crop.test.mjs`, `scripts/icons/match.test.mjs`, `public/items/*.png`, `src/data/item-icons.json`
- Modify: `package.json` (add devDependencies `pngjs@^7.0.0` and `@types/pngjs@^6.0.5`, script `"icons": "node scripts/icons/build-icons.mjs"`)

**Interfaces:**
- Produces in `crop.mjs`:
  - `spriteOrigin(index: number, columns: number): { x: number; y: number }` returns `{ x: (index % columns) * 16, y: Math.floor(index / columns) * 16 }`
  - `cropSprite(sheet: PNG, x: number, y: number): PNG` returns a new 16x16 PNG copied from the sheet (`pngjs`)
- Produces in `match.mjs`:
  - `slugify(name: string): string` lowercase, non-alphanumeric runs replaced by `-`, trimmed of `-`
  - `baseName(name: string): string` strips a trailing `(gold quality...)` or `(silver quality...)` parenthetical
  - `HAND_MAPPINGS: Record<string, string>` is `{ 'Large Brown Egg': '182', 'Large Goat Milk': '438' }` (object ids)
  - `GOLD_AMOUNTS: string[]` is the four amounts `'2,500g' | '5,000g' | '10,000g' | '25,000g'`
  - `matchItems(names: string[], objects: Record<string, GameObject>, strings: Record<string, string>): { matched: Record<string, { id: string; texture: string | null; spriteIndex: number }>; gold: string[]; unmatched: string[] }` where `GameObject` has `Name`, `DisplayName`, `Texture`, `SpriteIndex`. A name matches by `Name` or by the localised string that `DisplayName` (`[LocalizedText Strings\Objects:<Key>]`) points to in `strings`; the first object id (lowest numeric) wins when two share a name, unless `HAND_MAPPINGS` names an id.
- Output of `build-icons.mjs`: `public/items/<slug>.png` for every matched item, and `src/data/item-icons.json` as `Record<string, string | null>`: item name to `items/<slug>.png`, or `null` for the gold amounts. Sheets: `Maps/springobjects.png` (24 columns) by default; `TileSheets/Objects_2.png` (8 columns) when `Texture` is `TileSheets\Objects_2`.

- [ ] **Step 1: Write failing tests.**
  - `crop.test.mjs`: `spriteOrigin maps index 25 on a 24-column sheet to x 16, y 16`; `spriteOrigin on an 8-column sheet maps 123 to x 48, y 240`; `cropSprite copies exactly the 16x16 pixels at the origin` (build a 48x32 PNG in memory with a distinct colour per tile, crop the tile at column 1, row 1, assert every pixel equals that tile's colour and the size is 16x16).
  - `match.test.mjs`: `slugify turns "Wild Horseradish" into "wild-horseradish"`; `baseName strips "(gold quality)" and "(silver quality or better)"`; `matchItems matches by Name`; `matchItems matches by localised DisplayName` (object `Name` differs from the item name); `matchItems strips quality suffixes before matching`; `matchItems applies the Large Brown Egg and Large Goat Milk hand mappings`; `matchItems picks the lowest id when two objects share a name` ("Large Egg" 174 vs 182); `matchItems reports gold amounts separately and not as unmatched`; `matchItems reports a truly unknown name as unmatched`.
- [ ] **Step 2: Run** `npm test -- scripts/icons`. Expected: FAIL (modules missing).
- [ ] **Step 3: Implement** `crop.mjs` and `match.mjs` as pure functions, then `build-icons.mjs` as the CLI: it exits 1 with the message `Content (unpacked) folder not found. Unpack the game with StardewXnbHack first.` if the folder is missing and writes nothing; reads item names from `src/data/bundles.json`; prints every unmatched name and exits 1 if any non-gold name is unmatched; otherwise writes the PNGs and the JSON map (sorted keys, 2-space indent).
- [ ] **Step 4: Run** `npm test -- scripts/icons`. Expected: PASS.
- [ ] **Step 5: Generate** by running `npm run icons`. Expected: prints a count, exits 0, creates about 122 PNGs under `public/items/` and `src/data/item-icons.json` with `null` for the four gold amounts. Confirm `git status` shows no file under `Content (unpacked)/`.
- [ ] **Step 6: Commit** `feat: generate item icons from the unpacked game files` (script, tests, `package.json`, lockfile, icons, map).

### Task 2: Selectors and shared item components

**Files:**
- Modify: `src/data/selectors.ts`, `src/data/selectors.test.ts`, `src/test-setup.ts`, `src/styles.css`
- Create: `src/components/ItemIcon.tsx`, `src/components/ItemDetail.tsx`, `src/components/ItemRow.tsx`, `src/components/ItemRow.test.tsx`

**Interfaces:**
- Produces in `selectors.ts`:
  - `bundleItemId(bundle: Bundle, item: BundleItem): string` returns `` `bundle:${bundle.id}:${item.name}` ``
  - `bundleProgress(bundle: Bundle, checked: string[]): { obtained: number; required: number; complete: boolean }` where `obtained` counts bundle items whose id is in `checked` (all items, regardless of season), `required` is `bundle.slotsRequired`, and `complete` is `obtained >= required`
- `ItemIcon({ name }: { name: string })`: reads `src/data/item-icons.json`; a string value renders `<img src alt="" width={48} height={48} className="item-icon">`; `null` renders the inline SVG gold coin (`role="img"`, `aria-label="Gold"`); a name missing from the map, or an `<img>` `onError`, renders a text tile showing the item's initials.
- `ItemDetail({ bundle, item, open, onClose })`: a native `<dialog>` showing name, quantity, source, seasons ("any season" for `'any'`) and the bundle name; closes on Escape (the `cancel`/`close` event) and via a "Close" button; the parent restores focus to the tile button after close.
- `ItemRow({ bundle, item, showSource }: { bundle: Bundle; item: BundleItem; showSource?: boolean })`: renders an icon button (accessible name `Details for <item.name>`) that opens `ItemDetail`, and a separate name button (`aria-pressed` reflecting obtained) that calls `useSave().toggle(bundleItemId(bundle, item))`. When obtained the row has class `obtained`.
- `test-setup.ts` adds a minimal `HTMLDialogElement.prototype.showModal` / `close` polyfill (sets and removes the `open` attribute and fires `close`) only when jsdom lacks them.

- [ ] **Step 1: Write failing tests.**
  - selectors: `bundleItemId joins bundle id and item name`; `bundleProgress counts obtained items across all items`; `bundleProgress is complete once obtained reaches slotsRequired even with items left`; `bundleProgress is not complete below slotsRequired`; `bundleProgress ignores checked ids for unknown items`.
  - `ItemRow.test.tsx` (render `ItemRow` via `renderWithState`): `renders an img for an item with an icon file`; `renders the gold coin for a gold amount item`; `renders a text tile for an item missing from the icon map`; `falls back to a text tile when the image fails to load` (fire `error` on the img); `clicking the name toggles obtained and sets aria-pressed`; `clicking the icon opens the detail dialog with name, quantity, source, seasons and bundle`; `Escape closes the dialog and focus returns to the icon button`; `the Close button closes the dialog`.
- [ ] **Step 2: Run** `npm test -- selectors ItemRow`. Expected: FAIL.
- [ ] **Step 3: Implement** the selectors, `ItemIcon`, `ItemDetail`, `ItemRow`, the `test-setup` polyfill, and CSS: `.item-icon { width: 48px; height: 48px; image-rendering: pixelated }`, the tile and coin sizing, `.obtained .item-name { text-decoration: line-through; opacity: 0.6 }`, dialog styling matching the card style, and print rules unaffected.
- [ ] **Step 4: Run** `npm test`. Expected: PASS. Run `npm run build`. Expected: succeeds.
- [ ] **Step 5: Commit** `feat: add item icon, detail dialog and obtained item row`

### Task 3: Wire the Today card and the Community Center tab

**Files:**
- Modify: `src/components/today/NeededCard.tsx`, `src/views/BundlesView.tsx`, `src/views/PathView.test.tsx`, `src/views/BundlesView.test.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `ItemRow`, `bundleItemId`, `bundleProgress`, `useSave().save.checked`.
- Behaviour:
  - `NeededCard`: per bundle, the count reads `{obtained} of {required}` and the progress bar width is `min(100, obtained / required * 100)%` (replace the hard-coded `0 of N` and `0%`). The "Still needed" list holds the season-filtered items that are not obtained, each as an `ItemRow`. A bundle with `complete === true` shows "Complete" in place of the list. The Joja and empty-season messages are unchanged.
  - `BundlesView`: every season-filtered item stays listed as an `ItemRow` with `showSource`; obtained items are struck through and clicking the name again un-obtains them.

- [ ] **Step 1: Write failing tests.**
  - PathView: `clicking an item name removes it from Still needed and updates the count` (e.g. "0 of 4" becomes "1 of 4" for the first bundle); `a bundle shows Complete once its required slots are obtained` (tick `slotsRequired` items of one bundle, assert "Complete" and no "Still needed" list for it); `the progress bar width follows the obtained count`; `Needed this season still shows the Joja message on the Joja route`.
  - BundlesView: `obtained items stay listed and are struck through`; `clicking an obtained item again un-obtains it`; `an item in two bundles is tracked separately` (use an injected `bundles` prop with the same item name in two bundles; ticking one leaves the other unticked); `an unknown bundle id in the saved checked list causes no crash and no extra row` (pre-seed localStorage `field-notes-save` with `checked: ['bundle:nope:Ghost']`, render, assert the page renders, no "Ghost" text, and the id is still in the stored save after toggling something else).
- [ ] **Step 2: Run** `npm test -- PathView BundlesView`. Expected: FAIL.
- [ ] **Step 3: Implement** the two views using `ItemRow` and the selectors. Remove now-dead markup. Keep existing tests passing (existing `getByText` queries for item names must still find the name inside the button).
- [ ] **Step 4: Run** `npm test`, `npm run lint`, `npm run build`. Expected: all pass.
- [ ] **Step 5: Commit** `feat: mark bundle items obtained in Today and Community Center views`

### Task 4: Markdown notes

**Files:**
- Create: `src/components/MarkdownNotes.tsx`, `src/components/MarkdownNotes.test.tsx`
- Modify: `src/components/today/NotesCard.tsx`, `src/views/NotesView.tsx`, `src/views/NotesView.test.tsx`, `src/views/PathView.test.tsx`, `src/styles.css`, `package.json` (dependency `react-markdown@^9.0.1`)

**Interfaces:**
- Produces: `MarkdownNotes({ id, label, className }: { id: string; label: string; className?: string })`: reads and writes `useSave().save.notes` via `setNotes`. Renders an Edit / Preview toggle (two buttons, `aria-pressed`). Edit shows the labelled textarea (`id`, accessible name `label`); Preview shows `react-markdown` output in a container with `aria-label={`${label} preview`}`. No raw HTML (react-markdown default), links render with `target="_blank"` and `rel="noopener noreferrer"`, long text wraps with `overflow-wrap: anywhere`.
- `NotesCard` and `NotesView` use `MarkdownNotes` in place of their own textareas, keeping headings ("Notes for tomorrow", "Notes") and the existing textarea ids/labels so current tests keep passing.

- [ ] **Step 1: Write failing tests** in `MarkdownNotes.test.tsx`:
  - `renders nested bullets as a nested list` (note `- a\n  - b`; Preview shows a `ul` inside a `li`)
  - `shows a script tag as text and does not render an element` (note `<script>alert(1)</script>`; no `script` element in the preview, the text is visible)
  - `the Edit and Preview toggle keeps the note text`
  - `typing in Edit saves the note` (value persists after remount)
  - `links open in a new tab with noopener noreferrer`
  - `a very long unbroken note keeps its value and renders in Preview`
  - plus: `the Today card and the Notes tab share the same note` (update the existing `NotesView` test to type in one and read the other, using Preview if needed).
- [ ] **Step 2: Run** `npm test -- MarkdownNotes NotesView PathView`. Expected: FAIL.
- [ ] **Step 3: Implement** `MarkdownNotes`, install `react-markdown`, swap it into both surfaces, add CSS for the toggle and preview list styling.
- [ ] **Step 4: Run** `npm test`, `npm run lint`, `npm run build`. Expected: all pass.
- [ ] **Step 5: Commit** `feat: render notes as Markdown with an Edit and Preview toggle`

### Task 5: README and final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the README.** Features: item icons, obtained items with a detail panel, Markdown notes. Add a "Game art and icons" section: the item icons are artwork from Stardew Valley and belong to ConcernedApe; they were unpacked from the author's own copy of the game using [StardewXnbHack](https://github.com/Pathoschild/StardewXnbHack) by Pathoschild; to regenerate, unpack the game into `Content (unpacked)/` with StardewXnbHack and run `npm run icons`; that folder is git-ignored and never published. Add a font credit line for the Fisherman font with a pointer to the author's contact in `Readme.txt`. Keep the wiki credit, license and non-affiliation sections.
- [ ] **Step 2: Verify** `npm test`, `npm run lint`, `npm run build` all pass, and `git status` shows nothing under `Content (unpacked)/` and no file outside the plan's list.
- [ ] **Step 3: Commit** `docs: credit StardewXnbHack and ConcernedApe, document icons and notes`
