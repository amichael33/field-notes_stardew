# Field Notes: Saving and Today Layout (Sub-project 2)

## Purpose
Make the site usable during a playthrough: progress, notes and the route choice survive a reload, and the Today page gets the dashboard layout from the author's mockup. Everything stays in the browser, with no accounts or backend. Parts of the mockup that need the game clock or schedule data (sub-project 3) appear as clearly marked placeholders so the layout matches the mockup and the later work drops in.

## Decisions
- Saved state is one versioned object in localStorage, held in a React context (`SaveProvider`, `useSave()`), mirroring `AppState`.
- Export downloads that object as JSON. Import validates it before replacing anything.
- `season` stays unsaved UI state. `route` moves into the saved profile.
- The 7 opening milestones in the ribbon are the first 7 steps of `path-steps.json` (orders 1 to 7). Editing the path edits the ribbon.
- Fonts are unchanged (Fisherman headings stay). The mockup's font note is ignored. All other styling (colors, spacing, 900px breakpoint, 44px touch targets, print rules) follows the mockup.

## Saved data
```ts
interface SaveData {
  version: 1
  profile: { route: Route; farmType: string }
  checked: string[]   // ids such as 'path:3'; 'bundle:...' and 'ach:...' can follow without a format change
  notes: string
}
```
- `src/state/save.ts` holds pure functions: `defaultSave()`, `parseSave(json: string): { ok: true; data: SaveData } | { ok: false; error: string }`, `toggleChecked(save, id)`, `serializeSave(save)`.
- `SaveProvider` loads from localStorage on start, falls back to defaults if the value is missing, corrupt or the storage accessor throws, and writes on every change. A failed write shows a small "Couldn't save" notice and the app keeps working.
- `parseSave` rejects non-JSON, a wrong or newer `version`, and wrong field types. On any failure Import shows an error and changes nothing.
- `farmType` is a free choice stored in the profile. A picker UI beyond a simple select is out of scope.

## Layout
**Header** (`Layout.tsx`): logo, nav tabs, actions Print, Export, Import. Export downloads `field-notes-save.json`. Import opens a file picker and shows an inline success or error message. Hidden in print.

**Today page** (`PathView.tsx`, with components in `src/components/today/`):
1. `StatusBanner`: dark card. Shows the season and day of the next unchecked dated step as the stand-in date. The clock block, Pause/-10/+10/Resync and the Sunny/Rain toggle are disabled and labelled "coming with the clock".
2. `PathRibbon`: 7 chips from path steps 1 to 7, clickable to toggle done, header "x of 7 on track" (ticked count). 7 columns, 4 at 900px or less.
3. Two-column grid `minmax(0,1.55fr) minmax(0,1fr)`, one column at 900px or less with the path card first.
   - `PathCard` "Today's path": rows are a `78px 1fr` grid. The left cell shows the step's label ("Spring 2", or the season alone) instead of a time. Each row has a checkbox. Done rows at 65% opacity. The first unchecked row has the amber "next up" border and pale amber background. The count tag shows done/total. A static rain-day info banner sits above the list. Rainy steps keep their "Rainy day" badge.
   - Aside cards, in this order:
     1. **Notes for tomorrow**: textarea saved on change.
     2. **Next goal**: the first unchecked step among orders 9 and 10 (the money and goal steps); an empty state when both are ticked.
     3. **Needed this season**: bundles with name and count, progress bar, "Still needed" list, driven by the existing season filter. Bundle items are not checkable yet, so progress reads 0 of N. The Joja route shows the existing "not used on the Joja route" message.
     4. **Where is everyone**: conditional, see below. Always last.
4. The Recipes list stays below the grid. The footer disclaimer is unchanged.

The Notes tab renders a larger textarea bound to the same `notes` field. There is no second store.

**Print:** hide the header, banner controls and weather toggle. Cards stack in one column on white.

## Where is everyone
Rendered only when both are true:
1. The "Meet the town" step (order 2) is not checked.
2. At least one unchecked path step mentions a person or a shop.

It lists each person or shop with the task that mentions them (e.g. "Willy: Get your fishing pole from Willy (Spring 2)"). It has no times or locations yet. When either condition fails the card is not rendered and the aside has three cards.

`peopleToVisit(steps, checked, villagers)` in `src/data/selectors.ts` is pure. It matches, as whole words in an unchecked step's title or detail, any villager name from `villagers.json`, plus phrases like "Pierre's General Store" or "Willy's Fish Shop", attributed to the owner.

## Testing
- **Unit:** `save.ts` (defaults, toggle, `parseSave` valid input and rejections for bad JSON, wrong version, wrong types), `peopleToVisit`, ribbon count.
- **View:**
  - Ticking a row dims it and moves "next up" to the next unchecked row.
  - Notes persist across a remount.
  - Export outputs the stored object and Import replaces it. A bad import shows an error and leaves data unchanged.
  - "Where is everyone" hides after "Meet the town" is ticked and when nothing pending mentions anyone.
  - The Joja route shows the "not used" message in "Needed this season".

## Review focus
1. localStorage missing, corrupt or throwing: the app loads with defaults and does not crash.
2. Importing a file with a newer `version`: rejected with a clear message, data unchanged.
3. All 7 ribbon steps ticked: shows "7 of 7" with no "next up" crash.
4. Every step ticked: "Next goal" shows its empty state.
5. A very long note: saves and renders without breaking the layout.

## Out of scope
Working clock, weather, villager schedules and times, farm layout and uploads, checkable bundle items and achievements, a farm-type picker beyond a simple select, and the optimizer.
