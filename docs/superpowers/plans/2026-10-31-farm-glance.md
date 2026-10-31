# Farm Tab "At a Glance" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the form-style Farm tab with a two-column glance page (Ready today and Next goal on the left; small picture-tile boxes for Crops planted, Buildings and Animals on the right), and show the building goal on Today.

**Architecture:** Builds on branch `feat/farm-tracker`. Game data, `calendar.ts`, the harvest functions in `farm.ts`, `farm-lookup.ts` and the Today `ReadyCard` stay. The save's `farm` section is reshaped (animals become counts, `goal` replaces tools/skills/gold/saving). New pure helpers live in `src/data/farm.ts` (crops and summary) and `src/data/farm-build.ts` (buildings and goal); small presentational components live in `src/components/farm/`. `npm run farm` additionally cuts building and animal sprites from the unpacked game.

**Tech Stack:** Vite, React 18, TypeScript, Vitest + Testing Library, Node `.mjs` scripts with `pngjs`.

**Spec:** `docs/superpowers/specs/2026-10-31-farm-glance-design.md` (it supersedes the UI of `2026-10-30-farm-tracker-design.md`).

## Global Constraints

- Static site, no backend; data lives in browser localStorage plus JSON export/import. Save `version` stays `1`; a save without `farm` loads as `defaultFarm()`.
- Tracked: crops, buildings (including house upgrades `house:1`..`house:3`) and animals counted per type. Dropped: tools, skills, gold, saving goals, named animals.
- No Edit farm button and no popups: tapping a tile opens an action row inside its box; **+** opens a picture grid inside its box.
- Two columns: left Ready today then Next goal; right Crops planted, Buildings, Animals; the right column drops below the left under 900px (the existing `.today-grid` breakpoint).
- Sprites come from `Content (unpacked)/` via `npm run farm`; generated files are committed; `Content (unpacked)/` stays git-ignored. Missing sprites fall back to a lettered tile.
- Codebase style: single quotes, no semicolons, 2-space indent. Reuse `card`, `aside-card`, `btn-small`, `no-print`, `ItemIcon`, 44px touch targets. Print hides **+**, grids and action rows.
- No clock means Spring 1; the planting date for new crops is the clock's date.

## Review Focus

Failure modes the spec implies; each has a test in the owning task.

1. A stored farm in the old shape (animals as a list, tools, skills, gold, saving) loads without losing crops or buildings. (Task 1)
2. Building the goal through Upgrade or Build clears the goal; removing a level never sets a goal. (Task 3, 7)
3. Lowering a Coop to level 0 while chickens are counted shows "No coop built", not a crash or a hidden count. (Task 8)
4. A crop planted late in winter (all-season crops) never shows "Ready now" next year by wrap-around. (Task 1)
5. Ready today with only `season-over` crops shows them with Remove and the empty-state text for harvests. (Task 4)

---

### Task 1: Reshape the farm save and helpers; remove the old cards

**Files:**
- Delete: `src/components/farm/BuildingsCard.tsx`, `AnimalsCard.tsx`, `ProgressCard.tsx` and their `.test.tsx` files; discard the uncommitted edits to `src/components/farm/CropsCard.tsx` and `CropsCard.test.tsx` (`git checkout -- src/components/farm`), then delete both files.
- Modify: `src/data/types.ts`, `src/state/farm-save.ts` (+ test), `src/data/farm.ts` (+ test), `src/data/farm-upgrades.json`, `src/data/farm-data.test.ts`, `src/views/FarmView.tsx` (+ test), `src/components/today/ReadyCard.tsx` (import of `HarvestButton` moves, see below).
- Create: `src/components/farm/HarvestButton.tsx` (moved out of the deleted `CropsCard.tsx` unchanged).

