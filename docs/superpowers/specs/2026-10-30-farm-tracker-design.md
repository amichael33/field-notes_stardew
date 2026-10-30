# Field Notes: Farm Tracker (Sub-project 5)

## Purpose
The Farm tab is a placeholder. This sub-project turns it into a tracker for the player's own farm: what is built, which animals live where, what is planted and when it is ready, and tool, skill and money progress. It saves in the browser with the rest of the save and uses the game's own data files, so no numbers are typed from memory where the game data has them.

## Decisions (from brainstorming, 2026-10-30)
- **A tracker, not a planner.** No farm map, no drawing, no screenshot upload (these stay out of scope).
- **Four areas:** buildings and house upgrades, animals, crops in the ground, and tools, skills and money.
- **One page, four cards** (Buildings, Animals, Crops, Progress), staggered with the shared `Masonry` layout used on the Community Center and People tabs.
- **Crops surface on Today.** A "Ready to harvest" card on the Today tab lists crops ready now or tomorrow by the game clock, and is hidden when there are none.
- **Data comes from the unpacked game** (`Content (unpacked)/Data/`), the way item icons, portraits and schedules already do. Values the game keeps in code rather than data are a small hand-written table checked against the Stardew Valley wiki (credited in the README).

## Data
A script `scripts/farm/build-farm-data.mjs` (npm run farm) reads the unpacked game and writes JSON into `src/data/`:
- `farm-buildings.json`: from `Buildings.json`. Per building: id, display name, builder, gold cost, materials (item name and amount), build days, max occupants (animals), and the building it upgrades from. Only player-buildable buildings are kept (Coop, Barn, Well, Silo, Mill, Shed, Fish Pond, Cabin, Stable, Slime Hutch, the upgraded coops, barns and sheds, the obelisks, Gold Clock, Junimo Hut, Pet Bowl, Greenhouse).
- `farm-animals.json`: from `FarmAnimals.json`. Per animal: type, house (Coop or Barn), purchase price, days to mature.
- `farm-crops.json`: from `Crops.json` joined to the object names. Per crop: name, seasons, days to first harvest (sum of the growth phases), regrow days or none, harvest item name.
- `farm-upgrades.json` (hand-written, wiki-checked): tool upgrade levels (copper, steel, gold, iridium: gold and bar), house upgrades, and the backpack (Large Pack, Deluxe Pack), since the game keeps these in code.
A data test fails if any building material or crop harvest item name is missing from `item-icons.json`; the fix is to add the icon through `npm run icons`, not to relax the test.

## Save format
`SaveData` gains an optional-on-read `farm` section; the save `version` stays `1`. Saves and imports without it load as an empty farm.

```
farm: {
  buildings: Record<string, number>   // building id -> count built (chains store the highest level owned)
  animals: { id: string; type: string; name: string; home: string }[]   // home = building id
  crops: { id: string; crop: string; count: number; season: Season; day: number }[]  // planted date
  tools: Record<string, number>       // tool -> level 0 to 4
  skills: Record<string, number>      // skill -> level 0 to 10
  gold: number                        // current gold, 0 or more
  saving: string | null               // id of the thing being saved for
}
```
- Import validation rejects wrong types, counts and levels out of range, planting dates outside 1 to 28 or an unknown season, and duplicate ids, with a clear error, like the rest of the save. Unknown building, crop or animal ids are kept (a newer data file may know them) but shown as "Unknown".
- Ids for animals and crops are generated as for custom tasks and are stable.

## UI: the Farm tab
Four cards in `Masonry`. All edits save immediately.
- **Buildings.** Each buildable thing from `farm-buildings.json` with its icon, gold cost and material pictures. Chains (Coop, Big Coop, Deluxe Coop; Barn chain; Shed chain) are one row showing the current level and the next upgrade with its cost. Simple buildings (Well, Silo, Mill, Greenhouse and the obelisks) are a built checkbox. Cabins, fish ponds and stables take a count. The first unbuilt item is highlighted as next. House upgrades come from `farm-upgrades.json`.
- **Animals.** Add by type, with a name and a home building (only buildings you have, and only ones the animal can live in). Each building shows capacity used, for example "Coop 3 of 4" (capacity is `max occupants` of the highest level owned), and a warning if animals exceed it. Remove with one tap.
- **Crops.** Add a crop from the list for the current season, a count, and the planting date, defaulting to the clock's date and editable. Each row shows its harvest day ("Ready Spring 17, in 4 days") from planting date plus days to grow, and regrowing crops show their next harvest day after each harvest. A crop whose harvest day would fall after the end of its last season is flagged "Will not finish this season". A **Harvested** button removes a one-time crop and moves a regrowing crop to its next regrow day.
- **Progress.** Tool upgrade levels (pickaxe, axe, hoe, watering can, trash can) with the next upgrade's cost; the five skill levels (0 to 10); current gold; and a "Saving for" picker (backpack, a building, a tool upgrade, a house upgrade) with a progress bar of gold against its cost.

Without the clock the cards still work: the current season defaults to Spring and relative days read "in N days" from Spring 1.

## UI: Today
A **Ready to harvest** card in the aside lists crops whose harvest day is today or earlier (ready now) or tomorrow, with the count and a Harvested button that does the same as on the Farm tab. It is hidden when nothing is ready or when there is no clock.

## Calculations (pure, in `src/data/farm.ts`)
- `harvestDay(crop, plantedSeason, plantedDay)`: first harvest day as a `{ season, day }` after the growth days, carrying across seasons only when the crop is allowed there; otherwise `finishes: false`.
- `nextHarvest(entry, clock)` for regrow crops.
- `daysUntil(date, clock)`, using the same season-day index (28 days per season) as `plans.ts`.
- `buildingCapacity(buildings, animals)` returns used and max per animal house.
- `savingProgress(save)` returns cost and fraction for the chosen goal.

## Print and accessibility
Cards use the existing card, button and 44px touch-target styles; add and remove controls are hidden when printing; every control has an accessible name; progress bars are decorative with the numbers also written as text.

## Testing
- Unit tests for the calculations (growth across season ends, regrow, rain not involved, capacity, saving progress).
- Save tests for the new section: default for old saves, round trip, rejection of bad values, unknown ids kept.
- Component tests for each card (add, edit, remove, warnings, harvest) and for the Today card (shown, hidden, harvested).
- A data test that every generated item name has an icon, and that every building in the chains has a reachable "upgrade from".

## Verification
`npm run build`, `npm test` and `npm run lint` pass; manual check of the Farm tab and the Today card at desktop and phone width and in print preview; hand-written upgrade numbers spot-checked against the wiki.

## Out of scope
Farm map or layout drawing, farm screenshot upload, reading a game save file, fertilizer or crop quality, profit or gold-per-day math, per-animal friendship or product tracking, and fruit trees.

## Risks
- **Game data shapes change between versions.** The script fails loudly when an expected field is missing, and the generated JSON is committed so the site never depends on the unpacked game at runtime.
- **Hand-written upgrade table drift.** Kept small and covered by the wiki spot check.
- **Crops are entered by hand.** The tracker does not read the game, so it only knows what the player records; the card says so.
