# Field Notes: Game Clock and Villager Schedules (Sub-project 3a)

## Purpose
Let the site run beside the game. The player presses **Start day** when the Stardew day begins, and a manual clock tracks the in-game date and time. With the clock running, the "Where is everyone" card shows where the villagers and shop owners named in the player's unchecked plan steps are right now and what they do next. Nothing is read from the game, and everything stays in the browser.

The structured day-by-day year 1 plan (sub-project 3b) is a separate cycle that will build on this clock.

## Decisions
- The clock is manual: the player starts it, pauses it, nudges it and corrects it. It never reads the game.
- Start day moves to the next date after a day ends. The player never retypes the date.
- A reload restores a running clock as paused at the saved time, because a closed tab cannot know how long it was away.
- The clock is saved in `SaveData`, so Export and Import carry the last day.
- Schedules come from the unpacked game files (`Content (unpacked)/Characters/schedules/*.json`), not the wiki. They are trimmed at build time and resolved in the browser by a pure function.
- Where is everyone shows only the villagers and shops named in unchecked plan steps (the existing `peopleToVisit` match), now with live locations. There is no "show everyone" view in this cycle.
- Schedules cover normal days only: weather, exact date, weekday and season rules. Heart-level rules are skipped (0 hearts is assumed). Marriage, festival and `GreenRain` entries are skipped.

## Clock
```ts
clock: {
  season: Season
  day: number                       // 1-28
  minutes: number                   // minutes since midnight, 360 (6:00 AM) to 1560 (2:00 AM)
  weather: 'sunny' | 'rain'
  status: 'idle' | 'running' | 'paused' | 'ended'
} | null                            // null until Start day is first pressed
```
`SaveData.clock` is optional. A v1 save without it loads as `null`, so there is no version bump and no migration. `parseSave` validates the field with the same rules as the rest, and a malformed `clock` rejects the import.

### Behaviour
- **Speed:** 10 game minutes per 7 real seconds (Stardew's pace).
- **Start day:** from `null` it begins Spring 1 at 6:00 AM, running. After `ended` it advances to the next date (a season rolls over after day 28), resets to 6:00 AM, sets weather to Sunny and runs.
- **Day end:** reaching 2:00 AM sets status `ended` and shows "Day over".
- **Pause / Resume:** toggle `running` and `paused`.
- **-10 / +10:** move the time by 10 minutes, clamped to 6:00 AM to 2:00 AM.
- **Set time and date:** an inline control edits season, day and time directly. It replaces the mockup's Resync.
- **Weather:** the Sunny/Rain toggle is live and re-resolves schedules.
- **Reload:** `running` is restored as `paused`.
- **Weekday:** day 1 is Monday, so the weekday is `(day - 1) % 7` (0 = Monday).

### Implementation
- `src/state/clock.ts` is pure: `startDay`, `tick`, `nudge`, `setClock`, `weekdayOf`.
- The running clock computes elapsed real time from a timestamp, not a counted interval, so background-tab throttling cannot make it lag.
- `StatusBanner` replaces its disabled "coming with the clock" controls with the real ones. When `clock` is `null` it keeps the current stand-in date from the next unchecked dated step.
- `SaveContext` holds the clock in the saved object and writes it on every change like the rest.

## Schedule data
### Build script
`npm run schedules` runs `scripts/schedules/build-schedules.mjs`, modeled on `npm run icons`.
- Reads `Content (unpacked)/Characters/schedules/*.json`. If the folder is missing it exits with a clear message and writes nothing.
- Keeps date (`spring_4`), season plus weekday (`fall_Mon`), weekday (`Fri`), season (`spring`) and `rain` / `rain2` rules. Drops marriage, festival, `GreenRain` and heart-number rules.
- Resolves each `GOTO` to the rule it points at.
- Converts each stop to `{ time, place }`. Times are minutes since midnight (`2530` is 1:30 AM). Dialogue strings and tile coordinates are dropped.
- Maps each map id to a readable place name through a hand table of about 20 entries (`SeedShop` to "Pierre's General Store"). Unknown map ids are printed and the script exits non-zero. A bare `bed` stop becomes "At home".
- Writes `src/data/schedules.json`, keyed by villager name, then rule name, committed like `item-icons.json`.

### Runtime lookups (`src/data/schedules.ts`, pure)
- `scheduleFor(name, season, day, raining): Stop[] | null` applies the priority order: rain, exact date, season plus weekday, weekday, season, then the plain `spring` default. Returns `null` for a villager with no file.
- `locationAt(stops, minutes): { place, since, next? }`. Before the first stop the villager is "At home" with the first stop as `next`. After the last stop they remain there.

### To verify before the plan is final
- The exact precedence of rule types, checked against the game's documented schedule format. Unit tests pin known cases.
- Villagers with both `rain` and `rain2` (for example Abigail): if the game picks between them at random, the site shows `rain` and adds a "may differ on rainy days" note.

## Where is everyone card
`WhereCard` keeps its place (last in the aside) and its hide conditions: hidden when the "Meet the town" step is ticked or no unchecked step names a person or shop. `peopleToVisit` is unchanged.

Each row shows the person or shop owner, where they are now, their next move and the step that mentions them, for example "Pierre: Pierre's General Store since 5:00 PM, then Saloon at 5:00 PM" with the step "Meet the town". Rows for people the clock places somewhere come first.

| State | Behaviour |
|---|---|
| `clock` is `null` | List people and steps as today, with the note "Press Start day to see where they are." |
| Running or paused | Rows show live location and next move, refreshing as the clock ticks. |
| `ended` | Rows show where each person ended the day. |
| Villager with no schedule file | Row shows the person and step only. |

The old note "Locations by time come with the schedule data" is removed.

## Testing
- **Unit, clock:** `startDay` from `null` and after `ended`, season rollover at day 28, `tick` reaching 2:00 AM, `nudge` clamping, `weekdayOf`, reload turning `running` into `paused`, and `parseSave` accepting a v1 save without `clock` and rejecting a malformed one.
- **Unit, schedules:** `scheduleFor` precedence cases (Pierre's Fri and rain overrides, Abigail's `spring_4`), `GOTO` chains resolving, and `locationAt` before the first stop, exactly on a stop and after the last. Every villager in `villagers.json` resolves for every season and day without throwing.
- **Component:** the banner controls (Start day, Pause, nudge, Set time and date, weather toggle); the card with a fixed clock, with a `null` clock, and past 2:00 AM.
- **Script:** run with a missing content folder (clear message, nothing written), and an unmapped map id fails.

## Out of scope
The day-by-day year 1 plan (3b), a show-everyone view, heart-level and per-villager friendship settings, marriage and festival schedules, tile coordinates or maps, reading the game or a save file, and farm layout.
