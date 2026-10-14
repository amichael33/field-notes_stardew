# Game Clock and Villager Schedules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A manual in-game clock (Start day, pause, nudge, correct, weather) saved with the player's progress, and a "Where is everyone" card that shows where the people named in unchecked plan steps are right now, from the game's own schedule files.

**Architecture:** Pure clock logic in `src/state/clock.ts`, stored as `SaveData.clock` and advanced by a `ClockRunner` mounted in `Layout`. A build script trims `Content (unpacked)/Characters/schedules/*.json` into `src/data/schedules.json`; pure functions in `src/data/schedules.ts` resolve a day's stops and a location at a time. `WhereCard` joins `peopleToVisit` to those lookups.

**Tech Stack:** React 18, TypeScript, Vitest + Testing Library, Node `.mjs` build scripts (same style as `scripts/icons`).

**Spec:** `docs/superpowers/specs/2026-10-14-clock-and-schedules-design.md`

## Global Constraints
- Clock speed: 10 game minutes per 7 real seconds. Day runs 6:00 AM (360) to 2:00 AM (1560), in minutes since midnight.
- Day 1 is Monday; weekday is `(day - 1) % 7`, 0 = Monday. A season rolls over after day 28.
- `SaveData` stays `version: 1`. A save with no `clock` loads as `clock: null`. No migration, no bump.
- A `running` clock is restored as `paused` on load and on import. Everything stays in the browser.
- Schedules come from the unpacked game files, not the wiki. Heart-number rules, marriage, festival and `GreenRain` entries are skipped. 0 hearts is assumed.
- The villager card shows only people and shop owners from `peopleToVisit`. `peopleToVisit` is not changed.
- No new runtime dependencies.

## Review Focus
1. Rainy day for a villager with no `rain` rule: use the normal-day schedule, not nothing.
2. Time past midnight (1:00 AM is 1500): `locationAt` must find the last stop, not report "before the first stop".
3. Winter 28 then Start day: roll to Spring 1 (year is not tracked), and weather resets to Sunny.
4. Imported save with a malformed `clock`: rejected with an error, existing data untouched.
5. Villagers with no schedule file (Krobus, Wizard, Dwarf): the card row shows the step with no location and nothing throws.

---

### Task 1: Clock logic

**Branch:** `git switch -c feat/clock-and-schedules` before starting.

**Files:**
- Modify: `src/data/types.ts` (add `Weather`, `ClockStatus`, `Clock`; add `clock: Clock | null` to `SaveData`)
- Create: `src/state/clock.ts`
- Test: `src/state/clock.test.ts`

**Interfaces:**
- Produces, all in `src/state/clock.ts`:
  - constants `MORNING = 360`, `NIGHT = 1560`, `STEP_MS = 7000`, `WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']`
  - `startDay(clock: Clock | null): Clock`
  - `tick(clock: Clock, steps: number): Clock`
  - `nudge(clock: Clock, deltaMinutes: number): Clock`
  - `togglePause(clock: Clock): Clock`
  - `setWeather(clock: Clock, weather: Weather): Clock`
  - `setDateTime(clock: Clock, p: { season: Season; day: number; minutes: number }): Clock`
  - `restoreClock(clock: Clock | null): Clock | null`
  - `isClock(v: unknown): v is Clock`
  - `weekdayOf(day: number): number`
  - `formatTime(minutes: number): string`

