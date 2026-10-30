# Farm Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Farm tab placeholder with a saved tracker for buildings, animals, crops in the ground and tool, skill and money progress, plus a Ready to harvest card on Today.

**Architecture:** Game data is extracted by a script into committed JSON (`src/data/farm-*.json`); a hand-written table covers costs the game keeps in code. Pure calculations in `src/data/farm.ts` (and shared season-day helpers in `src/data/calendar.ts`) feed four cards on `FarmView`. Farm state is a new `farm` section of `SaveData`, updated through one `updateFarm` function on `SaveContext`.

**Tech Stack:** Vite, React 18, TypeScript, Vitest + Testing Library, Node scripts with `pngjs`-style plain `.mjs`.

**Spec:** `docs/superpowers/specs/2026-10-30-farm-tracker-design.md`

## Global Constraints

- Static site, no backend; data lives in browser localStorage plus JSON export/import.
- Save `version` stays `1`. `SaveData.farm` is optional on read; a save or import without it loads as `defaultFarm()`.
- The farm tracker has no map, no drawing and no screenshot upload; no fertilizer, crop quality, profit math, per-animal friendship or fruit trees.
- Game data comes from `Content (unpacked)/Data/` through `npm run farm`; the generated JSON is committed so the site never reads the unpacked game at runtime. `Content (unpacked)/` stays git-ignored.
- Hand-written values (`farm-upgrades.json`) are checked against the Stardew Valley wiki (credited in the README). The wiki blocks the fetch tool; read it in the built-in browser.
- Reuse existing classes and patterns: `card`, `aside-card`, `btn-small`, `path-row`, `item-icon`, the shared `Masonry` layout, `ItemIcon` (it falls back to an initials tile for unknown items), 44px touch targets, print hides add and remove controls.
- Season arithmetic is 28 days per season (spring, summer, fall, winter); no clock means Spring 1.
- **Spec adjustment (ruling):** the spec's data test "every building material or crop harvest item has an icon" is narrowed to building materials only, because `item-icons.json` only covers bundle items and `ItemIcon` already falls back to an initials tile for crops. Crop pictures use that fallback.
- **Spec adjustment (ruling):** a crop entry gains an optional `lastHarvest: { season, day }`, used for regrowing crops (the spec's sketch had only the planted date).

## Review Focus

Failure modes the spec implies; each has a test in the owning task.

1. A crop planted too late to finish before its last season ends is flagged and never shown as "ready" on Today. (Task 4, 5)
2. A regrowing crop harvested near a season boundary schedules its next harvest correctly, or is flagged if it would not finish. (Task 4, 5)
3. An old save with no `farm`, and an import with out-of-range levels, bad dates or a negative gold value. (Task 3)
4. Animals living in a building whose level was lowered to 0, or more animals than capacity, show a warning rather than hiding. (Task 7)
5. No clock: the Crops card defaults to Spring and Today's Ready card is hidden. (Task 5)
6. Unknown building, crop or animal ids from a newer data file are kept and shown as "Unknown" instead of crashing. (Task 3, 5, 6, 7)

---

### Task 1: Shared season-day helpers

**Files:**
- Create: `src/data/calendar.ts`, `src/data/calendar.test.ts`
- Modify: `src/data/plans.ts` (replace the private `dayIndex`/`SEASON_ORDER` with imports)

**Interfaces:**
- Produces:
  - `SEASONS: Season[]` (`['spring','summer','fall','winter']`)
  - `dayIndex(season: Season, day: number): number` (spring 1 = 1; 28 days per season)
  - `fromIndex(index: number): { season: Season; day: number }` (wraps after winter 28 into the next year)
  - `daysUntil(target: { season: Season; day: number }, now: { season: Season; day: number }): number` (negative when past)

- [ ] **Step 1: Write failing tests in `src/data/calendar.test.ts`**: `dayIndex('spring',1)` is 1, `dayIndex('summer',1)` is 29, `dayIndex('winter',28)` is 112; `fromIndex(29)` is summer 1, `fromIndex(112)` is winter 28, `fromIndex(113)` is spring 1; `daysUntil({season:'spring',day:17},{season:'spring',day:13})` is 4 and the reverse is -4.
- [ ] **Step 2: Run `npx vitest run src/data/calendar.test.ts`.** Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `calendar.ts` as specified; in `plans.ts` delete the local `SEASON_ORDER` and `dayIndex` and import them (`plans.ts` already computes `index * 28 + day`, so behavior is unchanged).
- [ ] **Step 4: Run `npx vitest run src/data`.** Expected: PASS including the existing `plans.test.ts`.
- [ ] **Step 5: Commit**

```bash
git add src/data
git commit -m "refactor: shared season-day helpers"
```

---

### Task 2: Game data script and farm data files

**Files:**
- Create: `scripts/farm/resolve.mjs`, `scripts/farm/resolve.test.mjs`, `scripts/farm/build-farm-data.mjs`, `src/data/farm-upgrades.json`, `src/data/farm-data.test.ts`
- Generate: `src/data/farm-buildings.json`, `src/data/farm-animals.json`, `src/data/farm-crops.json`
- Modify: `package.json` (script `"farm": "node scripts/farm/build-farm-data.mjs"`), `src/data/types.ts` (add the types below)

**Interfaces:**
- Produces in `src/data/types.ts`:
  - `FarmBuilding { id: string; name: string; builder: string; cost: number; materials: { item: string; amount: number }[]; buildDays: number; capacity: number | null; upgradesFrom: string | null }` (`id` is the game's key, for example `Big Coop`; `capacity` is max animals or null when not an animal house)
  - `FarmAnimalType { type: string; house: 'Coop' | 'Barn'; price: number | null; daysToMature: number }` (`price` null when not sold)
  - `FarmCrop { id: string; name: string; seeds: string; seasons: Season[]; daysToGrow: number; regrowDays: number | null }`
  - `FarmUpgrade { id: string; group: 'tool' | 'house' | 'backpack'; label: string; cost: number; materials: { item: string; amount: number }[] }`
- Produces in `resolve.mjs` (pure, unit-tested): `buildingFrom(id, raw, strings, objects)`, `cropFrom(seedId, raw, objects)`, `animalFrom(type, raw)`, `KEEP_BUILDINGS: Set<string>` (the buildable list: Coop, Big Coop, Deluxe Coop, Barn, Big Barn, Deluxe Barn, Shed, Big Shed, Well, Silo, Mill, Fish Pond, Cabin, Stable, Slime Hutch, Pet Bowl, Junimo Hut, Earth Obelisk, Water Obelisk, Desert Obelisk, Island Obelisk, Gold Clock).
- `farm-upgrades.json` is an array of `FarmUpgrade`: tools Axe, Pickaxe, Hoe, Watering Can at Copper (2,000g, 5 Copper Bar), Steel (5,000g, 5 Iron Bar), Gold (10,000g, 5 Gold Bar), Iridium (25,000g, 5 Iridium Bar); Trash Can at Copper 1,000g, Steel 2,500g, Gold 5,000g, Iridium 12,500g with the same bars; ids like `tool:Axe:1` to `tool:Axe:4`. House: `house:1` Kitchen 10,000g and 450 Wood, `house:2` Children's room 65,000g and 100 Hardwood, `house:3` Cellar 100,000g. Backpack: `backpack:1` Large Pack 2,000g, `backpack:2` Deluxe Pack 10,000g.

- [ ] **Step 1: Write failing tests in `scripts/farm/resolve.test.mjs`** using small inline fixtures copied from the game shape: `buildingFrom('Big Coop', {Name:'[LocalizedText Strings\\Buildings:BigCoop_Name]', Builder:'Robin', BuildCost:10000, BuildMaterials:[{ItemId:'(O)388',Amount:400},{ItemId:'(O)390',Amount:150}], BuildDays:2, MaxOccupants:8, BuildingToUpgrade:'Coop'}, {BigCoop_Name:'Big Coop'}, {'388':{Name:'Wood'},'390':{Name:'Stone'}})` returns name `Big Coop`, materials `[{item:'Wood',amount:400},{item:'Stone',amount:150}]`, capacity 8, `upgradesFrom` `Coop`; a building with `MaxOccupants: 20` and no `ValidOccupantTypes` has `capacity: null` unless its id is a Coop or Barn chain member; `BuildMaterials: null` gives `materials: []`; `cropFrom('473', {Seasons:['Spring'],DaysInPhase:[1,1,1,3,4],RegrowDays:3,HarvestItemId:'188'}, {'473':{Name:'Bean Starter'},'188':{Name:'Green Bean'}})` gives `daysToGrow: 10`, `regrowDays: 3`, `name: 'Green Bean'`, `seeds: 'Bean Starter'`, `seasons: ['spring']`; `RegrowDays: -1` gives `regrowDays: null`; `animalFrom('Brown Chicken', {House:'Coop',PurchasePrice:-1,DaysToMature:3})` gives `price: null`.
- [ ] **Step 2: Run `npx vitest run scripts/farm`.** Expected: FAIL (module not found).
- [ ] **Step 3: Implement `resolve.mjs`.** A localized name is `[LocalizedText Strings\Buildings:<Key>]`; take the part after the colon and look it up in `strings`. Capacity is `MaxOccupants` for ids in the Coop and Barn chains only (`Coop`, `Big Coop`, `Deluxe Coop`, `Barn`, `Big Barn`, `Deluxe Barn`), else null. Material `ItemId` is `(O)<id>`; strip the prefix and look up `objects[id].Name`, throwing a clear error naming the id when missing. `daysToGrow` is the sum of `DaysInPhase`; seasons are lower-cased.
- [ ] **Step 4: Implement `build-farm-data.mjs`** (same shape as `scripts/schedules/build-schedules.mjs`: exit with a message if `Content (unpacked)` is missing; read `Data/Buildings.json`, `Data/Crops.json`, `Data/FarmAnimals.json`, `Data/Objects.json`, `Strings/Buildings.json`; strip a leading BOM; write the three JSON files sorted by id with a trailing newline). Keep only `KEEP_BUILDINGS`; keep crops whose `Seasons` is non-empty and whose seed and harvest ids exist in `Objects`; skip the Dinosaur and other animals with `House` outside Coop and Barn. Add the npm script, add the types, and write `farm-upgrades.json`.
- [ ] **Step 5: Run `npm run farm` then `npx vitest run scripts/farm`.** Expected: files written (print the counts); tests PASS.
- [ ] **Step 6: Write `src/data/farm-data.test.ts`:** every building's `upgradesFrom` (when set) names another building; every material item of every building is a key of `item-icons.json` (Wood, Stone, Hardwood, Iron Bar and so on), failing with the item name; ids are unique in each file; every crop has `daysToGrow >= 1` and at least one season; every `farm-upgrades.json` entry has a positive cost and unique id; Coop and Barn chains have capacities 4, 8, 12.
- [ ] **Step 7: Run `npx vitest run src/data/farm-data.test.ts`.** If a material has no icon, add it to the data test's `ICONLESS` set only for the hand-checked upgrade bars that bundles lack (Iridium Bar), and write the reason in a comment. Expected: PASS.
- [ ] **Step 8: Wiki check.** In the built-in browser open stardewvalleywiki.com `Tools`, `Backpack` and `Farmhouse` and confirm every number in `farm-upgrades.json`; fix any mismatch in the file. Record the checked pages in the commit message.
- [ ] **Step 9: Commit**

```bash
git add scripts/farm src/data package.json
git commit -m "feat: farm data script and generated farm data"
```

---

### Task 3: Farm in the save

**Files:**
- Create: `src/state/farm-save.ts`, `src/state/farm-save.test.ts`
- Modify: `src/data/types.ts` (types below, `SaveData.farm: FarmData`), `src/state/save.ts` (default and parse), `src/state/SaveContext.tsx` (`updateFarm`), `src/state/SaveContext.test.tsx`

**Interfaces:**
- Consumes: `SEASONS` from Task 1.
- Produces in `src/data/types.ts`:
  - `PlantedCrop { id: string; crop: string; count: number; season: Season; day: number; lastHarvest?: { season: Season; day: number } }` (`crop` is a `FarmCrop.id`)
  - `FarmAnimal { id: string; type: string; name: string; home: 'Coop' | 'Barn' }`
  - `FarmData { buildings: Record<string, number>; animals: FarmAnimal[]; crops: PlantedCrop[]; tools: Record<string, number>; skills: Record<string, number>; gold: number; saving: string | null }`. Chains store a level (0 to 3) under the root id (`Coop`, `Barn`, `Shed`); other buildings store a count 0 to 99.
- Produces in `farm-save.ts`: `defaultFarm(): FarmData` (all empty, skills `{}`, gold 0, saving null), `parseFarm(raw: unknown): FarmData | null` (null means invalid), and the constants `TOOLS = ['Axe','Pickaxe','Hoe','Watering Can','Trash Can']`, `SKILLS = ['Farming','Mining','Foraging','Fishing','Combat']`.
- Produces on `SaveApi`: `updateFarm: (fn: (f: FarmData) => FarmData) => void` (same pattern as `updateClock`: marks dirty, sets state).

- [ ] **Step 1: Write failing tests in `farm-save.test.ts`:** `parseFarm(defaultFarm())` round-trips; rejects (returns null) `gold: -1`, a tool level 5, a skill level 11, a crop day 29, an unknown season, a crop `count: 0`, duplicate crop or animal ids, a non-integer count, and a home that is not Coop or Barn; unknown building, crop and animal ids are accepted; unknown keys are dropped. In `save.test.ts` (existing file): a save with no `farm` parses to `defaultFarm()`, one with an invalid `farm` returns `{ ok: false, error: 'The save farm is invalid.' }`, and `serializeSave` includes `farm`.
- [ ] **Step 2: Run `npx vitest run src/state`.** Expected: new tests FAIL.
- [ ] **Step 3: Implement** `farm-save.ts` (validation helpers local to the file), wire `defaultSave()` and `parseSave`, add `updateFarm` to `SaveContext` with a test that calling it saves to localStorage and survives a remount.
- [ ] **Step 4: Run `npx tsc -b` then `npx vitest run`.** Expected: type errors in tests that build a `SaveData` by hand get `farm: defaultFarm()` and then PASS.
- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: save the farm tracker data"
```

---

### Task 4: Farm calculations

**Files:**
- Create: `src/data/farm.ts`, `src/data/farm.test.ts`

**Interfaces:**
- Consumes: `dayIndex`, `fromIndex`, `daysUntil` (Task 1); `FarmBuilding`, `FarmCrop`, `FarmUpgrade`, `FarmData`, `PlantedCrop`, `Clock` types.
- Produces:
  - `type Harvest = { season: Season; day: number; finishes: boolean }`
  - `harvestDate(entry: PlantedCrop, crop: FarmCrop): Harvest`: from `lastHarvest` plus `regrowDays` when `entry.lastHarvest` is set and the crop regrows, else from the planted date plus `daysToGrow`. `finishes` is false when a season boundary is crossed into a season not in `crop.seasons`.
  - `harvestStatus(h: Harvest, now: { season: Season; day: number } | null): 'ready' | 'tomorrow' | 'later' | 'wont-finish'` (no clock means Spring 1; `wont-finish` takes priority over the others).
  - `harvest(entry: PlantedCrop, crop: FarmCrop, now: { season: Season; day: number }): PlantedCrop | null` (null removes a one-time crop; a regrowing crop gets `lastHarvest: now`).
  - `chainLevels(buildings: FarmBuilding[]): Record<string, FarmBuilding[]>` (root id to its chain ordered by level; a building with no `upgradesFrom` and no one upgrading from it has a chain of length one).
  - `houseCapacity(buildings: FarmBuilding[], owned: Record<string, number>, house: 'Coop' | 'Barn'): number` (0 when level 0).
  - `capacityUsage(farm: FarmData, buildings: FarmBuilding[]): { house: 'Coop' | 'Barn'; used: number; max: number }[]`
  - `savingOptions(buildings: FarmBuilding[], upgrades: FarmUpgrade[]): { id: string; label: string; cost: number }[]` (ids `building:<id>` for each building's next unbuilt level, and the upgrade ids as they are)
  - `savingProgress(farm: FarmData, options: ReturnType<typeof savingOptions>): { label: string; cost: number; fraction: number } | null` (fraction clamped to 1; null when nothing is chosen or the id is unknown)

- [ ] **Step 1: Write failing tests** with a small fixture crops list (Parsnip: spring, 4 days, no regrow; Green Bean: spring, 10 days, regrow 3; Corn: summer and fall, 14 days, regrow 4). Assertions: Parsnip planted spring 1 is ready spring 5 and finishes; Parsnip planted spring 24 is ready spring 28 and finishes; Parsnip planted spring 25 is ready summer 1 and `finishes` is false; Corn planted summer 20 is ready fall 6 and finishes (crosses into fall, which is allowed); Green Bean planted spring 5 is ready spring 15; after `harvest(...)` at spring 15 it has `lastHarvest` spring 15 and `harvestDate` is spring 18; a Green Bean harvested on spring 27 gives `harvestDate` summer 2 with `finishes: false`; `harvest` of a Parsnip returns null; `harvestStatus` returns `ready` on the day, `tomorrow` the day before, `later` earlier, `wont-finish` for an unfinishable one, and treats a null clock as Spring 1; `houseCapacity` gives 0 at level 0 and 4, 8, 12 at levels 1 to 3 for the Coop chain; `capacityUsage` counts animals by home; `savingProgress` returns 0.5 for 1,000g of 2,000g and clamps to 1.
- [ ] **Step 2: Run `npx vitest run src/data/farm.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement** `farm.ts`.
- [ ] **Step 4: Run the test file.** Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/data
git commit -m "feat: farm harvest, capacity and saving calculations"
```

---

### Task 5: Farm tab shell, Crops card and Ready to harvest on Today

**Files:**
- Create: `src/views/FarmView.tsx`, `src/views/FarmView.test.tsx`, `src/components/farm/CropsCard.tsx`, `src/components/farm/CropsCard.test.tsx`, `src/components/today/ReadyCard.tsx`, `src/components/today/ReadyCard.test.tsx`, `src/data/farm-lookup.ts`
- Modify: `src/App.tsx` (route `/farm` renders `FarmView`), `src/views/PathView.tsx` (add `<ReadyCard />` to the aside after `NextGoalCard`), `src/styles.css`

**Interfaces:**
- Consumes: `FarmCrop` data (`farm-crops.json`), `harvestDate`, `harvestStatus`, `harvest` (Task 4), `updateFarm` (Task 3), `Masonry`, `ItemIcon`, `fromIndex`/`daysUntil` (Task 1).
- Produces:
  - `src/data/farm-lookup.ts`: `CROPS: FarmCrop[]`, `cropById(id: string): FarmCrop | undefined`, `BUILDINGS: FarmBuilding[]`, `ANIMAL_TYPES: FarmAnimalType[]`, `UPGRADES: FarmUpgrade[]` (typed casts of the JSON, so other tasks and tests can mock one module).
  - `FarmView` (default export): `<h1>Farm</h1>` and `<Masonry>` of cards; this task adds `CropsCard`, later tasks add the others in the order Buildings, Animals, Crops, Progress.
  - `CropsCard`: a form with a crop `<select>` (aria-label `Crop`, options are `CROPS` valid in the clock's season or Spring), a number input (`Count`, default 1, min 1), and `Add crop`; the planting date is the clock date (or Spring 1) shown as "Planted Spring 5" with a `Change date` control that reveals a season select and day input (aria-labels `Planted season`, `Planted day`). Each entry row: pictured by `ItemIcon` of the crop name, "10 Green Bean, ready Spring 15 (in 4 days)" or "Will not finish this season" or "Ready now", a `Harvested` button (accessible name `Harvest <crop name>`), and a `Remove` button. An entry whose crop id is unknown shows "Unknown crop" and only `Remove`. A note says "Only what you record here is tracked."
  - `ReadyCard`: aside card titled "Ready to harvest", lists entries whose status is `ready` or `tomorrow` ("Ready now" or "Tomorrow") with count and crop name and the same `Harvested` button; returns null when there is no clock or nothing qualifies.

- [ ] **Step 1: Write failing tests.** `CropsCard.test.tsx` (mock `../../data/farm-lookup` with a three-crop fixture): adding Parsnip x3 on a clock at spring 1 saves an entry with season spring day 1 and the row reads "ready Spring 5 (in 4 days)"; with the clock at summer the select lists only summer crops; Change date lets planting be set to spring 26 and the row then reads "Will not finish this season"; `Harvested` removes a Parsnip, and for Green Bean keeps the row and shows the new ready date; `Remove` deletes; an entry with an unknown crop id shows "Unknown crop"; with no clock the select offers spring crops. `ReadyCard.test.tsx`: hidden with no clock, hidden when nothing is ready, shows a crop ready today and one ready tomorrow with the right labels, never shows a `wont-finish` crop, and `Harvested` there updates the saved entry. `FarmView.test.tsx`: renders "Farm" heading and a "Crops in the ground" card; the Farm route in `App.test.tsx` no longer shows "Coming soon".
- [ ] **Step 2: Run `npx vitest run src/views/FarmView.test.tsx src/components/farm src/components/today/ReadyCard.test.tsx`.** Expected: FAIL.
- [ ] **Step 3: Implement** the files above and the styles (crop rows reuse `path-row plan-row`; add buttons use `btn-small`; `.no-print` hidden in print for the add form and remove buttons).
- [ ] **Step 4: Run `npx vitest run`.** Expected: PASS (the existing PathView aside-order test must still pass; add the Ready card after Next goal and update only if that test names the full heading list).
- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: farm tab with crops tracker and Ready to harvest on Today"
```

---

### Task 6: Buildings card

**Files:**
- Create: `src/components/farm/BuildingsCard.tsx`, `src/components/farm/BuildingsCard.test.tsx`
- Modify: `src/views/FarmView.tsx` (add the card first)

**Interfaces:**
- Consumes: `BUILDINGS`, `UPGRADES` from `farm-lookup`; `chainLevels` (Task 4); `updateFarm`; `ItemIcon`.
- Produces: `BuildingsCard` titled "Buildings". Chain families (root ids from `chainLevels` with more than one member) render a level `<select>` (aria-label `<root name> level`, options "Not built", then each level name) and, below, the next level's cost and materials as pictures. Single buildings render a checkbox named by the building (for example Well, Silo, Mill and the obelisks), except Cabin, Fish Pond, Stable, Junimo Hut and Pet Bowl which take a count stepper (`Add <name>`, `Remove <name>`, min 0, max 99). House upgrades from `UPGRADES` (group `house`) render as three checkboxes that must be ticked in order (a later one stays disabled until the earlier is ticked), stored in `farm.buildings` under `house:1` to `house:3` with value 0 or 1. The first unbuilt building or upgrade row has the class `next`. Unknown ids in `farm.buildings` list as "Unknown building" with the count and a `Remove` button.

- [ ] **Step 1: Write failing tests** (mock `farm-lookup` with a Coop chain, a Well, a Cabin and the three house upgrades): choosing "Big Coop" in the Coop select saves `buildings.Coop = 2`; the next-level cost for a level-2 Coop shows 20,000g; ticking the Well saves `buildings.Well = 1`; the Cabin stepper increments and cannot go below 0; house upgrade 2 is disabled until 1 is ticked and unticking 1 also clears 2 and 3; the first unbuilt row has `next`; an unknown saved id shows "Unknown building".
- [ ] **Step 2: Run the test file.** Expected: FAIL.
- [ ] **Step 3: Implement** `BuildingsCard` and add it to `FarmView`.
- [ ] **Step 4: Run `npx vitest run src/components/farm src/views`.** Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: farm buildings and house upgrades card"
```

---

### Task 7: Animals card

**Files:**
- Create: `src/components/farm/AnimalsCard.tsx`, `src/components/farm/AnimalsCard.test.tsx`
- Modify: `src/views/FarmView.tsx`

**Interfaces:**
- Consumes: `ANIMAL_TYPES`, `BUILDINGS` from `farm-lookup`; `capacityUsage`, `houseCapacity` (Task 4); `updateFarm`; `farm.buildings`.
- Produces: `AnimalsCard` titled "Animals". An add form: animal type select (`Animal type`, options from `ANIMAL_TYPES`), a text input (`Animal name`, required, trimmed), a home select (`Home`, offering only Coop or Barn homes that match the type's `house` and have level 1 or more; disabled with the hint "Build a Coop first" or "Build a Barn first" when none), and `Add animal`. A capacity line per house: "Coop 3 of 4" (`capacityUsage`), with a warning "Over capacity" when used exceeds max and "No building" when animals live in a house whose level is 0. Each animal row shows name, type and home, and a `Remove <name>` button. An animal with an unknown type shows "Unknown animal".

- [ ] **Step 1: Write failing tests** (mock `farm-lookup`: Coop chain capacities 4, 8, 12; White Chicken and Duck in the Coop, White Cow in the Barn; set `buildings.Coop = 1` in the seeded save): the home select lists Coop for a chicken and shows the hint for a cow with no Barn; adding "Clucky" saves `{type:'White Chicken', name:'Clucky', home:'Coop'}`; "Coop 1 of 4" updates; the fifth animal shows "Over capacity"; lowering the Coop to level 0 shows "No building"; blank names are rejected (nothing saved); removing works; an unknown type shows "Unknown animal".
- [ ] **Step 2: Run the test file.** Expected: FAIL.
- [ ] **Step 3: Implement** `AnimalsCard` and add it to `FarmView` after Buildings.
- [ ] **Step 4: Run `npx vitest run src/components/farm src/views`.** Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: farm animals card with capacity warnings"
```

---

### Task 8: Progress card

**Files:**
- Create: `src/components/farm/ProgressCard.tsx`, `src/components/farm/ProgressCard.test.tsx`
- Modify: `src/views/FarmView.tsx`

**Interfaces:**
- Consumes: `UPGRADES`, `BUILDINGS` from `farm-lookup`; `savingOptions`, `savingProgress` (Task 4); `TOOLS`, `SKILLS` (Task 3); `updateFarm`; `ItemIcon`.
- Produces: `ProgressCard` titled "Progress". For each tool in `TOOLS`: a level `<select>` (aria-label `<tool> level`, options Basic, Copper, Steel, Gold, Iridium; `farm.tools[tool]` 0 to 4) and the next upgrade's cost and bar pictures (from the `tool:<Tool>:<n>` upgrades; "Fully upgraded" at 4). For each skill in `SKILLS`: a number input (`<skill> level`, 0 to 10, integers). A gold number input (`Gold`, 0 or more, whole numbers; blank counts as 0). A "Saving for" select (`Saving for`, a first option `Nothing`, then `savingOptions`) with a progress bar element (`role="progressbar"`, `aria-valuenow` the percentage) and the text "1,000g of 2,000g".

- [ ] **Step 1: Write failing tests:** choosing Copper for the Axe saves `tools.Axe = 1` and the next-cost line shows the Steel cost; Iridium shows "Fully upgraded"; a skill input of 11 clamps to 10 and a negative clamps to 0; gold saves as an integer and an empty box saves 0; picking Large Pack with 1,000g gold shows 50% and "1,000g of 2,000g"; choosing Nothing hides the bar; an unknown saved `saving` id shows nothing selected and no bar.
- [ ] **Step 2: Run the test file.** Expected: FAIL.
- [ ] **Step 3: Implement** `ProgressCard` and add it to `FarmView` last.
- [ ] **Step 4: Run `npx vitest run src/components/farm src/views`.** Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: farm progress card for tools, skills, gold and saving goal"
```

---

### Task 9: README and final verification

**Files:**
- Modify: `README.md`, `docs/superpowers/specs/2026-10-30-farm-tracker-design.md` (record the two rulings above under a "Plan adjustments" heading)

- [ ] **Step 1: Update the README:** Features (Farm tab tracker with four cards, Ready to harvest on Today, Export/Import includes the farm), remove the "Farm tab is a placeholder" bullet, Roadmap item 5 becomes "Farm tracker (done); farm layout uploads later", the `npm run farm` command with a note that it needs the unpacked game, and the Your data section mentions the farm section; credit the wiki for the upgrade table.
- [ ] **Step 2: Run `npm run build`, `npm run lint` and `npm test`.** Expected: all succeed with no type or test failures (the two existing lint warnings are fine).
- [ ] **Step 3: Play-through with `npm run dev`:** set the clock to a few dates, add crops, check Ready to harvest on Today (ready, tomorrow, will not finish), add a coop and animals and trigger the capacity warnings, set tool levels and a saving goal, export and re-import the save, and check the Farm tab at phone width and in print preview.
- [ ] **Step 4: Commit**

```bash
git add README.md docs
git commit -m "docs: README for the farm tracker"
```

---

## Self-Review

- **Spec coverage:** data and script (Task 2), save format and validation (Task 3), calculations (Task 4), Crops card and Today card (Task 5), Buildings with chains and house upgrades (Task 6), Animals with capacity (Task 7), Progress with tools, skills, gold and saving (Task 8), README and verification (Task 9). Print and accessibility rules are in Global Constraints and the card tasks' accessible names. Out of scope items are not planned.
- **Type consistency:** `FarmData`, `PlantedCrop`, `FarmAnimal` are defined once in Task 3 and consumed by Tasks 4 to 8; `farm-lookup.ts` (Task 5) is the single import point for data used in Tasks 6 to 8; `updateFarm` has one signature.
- **Deviations from the spec** are recorded as rulings in Global Constraints and copied into the spec in Task 9.