**Interfaces:**
- Produces in `types.ts`: `FarmData { buildings: Record<string, number>; animals: Record<string, number>; crops: PlantedCrop[]; goal: string | null }`. Remove `FarmAnimal`.
- Produces in `farm-save.ts`: `defaultFarm()` (`{ buildings: {}, animals: {}, crops: [], goal: null }`), `parseFarm(raw): FarmData | null`. Remove `TOOLS`, `SKILLS`. Lenient old shape: an `animals` array of `{ type }` objects becomes counts per type; `tools`, `skills`, `gold`, `saving` are ignored. Animal counts are integers 0 to 99; `goal` is a string or null.
- Produces in `farm.ts`: `capacityUsage(farm: FarmData, buildings: FarmBuilding[], animalTypes: FarmAnimalType[]): { house: 'Coop' | 'Barn'; used: number; max: number }[]` (used = sum of counts of types living in that house). Remove `savingOptions`, `savingProgress`. `harvestDate` returns `finishes: false` when the harvest index is past 112 (winter 28).
- `farm-upgrades.json` keeps only the three `house:N` rows.
- `FarmView` temporarily renders `<h1>Farm</h1>` only; later tasks fill it.

- [ ] **Step 1: Write failing tests.** `farm-save.test.ts`: `parseFarm(defaultFarm())` round-trips; `{ ...defaultFarm(), animals: { 'White Chicken': 2 } }` round-trips; an old-shape farm `{ buildings: { Coop: 1 }, animals: [{ id: 'a', type: 'White Chicken', name: 'C', home: 'Coop' }, { id: 'b', type: 'White Chicken', name: 'D', home: 'Coop' }], crops: [], tools: { Axe: 1 }, skills: {}, gold: 5, saving: null }` parses to `{ buildings: { Coop: 1 }, animals: { 'White Chicken': 2 }, crops: [], goal: null }`; rejects animal count 100, -1 or 1.5, and a numeric `goal`. `farm.test.ts`: `capacityUsage` with Coop level 1 and `{ 'White Chicken': 3, 'White Cow': 1 }` gives Coop used 3 max 4 and Barn used 1 max 0; a fixture crop with all four seasons, 7 days, planted winter 25 gives `finishes: false`. Remove tests of deleted functions.
- [ ] **Step 2: Run `npx vitest run src/state src/data`.** Expected: new tests FAIL.
- [ ] **Step 3: Implement** the type, parse, helper and data changes; delete the old cards; move `HarvestButton`; reduce `FarmView`. Update `FarmView.test.tsx` to assert only the `Farm` heading for now.
- [ ] **Step 4: Run `npx tsc -b`, `npx eslint src` and `npx vitest run`.** Expected: all pass (the Today `ReadyCard` tests still pass).
- [ ] **Step 5: Commit** `refactor: reshape farm save for the glance page`.

---

### Task 2: Building and animal sprites

**Files:**
- Modify: `scripts/farm/build-farm-data.mjs`, `scripts/farm/resolve.mjs` (+ test), `src/data/farm-data.test.ts`
- Generate: `public/farm/buildings/<id>.png`, `public/farm/animals/<type>.png`, `src/data/farm-sprites.json`
- Create: `src/components/farm/FarmSprite.tsx` (+ test)