- [ ] **Step 1: Write failing tests** in `clock.test.ts`:
  - `startDay(null)` is `{ season:'spring', day:1, minutes:360, weather:'sunny', status:'running' }`.
  - `startDay` on an `ended` clock at spring 28 gives summer 1, 360, sunny, running; winter 28 gives spring 1; spring 5 gives spring 6.
  - `tick(running 360, 3)` gives 390; `tick` reaching 1560 clamps to 1560 with status `ended`; `tick` on a `paused` clock returns it unchanged.
  - `nudge(+10)` and `nudge(-10)` move 10 minutes, clamp to 360 and 1560; nudging to 1560 sets `ended`; nudging an `ended` clock below 1560 sets `paused`.
  - `togglePause`: running to paused, paused to running, `ended` and `idle` unchanged.
  - `setWeather` changes only the weather.
  - `setDateTime` sets season, day and minutes, clamps day to 1-28 and minutes to 360-1560 and snaps minutes to a multiple of 10; a `paused` or `ended` status becomes `paused`, `running` stays `running`.
  - `restoreClock`: `running` becomes `paused`; `null` stays `null`; other statuses unchanged.
  - `weekdayOf(1)` is 0, `weekdayOf(7)` is 6, `weekdayOf(8)` is 0, `weekdayOf(28)` is 6.
  - `formatTime`: 360 is `6:00 AM`, 720 is `12:00 PM`, 780 is `1:00 PM`, 1440 is `12:00 AM`, 1500 is `1:00 AM`, 1560 is `2:00 AM`.
  - `isClock`: accepts a valid clock; rejects wrong season, day 0 or 29, non-integer day, minutes 350 or 1570, minutes not a multiple of 10, bad weather, bad status, and non-objects.
