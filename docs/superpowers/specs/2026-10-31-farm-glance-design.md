# Field Notes: Farm Tab Redesign, "at a glance" (Sub-project 5b)

Supersedes the UI of `2026-10-30-farm-tracker-design.md`. That spec's data, calculations and save validation stay; its four form-style cards are replaced.

## Purpose
The first Farm tab felt like filling in a form. This redesign makes it a calm page you glance at: what is ready to harvest, the one building you are working toward, and small picture tiles for what is planted, built and living on the farm. Editing happens by tapping pictures, with almost no typing.

## Decisions (from brainstorming, 2026-10-31)
- **Layout A, "at a glance".** Two columns: **Ready today** and **Next goal** on the left; a narrow right column of three small boxes, **Crops planted**, **Buildings**, **Animals**. On narrow screens the right column drops below the left.
- **No Edit farm button, no popups.** Tapping a tile opens a small action row inside its box; tapping **+** opens a picture grid inside its box.
- **Tracked:** crops, buildings (including house upgrades) and animals. **Dropped:** tools, skills, gold and the saving picker.
- **Animals are counted per type** (Chicken ×2), not named individually.
- **Next goal** is one building or house upgrade, shown on the Farm page and on the Today tab's Next goal card.
- The Today tab keeps its **Ready to harvest** card.
- Sprites come from the player's unpacked game, like the item icons, portraits and maps.

## What carries over (feat/farm-tracker)
Kept: `npm run farm` and the generated `farm-buildings.json`, `farm-animals.json`, `farm-crops.json`; `src/data/calendar.ts`; `src/data/farm.ts` harvest functions (`harvestDate`, `harvestStatus` with the `season-over` status, `harvest`) and `chainLevels`, `houseCapacity`, `capacityUsage`; `src/data/farm-lookup.ts`; the Today `ReadyCard`; save validation style.
Replaced: `BuildingsCard`, `AnimalsCard`, `CropsCard`, `ProgressCard` and `FarmView`'s content.
Dropped: tools, skills, gold, `saving`, `savingOptions`, `savingProgress`, the tool and backpack rows of `farm-upgrades.json` (house upgrades stay).

## Sprites
`npm run farm` also writes sprites to `public/farm/`:
- `buildings/<id>.png`: each kept building's texture from `Content (unpacked)/Buildings/<Name>.png`, cropped to the building's `SourceRect` from `Data/Buildings.json` when it has one, otherwise the whole image. House upgrades have no sprite and use the lettered tile.
- `animals/<type>.png`: the first 16x16 (Coop animals) or 32x32 (Barn animals) frame of `Content (unpacked)/Animals/<Type>.png`.
- Crop pictures use the existing item icons (`ItemIcon` falls back to an initials tile).
A JSON map `src/data/farm-sprites.json` lists which sprites exist; tiles fall back to a lettered tile when one is missing.

## Save format
`SaveData.farm` (version stays 1; absent loads as empty):
```
farm: {
  buildings: Record<string, number>  // as before: chain root -> level 0-3, others count 0-99, house:N 0/1
  animals: Record<string, number>    // animal type -> count 0-99
  crops: PlantedCrop[]               // unchanged, including optional lastHarvest
  goal: string | null                // building id, or house:N
}
```
The farm was never published, so the earlier shape (animals list, tools, skills, gold, saving) is not migrated; a stored farm in the old shape is read leniently: `animals` arrays are converted to counts per type, and unknown keys are dropped.

## UI
### Ready today (left)
- Crops whose status is `ready` (Ready now) or `tomorrow` (Tomorrow): picture, count and name, and a **Harvested** button on ready ones.
- Crops whose status is `season-over`: "Died at the season change" with **Remove**.
- **Coming up:** the next three later harvests as text, "Green Bean ×10, Spring 15 (in 3 days)".
- Empty state: "Nothing to harvest today." plus the next harvest when there is one, or "Plant something in Crops planted."
- With no clock the dates count from Spring 1.

### Next goal (left)
- When set: the building's sprite, name, builder and build days, gold cost, and materials as item pictures with amounts; a **Clear** button.
- When not set: "Pick a goal with ★ in Buildings."
- Building the goal (its level or count reaching the goal) clears it automatically.

### Crops planted (right)
- One tile per planted entry: crop picture and count badge. Tapping a tile shows an action row: crop name and ready date, **Harvested** (hidden unless ready), **Remove**.
- **+** opens a picture grid of crops for the current season (clock season, or Spring), sorted by name, labelled by harvest name with the seed name added when different (forage seed mixes use the seed name). Picking one shows a count stepper (default 1) and **Plant**, which plants on the clock's date.

### Buildings (right)
- One tile per built building: sprite and, for chains, the current level's sprite; a count badge for counted buildings (Cabin, Fish Pond, Stable, Junimo Hut, Pet Bowl); house upgrades as tiles once built.
- Tapping a tile shows an action row: **Upgrade** (when a next chain level or house upgrade exists), **Remove** (one level down for chains, one fewer for counts), and **★ Set as goal** for the next upgrade.
- **+** opens a grid of unbuilt buildings and the next house upgrade, each with **Build** and **★ Set as goal**; the grid is sorted by gold cost so early buildings come first.

### Animals (right)
- One tile per type with a count badge; tapping shows **+1** and **−1** (removing the last one removes the tile).
- **+** opens a grid of animal types whose house (Coop or Barn) is built.
- Under the tiles: "Coop 2 of 8", "Barn 0 of 4", with "Over capacity" or "No coop/barn built" warnings.

### Today tab
- `ReadyCard` unchanged in behavior.
- `NextGoalCard` keeps the plan's next task and adds, below it, "Building goal: <name>, <cost>" with the materials as pictures when a goal is set.

## Accessibility and print
Tiles are buttons with accessible names ("Parsnip, 15 planted"); action rows are labelled regions; the + grids are lists of buttons; 44px touch targets; print shows the left column and the tiles without + and action rows.

## Testing
- Pure helpers: goal status (set, cleared when built), capacity by type count, crop picker ordering and labels, lenient reading of the old farm shape.
- Components: each box (add, tap actions, remove, goal star), Ready today (ready, tomorrow, coming up, empty, season-over), Next goal (set, clear, auto-clear), Today's Next goal showing the building goal.
- Data: every kept building and animal type has a sprite entry or an explicit fallback reason.

## Out of scope
Tools, skills, gold, saving goals, named animals, a drawn farm map, fruit trees, greenhouse planting.

## Plan adjustments

- Crop picker labels add the seed name only when it differs from "<crop> Seeds". Forage seed mixes are labelled with the seed name alone.
- A `.prettierrc.json` (single quotes, no semicolons, print width 110) was added so formatters match the codebase.
- The **+** tile in Animals is disabled whenever no coop or barn is built.