**Interfaces:**
- Produces in `resolve.mjs`: `spriteRect(raw): { x: number; y: number; w: number; h: number } | null` for a building (its `SourceRect`, or null when `Width` is 0, meaning the whole texture) and `animalFrame(raw): { w: number; h: number }` (`SpriteWidth`, `SpriteHeight`, default 16).
- Building texture path: `Content (unpacked)/<Texture>.png` (backslashes become `/`; for example Cabin uses `Buildings/Stone Cabin`). Animal texture: `Content (unpacked)/<Texture>.png`, first frame at 0,0.
- File names: building id with spaces kept (`public/farm/buildings/Big Coop.png`); animal type likewise.
- `farm-sprites.json`: `{ "buildings": { "<id>": "farm/buildings/<id>.png" }, "animals": { "<type>": "farm/animals/<type>.png" } }`, only for files written.
- `FarmSprite({ kind: 'building' | 'animal', id: string, size?: number })`: an `<img>` with `image-rendering: pixelated`, `alt=""`, scaled to fit a square of `size` (default 40) keeping aspect ratio; when there is no sprite, a lettered tile with the first letters (same look as `ItemIcon`'s fallback).

- [ ] **Step 1: Write failing tests:** `spriteRect({ SourceRect: { X: 0, Y: 0, Width: 96, Height: 112 } })` is `{ x: 0, y: 0, w: 96, h: 112 }`; `Width: 0` gives null; `animalFrame({ SpriteWidth: 32, SpriteHeight: 32 })` is 32 by 32 and `{}` is 16 by 16. `FarmSprite.test.tsx`: a known building renders an img whose src is the mapped path; an unknown id renders the lettered tile. `farm-data.test.ts`: every building in `farm-buildings.json` and every animal in `farm-animals.json` has a `farm-sprites.json` entry, except ids listed in an `UNSPRITED` set with a comment per id.
- [ ] **Step 2: Run `npx vitest run scripts/farm src/components/farm src/data/farm-data.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement**, run `npm run farm` (prints counts of sprites written), and keep the `UNSPRITED` set empty unless a texture is missing.
- [ ] **Step 4: Re-run the tests.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: building and animal sprites from the game`.

---

### Task 3: Building and goal helpers

**Files:**
- Create: `src/data/farm-build.ts`, `src/data/farm-build.test.ts`

**Interfaces:**
- Consumes: `chainLevels` (farm.ts), `FarmBuilding`, `FarmUpgrade`, `FarmData`.
- Produces in `farm-build.ts` (all pure; data passed in so tests use fixtures):
  - `COUNTED = ['Cabin', 'Fish Pond', 'Stable', 'Junimo Hut', 'Pet Bowl']`
  - `type BuildTarget = { id: string; name: string; cost: number; materials: FarmMaterial[]; builder: string | null; buildDays: number | null }` (house upgrades have builder `'Robin'`, buildDays 3).
  - `targetById(id, buildings, upgrades): BuildTarget | undefined` (building id or `house:N`).
  - `ownedTiles(owned, buildings, upgrades): { key: string; id: string; name: string; count: number }[]`: chains give one tile keyed by root with `id` the current level's building; counted buildings give their count; single buildings with value 1; house upgrades as one tile per built `house:N`. Order: chains, single, counted, house.
  - `buildable(owned, buildings, upgrades): BuildTarget[]`: each chain's next level, each unbuilt single building, every counted building, and the next house upgrade; sorted by cost ascending then name.
  - `nextUpgrade(key, owned, buildings, upgrades): BuildTarget | undefined` (next chain level, or next house upgrade for a `house:N` tile; undefined for single and counted).
  - `build(farm, id, buildings, upgrades): FarmData` (chain member id sets the root level to that member's level; counted adds one up to 99; single sets 1; `house:N` sets 1) and clears `goal` when `goal === id`.
  - `unbuild(farm, key, buildings): FarmData` (chain level minus one; counted minus one; single and `house:N` to 0, deleting zero entries; also removes later `house:N` entries when an earlier one is removed). Never changes `goal`.
- Components call these helpers with `BUILDINGS` and `UPGRADES` from `farm-lookup.ts`; no new lookup exports.

- [ ] **Step 1: Write failing tests** with a fixture of the Coop chain (Coop 4,000; Big Coop 10,000; Deluxe Coop 20,000), Well (1,000), Cabin (100), and house:1 (10,000), house:2 (65,000): `buildable({})` lists Cabin, Well, Coop, house:1 in that order; after `build(farm, 'Coop')` the Coop chain offers Big Coop and `ownedTiles` has one `Coop` tile with id `Coop`; `build` of `Big Coop` with `goal: 'Big Coop'` sets level 2 and `goal: null`; `unbuild(farm, 'Coop')` from level 2 gives level 1 and keeps goal; `unbuild` of Cabin at 1 deletes the key; `unbuild` of `house:1` also removes `house:2`; `nextUpgrade('Coop', { Coop: 3 })` is undefined; `targetById('house:2')` has builder Robin and cost 65,000.
- [ ] **Step 2: Run `npx vitest run src/data/farm-build.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the test file.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: building and goal helpers for the farm page`.

---

### Task 4: Page layout and Ready today

**Files:**
- Create: `src/components/farm/ReadyToday.tsx` (+ test), `src/components/farm/FarmTile.tsx` (+ test)
- Modify: `src/data/farm.ts` (+ test), `src/views/FarmView.tsx` (+ test), `src/styles.css`

**Interfaces:**
- Consumes: `harvestDate`, `harvestStatus`, `harvest` (farm.ts), `HarvestButton`, `CROPS`/`cropById`, `updateFarm`.
- Produces in `farm.ts`: `harvestSummary(entries: PlantedCrop[], crops: FarmCrop[], now: SeasonDay | null): { ready: PlantedCrop[]; tomorrow: PlantedCrop[]; seasonOver: PlantedCrop[]; coming: { entry: PlantedCrop; date: SeasonDay; days: number }[] }` (`coming` = `later` crops sorted by date, first three; unknown crop ids are skipped).
- `FarmTile({ label: string; count?: number; selected?: boolean; onClick: () => void; children: ReactNode })`: a 44px-plus square button with the picture (children), a count badge when `count` is set, `aria-label` = label, `aria-pressed` = selected.
- `ReadyToday`: card titled "Ready today". Rows for ready ("Ready now", with `HarvestButton`) and tomorrow ("Tomorrow"), each with `ItemIcon`, count and crop name; season-over rows "Died at the season change" with a `Remove <name>` button; a "Coming up" list of `"<name> ×<count>, <Season> <day> (in <n> day|days)"`; empty state "Nothing to harvest today." followed by "Next: <first coming line>" or "Plant something in Crops planted."
- `FarmView` layout: `<div className="farm-grid"><div className="farm-main">ReadyToday (Next goal added in Task 5)</div><aside className="farm-side">(boxes added in Tasks 6 to 8)</aside></div>`; CSS `.farm-grid` two columns `minmax(0, 1.6fr) minmax(0, 1fr)` collapsing to one column under 900px; `.farm-side` stacks `.aside-card` boxes with a 16px gap.

- [ ] **Step 1: Write failing tests:** `harvestSummary` splits a fixture (Parsnip ready, Potato tomorrow, Green Bean later at spring 15, Cauliflower later at spring 17, a dead spring crop at summer) correctly and caps `coming` at three; `ReadyToday` shows "Ready now" with a working Harvested (saved entry removed for Parsnip), "Tomorrow" without a button, "Died at the season change" with Remove, the Coming up line "Green Bean ×10, Spring 15 (in 3 days)", the empty-state text with and without a next harvest, and only season-over crops with "Nothing to harvest today."; `FarmTile` renders the badge and name; `FarmView` has the `Ready today` heading inside `.farm-main`.
- [ ] **Step 2: Run `npx vitest run src/data/farm.test.ts src/components/farm src/views/FarmView.test.tsx`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run `npx vitest run`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: farm page layout and Ready today`.

---

### Task 5: Next goal on Farm and Today

**Files:**
- Create: `src/components/farm/NextGoal.tsx` (+ test)
- Modify: `src/views/FarmView.tsx`, `src/components/today/NextGoalCard.tsx` (+ test)

**Interfaces:**
- Consumes: `targetById` (Task 3), `FarmSprite` (Task 2), `ItemIcon`, `updateFarm`.
- Produces: `NextGoal` card titled "Next goal": with a goal, the sprite (house upgrades use the lettered fallback), name, "from <builder>, <days> days", cost formatted "6,000g", materials as `ItemIcon` plus amount, and a `Clear goal` button (sets `goal: null`); without a goal, "Pick a goal with ★ in Buildings."; an unknown goal id shows "Unknown goal" and the Clear button. `NextGoalCard` keeps its current content and, when `save.farm.goal` resolves, adds a line "Building goal: <name>, <cost>" with material pictures.

- [ ] **Step 1: Write failing tests** (mock `farm-lookup` with a Barn at 6,000g, 350 Wood, 150 Stone): goal `Barn` shows "Barn", "6,000g", "from Robin, 3 days" and the two materials; Clear goal saves `goal: null`; no goal shows the hint; unknown id shows "Unknown goal"; `NextGoalCard` shows "Building goal: Barn, 6,000g" with a goal and nothing extra without one.
- [ ] **Step 2: Run the two test files.** Expected: FAIL.
- [ ] **Step 3: Implement** and place `NextGoal` under `ReadyToday` in `.farm-main`.
- [ ] **Step 4: Run `npx vitest run src/components src/views`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: next building goal on the farm page and Today`.

---

### Task 6: Crops planted box

**Files:**
- Create: `src/components/farm/CropsBox.tsx` (+ test)
- Modify: `src/data/farm.ts` (+ test), `src/views/FarmView.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `FarmTile`, `ItemIcon`, `harvestDate`, `harvestStatus`, `harvest`, `CROPS`, `updateFarm`; new ids as in the old CropsCard (`Date.now().toString(36)` plus random).
- Produces in `farm.ts`: `cropOptions(crops: FarmCrop[], season: Season): { id: string; label: string; picture: string }[]` — crops whose seasons include `season`, sorted by label; label is the harvest name, plus ` (<seeds>)` when the seed name differs; the forage mixes (seed names `Spring Seeds`, `Summer Seeds`, `Fall Seeds`, `Winter Seeds`) use the seed name alone; `picture` is the harvest name (for `ItemIcon`).
- `CropsBox`: aside card titled "Crops planted". One `FarmTile` per entry (label "<name>, <count> planted"). Tapping a tile selects it and shows an action row (`role="region"`, label "<name> actions") with the ready text ("Ready now", "Ready <Season> <day> (in n days)", "Will not finish this season" or "Died at the season change"), `Harvested` only when ready, and `Remove`. A `+` tile (label "Plant a crop") toggles a grid (`role="list"`, label "Crops to plant") of option buttons with pictures; choosing one shows a count stepper (`−`, the number, `+`, min 1, max 999) and `Plant`, which saves `{ crop, count, season, day }` from the clock (Spring 1 without one) and closes the grid.

- [ ] **Step 1: Write failing tests:** `cropOptions` sorts by label, labels "Unmilled Rice (Rice Shoot)" and "Spring Seeds" correctly, and filters by season; the box plants Parsnip ×3 on the clock date (saved entry checked), a tile shows the count badge, tapping shows the action row with "Ready Spring 5 (in 4 days)" and no Harvested, Remove deletes, Harvested on a ready Green Bean keeps the tile and moves the date, and the grid lists summer crops when the clock is in summer.
- [ ] **Step 2: Run the test files.** Expected: FAIL.
- [ ] **Step 3: Implement** and add the box first in `.farm-side`.
- [ ] **Step 4: Run `npx vitest run src/components src/views src/data`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: crops planted box with picture tiles`.

---

### Task 7: Buildings box

**Files:**
- Create: `src/components/farm/BuildingsBox.tsx` (+ test)
- Modify: `src/views/FarmView.tsx`

**Interfaces:**
- Consumes: `ownedTiles`, `buildable`, `nextUpgrade`, `build`, `unbuild` (Task 3), `FarmTile`, `FarmSprite`, `ItemIcon`, `BUILDINGS`, `UPGRADES`, `updateFarm`.
- Produces: `BuildingsBox` titled "Buildings". One tile per `ownedTiles` entry (sprite of `id`; badge for counts above 1; label "<name>" or "<name>, <count> built"). Tapping a tile shows an action row with `Upgrade to <next name>` (when `nextUpgrade` exists), `★ Set <next name> as goal` (when it exists), and `Remove` (`unbuild`). A `+` tile (label "Build something") toggles a grid (label "Buildings to build") of `buildable` targets, each showing sprite, name and cost with `Build` and `★ Goal` buttons (accessible names `Build <name>`, `Set <name> as goal`). A tile or grid item matching the current goal shows a ★ badge.

- [ ] **Step 1: Write failing tests** (mock `farm-lookup` with the Task 3 fixture): empty farm shows only the + tile; the grid lists Cabin, Well, Coop, Kitchen in cost order; `Build Coop` saves `buildings.Coop = 1` and the Coop tile appears; tapping it offers "Upgrade to Big Coop"; `Set Big Coop as goal` saves `goal: 'Big Coop'` and a ★ shows; `Upgrade to Big Coop` saves level 2 and clears the goal; `Remove` lowers the level and keeps another goal; Cabin built twice shows badge 2.
- [ ] **Step 2: Run the test file.** Expected: FAIL.
- [ ] **Step 3: Implement** and add the box second in `.farm-side`.
- [ ] **Step 4: Run `npx vitest run src/components src/views`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: buildings box with build, upgrade and goal`.

---

### Task 8: Animals box

**Files:**
- Create: `src/components/farm/AnimalsBox.tsx` (+ test)
- Modify: `src/views/FarmView.tsx`

**Interfaces:**
- Consumes: `capacityUsage` (Task 1), `houseCapacity`, `FarmTile`, `FarmSprite`, `ANIMAL_TYPES`, `BUILDINGS`, `updateFarm`.
- Produces: `AnimalsBox` titled "Animals". One tile per type with a count above 0 (sprite, badge, label "<type>, <count>"); tapping shows an action row with `Add one <type>` (+1, max 99) and `Remove one <type>` (−1; at 0 the key is deleted and the row closes). A `+` tile (label "Add an animal") toggles a grid (label "Animals to add") of types whose house has level 1 or more, each adding one. Below the tiles, one line per house that has a building or animals: "Coop 2 of 8", plus "Over capacity" when used exceeds max, or "No coop built" / "No barn built" when animals live there and the level is 0. With no Coop and no Barn and no animals, the line reads "Build a coop or barn to add animals." and the + tile is disabled.

- [ ] **Step 1: Write failing tests:** with Coop level 1, the grid offers chickens and not cows; adding a White Chicken twice shows badge 2 and "Coop 2 of 4"; five chickens show "Over capacity"; Coop level 0 with chickens shows "No coop built"; Remove one at count 1 deletes the type; with nothing built the hint shows and + is disabled.
- [ ] **Step 2: Run the test file.** Expected: FAIL.
- [ ] **Step 3: Implement** and add the box third in `.farm-side`.
- [ ] **Step 4: Run `npx vitest run src/components src/views`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: animals box counted per type`.

---

### Task 9: README, spec notes and final checks

**Files:**
- Modify: `README.md`, `docs/superpowers/specs/2026-10-31-farm-glance-design.md` (add "Plan adjustments" if any task made a ruling)

- [ ] **Step 1: Update the README Farm feature bullet** to describe the glance page (Ready today, Next goal shown on Farm and Today, picture tiles for crops, buildings and animals, tap to act, + to add) and that `npm run farm` also cuts building and animal sprites. Remove mentions of tools, skills, gold and the saving goal.
- [ ] **Step 2: Run `npm run build`, `npm run lint`, `npm test`.** Expected: all pass (two existing lint warnings are fine).
- [ ] **Step 3: Play-through in the browser** (controller): plant crops, check Ready today at a few clock dates, build and upgrade a coop, set and reach a goal, add animals and trigger the capacity lines, check phone width and print preview.
- [ ] **Step 4: Commit** `docs: README for the farm glance page`.

---

## Self-Review

- **Spec coverage:** layout and breakpoints (Task 4), Ready today including coming up, empty state and dead crops (Task 4), Next goal on Farm and Today with auto-clear (Tasks 3, 5, 7), the three boxes with tiles, action rows and + grids (Tasks 6 to 8), sprites (Task 2), save reshape with lenient old shape (Task 1), dropped features removed (Task 1), README (Task 9). Accessibility names are fixed in each component's interface; print rules are in Global Constraints.
- **Type consistency:** `FarmData` is defined once in Task 1; `BuildTarget` and the build helpers in Task 3 are consumed by Tasks 5 and 7; `harvestSummary` and `cropOptions` are added to `farm.ts` in Tasks 4 and 6; `FarmTile` and `FarmSprite` come from Tasks 4 and 2.
- **Carried from the earlier branch:** the unreviewed dead-crop fix (`season-over`) is used as is and reviewed in the final whole-branch review; the uncommitted crop-picker edits are discarded and redone as `cropOptions` in Task 6.