- [ ] **Step 2: Run** `npx vitest run src/state/clock.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Add the types and implement `clock.ts`.** All functions return new objects. `tick` and `nudge` only advance a `running` clock (`nudge` works in any status except `idle`, which it returns unchanged). `formatTime` uses a 12-hour clock with `AM`/`PM`, minute padded to two digits.
- [ ] **Step 4: Run** the same command. Expected: PASS. Run `npx tsc -b`; expect type errors only in files that build a `SaveData` literal (fixed in Task 2).
- [ ] **Step 5: Commit** `git add src/data/types.ts src/state/clock.ts src/state/clock.test.ts && git commit -m "feat: clock state logic"`

---

### Task 2: Save layer and clock runner

**Files:**
- Modify: `src/state/save.ts`, `src/state/SaveContext.tsx`, `src/components/Layout.tsx`
- Create: `src/state/ClockRunner.tsx`
- Test: `src/state/save.test.ts`, `src/state/SaveContext.test.tsx`, `src/state/ClockRunner.test.tsx`

**Interfaces:**
- Consumes: `Clock`, `isClock`, `restoreClock`, `tick`, `STEP_MS` from Task 1.
- Produces: `defaultSave().clock === null`; `parseSave` returns `clock: Clock | null` (a missing `clock` becomes `null`; a present but invalid one returns `{ ok:false, error:'The save clock is invalid.' }`); `SaveApi.updateClock(fn: (c: Clock | null) => Clock | null): void`; `<ClockRunner />` (no props, renders nothing).

- [ ] **Step 1: Write failing tests.**
  - `save.test.ts`: `defaultSave().clock` is `null`; round trip keeps a valid clock; a v1 JSON with no `clock` key parses to `clock: null`; a `clock` with `day: 40` is rejected with the error above.
  - `SaveContext.test.tsx`: stored save with `status: 'running'` loads as `paused` at the same minutes; `updateClock` writes to localStorage; `importSave` of a `running` clock stores it `paused`; `importSave` with a malformed clock returns `ok: false` and leaves `save` unchanged.
  - `ClockRunner.test.tsx` (fake timers, `vi.setSystemTime`): render `<SaveProvider><ClockRunner/></SaveProvider>` with a stored `paused` clock and call `updateClock(togglePause)` through a small consumer, then advance 7000 ms and expect +10 minutes; advance 21000 ms in one jump and expect +30 (catch-up); a `paused` clock does not move; reaching 1560 stops at `ended`; a manual `nudge` while running does not reset the carried partial interval.
- [ ] **Step 2: Run** `npx vitest run src/state`. Expected: new tests FAIL.
- [ ] **Step 3: Implement.**
  - `save.ts`: add `clock: null` to `defaultSave`; in `parseSave`, treat `raw.clock === undefined` as `null`, otherwise require `isClock`.
  - `SaveContext.tsx`: `load()` and `importSave` pass the parsed data through `restoreClock` on its `clock`; add `updateClock` following the `setNotes` pattern (set `dirty`, `setSave`). The `storage` event handler does not call `restoreClock`.
  - `ClockRunner.tsx`: while `save.clock?.status === 'running'`, a 1000 ms `setInterval` adds `Date.now() - last` to a `useRef` remainder, computes `steps = Math.floor(rem / STEP_MS)`, keeps `rem % STEP_MS`, and calls `updateClock((c) => (c && steps > 0 ? tick(c, steps) : c))`. The remainder resets when the status leaves `running`.
  - `Layout.tsx`: render `<ClockRunner />` once.
- [ ] **Step 4: Run** `npx vitest run`. Expected: all PASS, including existing tests. Run `npx tsc -b` with no errors.
- [ ] **Step 5: Commit** `git add -A src && git commit -m "feat: save the clock and tick it while running"`

---

### Task 3: Banner controls

**Files:**
- Modify: `src/components/today/StatusBanner.tsx`, `src/styles.css`, `src/views/PathView.tsx`, `src/views/PathView.test.tsx`
- Create: `src/components/today/ClockEditor.tsx`
- Test: `src/components/today/StatusBanner.test.tsx`

**Interfaces:**
- Consumes: Task 1 functions, `useSave().save.clock` and `updateClock`.
- Produces: `StatusBanner({ nextStep }: { nextStep?: PathStep })` (same props). `ClockEditor({ clock, onApply, onCancel })` where `onApply(p: { season: Season; day: number; minutes: number })`.

- [ ] **Step 1: Write failing tests** in `StatusBanner.test.tsx` using `renderWithState` and a stored save:
  - `clock` is `null`: heading Today, a **Start day** button, the stand-in label from `nextStep` still shown, no Pause or ±10 buttons.
  - After pressing **Start day**: the banner shows `Spring 1 · Mon` and `6:00 AM`, and a **Pause** button.
  - **Pause** becomes **Resume** and back; **+10** shows `6:10 AM`; **-10** at 6:00 AM leaves it at 6:00 AM.
  - Rain button gets `aria-pressed="true"`; Sunny is `aria-pressed="false"` (and the reverse after clicking Sunny).
  - An `ended` clock shows `Day over` and **Start day** (not Pause); pressing it moves to the next date.
  - **Set time and date** opens `ClockEditor` with season, day and time controls; applying `fall`, `3`, `1:00 PM` shows `Fall 3 · Tue` and `1:00 PM`; Cancel closes it with no change.
  - Update the `PathView.test.tsx` heading test: the "Live day tracking is coming with the clock" text is gone; assert the **Start day** button instead.
- [ ] **Step 2: Run** `npx vitest run src/components/today/StatusBanner.test.tsx src/views/PathView.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.** `StatusBanner` reads the clock from `useSave()`; the label is `Season Day · Weekday` when a clock exists, else the current `stepWhen` fallback. Controls call `updateClock` with the Task 1 functions. `ClockEditor` is a small inline form (season `select`, day number input 1-28, time `select` in 10-minute steps from 6:00 AM to 2:00 AM using `formatTime`). Reuse the `.banner-btn` styles; add `.banner-btn[aria-pressed="true"]` styling and `.clock-editor` styles to `styles.css`. Print rules stay (controls hidden).
- [ ] **Step 4: Run** `npx vitest run`. Expected: PASS. Then `npm run dev`, press Start day, and confirm the clock advances about every 7 seconds and survives a reload (paused).
- [ ] **Step 5: Commit** `git add -A src && git commit -m "feat: live clock controls in the Today banner"`

---

### Task 4: Schedule build script and data

**Files:**
- Create: `scripts/schedules/resolve.mjs`, `scripts/schedules/places.mjs`, `scripts/schedules/build-schedules.mjs`, `src/data/schedules.json` (generated)
- Modify: `package.json` (add `"schedules": "node scripts/schedules/build-schedules.mjs"`)
- Test: `scripts/schedules/resolve.test.mjs`

**Interfaces:**
- Produces, in `resolve.mjs`:
  - `parseTime(token: string): number` (`'630'` is 390, `'2530'` is 1530, `'a1200'` is 720)
  - `parseRule(rule: string): Stop[] | { goto: string } | null` where `Stop = { time: number, place: string }`; `null` means "no schedule"
  - `resolveRules(raw: Record<string,string>, placeName: (mapId: string) => string): { rules: Record<string, Stop[]>, errors: string[] }`
  - `isKeptKey(key: string): boolean`
- Produces, in `places.mjs`: `PLACES: Record<string,string>` and `placeName(mapId: string): string` (throws for an unknown id).
- Produces `src/data/schedules.json`: `Record<villager, Record<ruleKey, { time: number; place: string }[]>>`.

- [ ] **Step 1: Write failing tests** in `resolve.test.mjs` (inline raw objects, not the game files):
  - `parseTime`: values above.
  - A rule `"900 SeedShop 39 5 0/1100 Beach 13 39 2"` parses to `[{time:540,place:"Pierre's General Store"},{time:660,place:'The Beach'}]` (coordinates, facing and animation words dropped; quoted dialogue strings dropped).
  - A stop `2200 SeedShop 1 9 3 abigail_sleep` is kept; a stop `2400 bed` becomes place `At home`.
  - `NOT friendship Sebastian 6/1000 SebastianRoom 5 4 2` is treated as true at 0 hearts: the condition segment is stripped and the rest parses.
  - `MAIL ccVault/GOTO spring/900 HaleyHouse 16 5 2` takes the last branch (mail not received); the `GOTO spring` branch is dropped.
  - `GOTO NO_SCHEDULE` resolves to no rule.
  - `resolveRules` follows `{ rain: 'GOTO spring', spring: '700 SeedShop 10 20 0' }` so `rain` gets spring's stops; a GOTO chain two deep resolves; a GOTO loop or a missing target produces an entry in `errors` and no rule.
  - GOTO resolution runs over all raw keys before filtering: `{ Wed: 'GOTO 11', '11': '1000 Beach 1 1 0' }` gives `Wed` the Beach stops while `'11'` is not in the output.
  - `isKeptKey`: true for `rain`, `rain2`, `spring_4`, `fall_Mon`, `Fri`, `spring`, `default`; false for `11`, `25_6`, `Wed_6`, `GreenRain`, `marriage_Mon`, `DesertFestival_1`, `Sun_normal`, `SquidFest`, `bus`.
- [ ] **Step 2: Run** `npx vitest run scripts/schedules`. Expected: FAIL.
- [ ] **Step 3: Implement `resolve.mjs` and `places.mjs`.** `PLACES` (all values are decisions from this plan):
  `SeedShop` "Pierre's General Store", `Mountain` "The Mountain", `SebastianRoom` "Sebastian's room", `Saloon` "The Stardrop Saloon", `Desert` "The Calico Desert", `bed` "At home", `ScienceHouse` "Robin's house", `Beach` "The Beach", `Town` "Pelican Town", `Hospital` "Harvey's Clinic", `Forest` "Cindersap Forest", `ArchaeologyHouse` "The Museum", `BusStop` "The bus stop", `Railroad` "The Railroad", `JoshHouse` "Alex's house", `BathHouse_MensLocker` "The Bathhouse", `BathHouse_Entry` "The Bathhouse", `HaleyHouse` "Haley and Emily's house", `Sunroom` "Haley and Emily's sunroom", `CommunityCenter` "The Community Center", `Blacksmith` "Clint's Blacksmith", `JojaMart` "JojaMart", `ElliottHouse` "Elliott's cabin", `SandyHouse` "The Oasis", `HarveyRoom` "Harvey's apartment", `AnimalShop` "Marnie's Ranch", `SamHouse` "Jodi's house", `LeahHouse` "Leah's cottage", `LeoTreeHouse` "Leo's tree house", `Tent` "Linus's tent", `ManorHouse` "The Mayor's manor", `FishShop` "Willy's Fish Shop", `Trailer` "Penny and Pam's trailer". The `Island*` ids are not mapped (they only occur in dropped rules).
  Conditions rule: a leading `NOT friendship ...` segment is stripped (true at 0 hearts); a leading `MAIL <flag>` segment means "if received use the next segment, else the one after", so keep the last remaining branch.
- [ ] **Step 4: Implement `build-schedules.mjs`** in the style of `build-icons.mjs`: exit 1 with "Content (unpacked) folder not found..." if missing and write nothing; read every `Characters/schedules/*.json` except `template.json` and `LeoMainland.json` (strip a BOM); run `resolveRules` per villager; keep only `isKeptKey` rules; print every error and exit non-zero without writing if any exist (including an unmapped map id from `placeName`); otherwise write `src/data/schedules.json` with stable key order and exit 0.
- [ ] **Step 5: Run** `npx vitest run scripts/schedules` (PASS), then `npm run schedules`. If it reports unmapped places or unresolved GOTOs, add the place to `PLACES` or report the unresolved rule to the user instead of guessing; re-run until it exits 0.
- [ ] **Step 6: Commit** `git add scripts/schedules src/data/schedules.json package.json && git commit -m "feat: build villager schedule data from the game files"`

---

### Task 5: Runtime schedule lookups

**Files:**
- Create: `src/data/schedules.ts`
- Modify: `src/data/types.ts` (add `Stop`, `Location`)
- Test: `src/data/schedules.test.ts`

**Interfaces:**
- Consumes: `src/data/schedules.json`, `weekdayOf`/`WEEKDAYS` from `src/state/clock.ts`.
- Produces, in `schedules.ts`:
  - `RULE_ORDER`: the documented precedence as a function `ruleKeys(season, day, raining): string[]`, in this order: `rain` (only if raining), `${season}_${day}`, `${season}_${Dow}`, `${Dow}`, `${season}`, `default`.
  - `scheduleFor(name: string, season: Season, day: number, raining: boolean): Stop[] | null`
  - `rainMayVary(name: string, raining: boolean): boolean` (true when raining and the villager has a `rain2` rule)
  - `locationAt(stops: Stop[], minutes: number): Location`
- `Stop = { time: number; place: string }`; `Location = { place: string; since: number | null; next?: Stop }` (`since` is `null` while still "At home" before the first stop).

- [ ] **Step 1: Write failing tests** against the real generated data:
  - `scheduleFor('Pierre','spring',1,false)` equals Pierre's `spring` stops, but `scheduleFor('Pierre','spring',5,false)` (a Friday) equals his `Fri` stops; the same Friday with `raining: true` equals his `spring` stops (his `rain` rule is `GOTO spring`).
  - `scheduleFor('Abigail','spring',4,false)` equals her `spring_4` rule; with `raining: true` it equals her `rain` rule.
  - A villager with no `rain` rule and `raining: true` returns the normal-day schedule (Review Focus 1). Pick one from the data in the test by finding a villager with no `rain` key.
  - `scheduleFor('Krobus', ...)` and `'Wizard'` return `null`.
  - `rainMayVary('Abigail', true)` is true, `rainMayVary('Abigail', false)` is false, `rainMayVary('Pierre', true)` is false.
  - `locationAt` on a hand-made list: before the first stop gives `{ place:'At home', since:null, next: first }`; exactly on a stop gives that stop with `since` equal to its time; between stops gives the earlier stop and `next` the following one; after the last stop gives the last with no `next`; a list with a 1530 stop at minutes 1500 is "before" it and at 1530 is on it (Review Focus 2).
  - Every villager in `villagers.json` resolves without throwing for every season, day 1-28, both weather values.
- [ ] **Step 2: Run** `npx vitest run src/data/schedules.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `scheduleFor` returns the stops of the first key from `ruleKeys` that exists for that villager, or `null` if the villager has no file or no key matches. Add a comment above `ruleKeys` saying the precedence is from the game's schedule format and is pinned by the tests; it has not been checked against the wiki page (blocked to automated clients).
- [ ] **Step 4: Run** `npx vitest run` and `npx tsc -b`. Expected: PASS, no errors.
- [ ] **Step 5: Commit** `git add -A src && git commit -m "feat: resolve schedules by date, weekday, season and rain"`

---

### Task 6: Where is everyone with live locations

**Files:**
- Modify: `src/components/today/WhereCard.tsx`, `src/views/PathView.test.tsx` (if it asserts the old note), `README.md`
- Test: `src/components/today/WhereCard.test.tsx`

**Interfaces:**
- Consumes: `peopleToVisit`, `scheduleFor`, `rainMayVary`, `locationAt`, `formatTime`, `useSave`.
- Produces: `WhereCard({ steps }: { steps: PathStep[] })` (same props).

- [ ] **Step 1: Write failing tests** with `renderWithState` and a stored save (a path whose "Meet the town" is unchecked):
  - `clock: null`: the list of people and steps shows as today and the text "Press Start day to see where they are." appears; the old "Locations by time come with the schedule data." does not.
  - Clock `spring 1`, `minutes: 540`, `sunny`, `paused`: the Pierre row shows the expected place from `locationAt(scheduleFor('Pierre','spring',1,false), 540)` formatted as `<place> since <time>` and, when present, `then <next place> at <time>`; compute the expected strings in the test from the same functions' outputs for the stop times, but assert the literal place names `Pierre's General Store` for Pierre at 9:00 AM.
  - Before a villager's first stop the row reads `At home until <first time>, then <place>`.
  - Rows for people with a location come before people without one; a villager with no schedule file (use a stored step mentioning a villager that has none if one exists in `peopleToVisit` output; otherwise assert through a unit of the row builder) shows the step only (Review Focus 5).
  - An `ended` clock shows end-of-day places and no `then`.
  - Raining with a `rain2` villager in the list shows "may differ on rainy days".
  - Ticking "Meet the town" in the save hides the card as before.
- [ ] **Step 2: Run** `npx vitest run src/components/today/WhereCard.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.** Build each row's text with a small exported helper `describeLocation(loc: Location): string` in `WhereCard.tsx` (or a neighboring `where-text.ts` if the file passes about 80 lines). Keep the existing `stepWhen` suffix on the step. Keep the card's hide conditions exactly as they are today.
- [ ] **Step 4: Update `README.md`:** under Features add the clock and live "Where is everyone"; in the Roadmap mark the clock and villager schedules done and leave the day-by-day plan as next; mention `npm run schedules` beside `npm run icons` in the run-locally section and that the schedule data comes from the player's own unpacked game files.
- [ ] **Step 5: Run** `npx vitest run`, `npx tsc -b`, `npm run lint`, `npm run build`. Expected: all PASS with no errors. Then `npm run dev` and check by hand: Start day, set the time to 9:00 AM Spring 1, confirm the card shows Pierre's General Store; switch to Rain and confirm rows update; Export, reload, Import, and confirm the last day comes back paused.
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: where is everyone shows live villager locations"` (this includes the favicon change only if the user has not committed it yet; check `git status` first and leave unrelated files out).

---

## Self-review notes
- **Spec coverage:** clock state, behaviour and reload (Tasks 1-3); save field with no version bump and import validation (Task 2); banner controls including Set time and date (Task 3); build script, place names, GOTO and condition handling (Task 4); `scheduleFor`, `locationAt`, precedence and `rain2` note (Task 5); card states table (Task 6). Out-of-scope items are not planned.
- **Deviations from the spec:** the plan adds `default` as the lowest-priority rule and skips `Wed_6`-style heart rules; both come from keys found in the data and not named in the spec. `MAIL` and `NOT friendship` leading conditions are handled in the build script for the same reason. The spec's `rain2` note is exposed as `rainMayVary`.
- **Still unverified:** the rule precedence in `ruleKeys` is from the game's documented format as understood, not confirmed against the wiki; Task 5's tests pin the cases that matter (Pierre Friday and rain, Abigail `spring_4`).
