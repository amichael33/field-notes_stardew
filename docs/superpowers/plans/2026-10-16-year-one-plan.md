# Year 1 Day-by-Day Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a player-selectable, hand-authored day-by-day year 1 plan to the Today tab, with rain variants, a catch-up list, and checkbox progress saved in the existing save.

**Architecture:** Plan content is typed JSON per goal (`src/data/plans/<goal>.json`). Pure selectors in `src/data/plans.ts` turn a goal, route and clock into the day's tasks. The chosen goal lives in `SaveData.profile.planGoal`, and task checkboxes reuse `SaveData.checked` with namespaced ids. A `DayPlanCard` replaces `PathCard` on the Today tab and falls back to it when a day has no entry.

**Tech Stack:** Vite, React 18, TypeScript, Vitest + Testing Library, hand-curated JSON.

**Spec:** `docs/superpowers/specs/2026-10-16-year-one-plan-design.md`

## Global Constraints

- Static site, no backend, no logins; data lives in browser localStorage plus JSON export/import.
- Plans are hand-authored typed JSON; no generator or optimizer.
- Goals: `community-center` (default) and `money`. The format must allow more goals by adding a JSON file and a `PLAN_GOALS` entry only.
- Save `version` stays `1`. Checked task ids are stored in `SaveData.checked` as `plan:<goal>:<taskId>`.
- `SaveData` without `profile.planGoal` (old saves, old exports) defaults to `community-center`; a present but unknown value is rejected on import.
- Plans may be partial. A day with no entry falls back to the legacy opening-route `PathCard`; `path-steps.json` and `PathCard` are kept.
- Rain is a variant: `rainTasks` replace `tasks` when weather is `rain`. Nothing is rescheduled.
- Tasks with no `route` show for both routes; a `route` tag shows only for that route.
- Year 1 is complete when the clock is Winter 28 with status `ended`.
- Keep 44px touch targets and print-friendly styles; existing class names (`card`, `path-row`, `row-check`, `badge`, `row-detail`) are reused.
- Plan content is checked against the Stardew Valley wiki (credited in the README).

## Review Focus

Failure modes the spec implies; each has a test in the owning task.

1. Idle clock (`null`): the card shows Spring 1's plan, not an empty or crashing card. (Task 1, 4)
2. Rain with a day that has no `rainTasks`: normal tasks show and no "rain" label appears. (Task 1, 4)
3. Imported save with an unknown `planGoal` is rejected; one with no `planGoal` loads as `community-center`. (Task 2)
4. The same `taskId` in two goals is independent, and switching goals keeps the other goal's checked ids. (Task 1, 2)
5. Clock before any authored day, Winter 28 ended, and a day with no entry: no Catch-up section, "Year 1 complete", and the legacy fallback respectively. (Task 1, 4)

---

### Task 1: Types and plan selectors

**Files:**
- Modify: `src/data/types.ts`
- Create: `src/data/plans.ts`
- Create: `src/data/plans/community-center.json`, `src/data/plans/money.json` (each `[]` for now)
- Test: `src/data/plans.test.ts`

**Interfaces:**
- Produces (types.ts):
  - `type PlanGoal = 'community-center' | 'money'`
  - `interface PlanTask { id: string; text: string; item?: string; place?: string; time?: number; route?: Route }` (`time` is minutes since midnight, as in `Stop.time`)
  - `interface PlanDay { season: Season; day: number; why: string; tasks: PlanTask[]; rainTasks?: PlanTask[] }`
  - `type Plan = PlanDay[]`
  - `SaveData.profile` becomes `{ route: Route; farmType: string; planGoal: PlanGoal }`
- Produces (plans.ts):
  - `PLAN_GOALS: { id: PlanGoal; label: string; description: string }[]` with labels `Community Center in year 1` and `Max money and farm growth`
  - `DEFAULT_PLAN_GOAL: PlanGoal` (`'community-center'`), `isPlanGoal(v: unknown): v is PlanGoal`
  - `PLANS: Record<PlanGoal, Plan>` built from the two JSON files
  - `planTaskId(goal: PlanGoal, task: PlanTask): string` returns `plan:<goal>:<task.id>`
  - `planForDay(goal, route: Route, season: Season, day: number, weather: Weather, plans?: Record<PlanGoal, Plan>): { day: PlanDay; tasks: PlanTask[]; raining: boolean } | undefined` — `tasks` is `rainTasks` when `weather === 'rain'` and the day defines `rainTasks` (then `raining` is true), otherwise `tasks`; route-filtered; `undefined` if no entry
  - `missedTasks(goal, route, clock: Clock | null, checked: string[], plans?): { season: Season; day: number; tasks: PlanTask[] }[]` — days strictly before the clock date (null clock = Spring 1, so empty), chronological, normal tasks only (never `rainTasks`), route-filtered, unchecked only, days with nothing missed omitted
  - `nextPlanTask(goal, route, clock: Clock | null, checked, plans?): { day: PlanDay; task: PlanTask } | undefined` — first unchecked task of the current day's effective list, else the first unchecked normal task of any later day with an entry
  - `yearComplete(clock: Clock | null): boolean`

- [ ] **Step 1: Write failing tests in `src/data/plans.test.ts`** using a small inline fixture `plans` (two goals; Spring 1 with `tasks` t1 and t2 and `rainTasks` r1; Spring 2 with `tasks` t3 tagged `route: 'joja'` and t4 untagged, no `rainTasks`; Summer 1 with t5; the second goal reuses id `t1`). Tests, each passing `plans` as the last argument:
  - `planForDay` returns the day's normal tasks on sunny weather and `raining: false`
  - `planForDay` on rain with `rainTasks` returns `[r1]` and `raining: true`
  - `planForDay` on rain for Spring 2 (no `rainTasks`) returns normal tasks and `raining: false`
  - `planForDay` filters a joja-tagged task out for `community-center` and keeps it for `joja`
  - `planForDay` returns `undefined` for a day with no entry
  - `planTaskId('community-center', t1)` is `plan:community-center:t1`
  - `missedTasks` with clock Summer 1 and `checked: ['plan:community-center:t1']` returns Spring 1 `[t2]` and Spring 2 `[t4]` in that order
  - `missedTasks` with a `null` clock returns `[]`, and does not include rain tasks
  - `missedTasks` ignores a checked id from the other goal (`plan:money:t1` does not hide community-center's t1)
  - `nextPlanTask` with a `null` clock and nothing checked returns Spring 1's t1; with t1, t2 checked it returns Spring 2's first task; with everything checked it returns `undefined`
  - `nextPlanTask` on a rain clock for Spring 1 starts with r1
  - `yearComplete` is true only for `{season:'winter', day:28, status:'ended'}` and false for winter 28 `running`, `null`, and other dates
  - `isPlanGoal('money')` true; `isPlanGoal('bogus')` false
- [ ] **Step 2: Run `npx vitest run src/data/plans.test.ts`.** Expected: FAIL (module not found).
- [ ] **Step 3: Implement** the types and `plans.ts` as specified above. Order days chronologically with a `season index * 28 + day` helper (season order spring, summer, fall, winter). Route filter keeps tasks where `route` is undefined or equals the route.
- [ ] **Step 4: Fix the type fallout.** `tsc` will flag `defaultSave` in `src/state/save.ts` and any test that builds a `profile`; set `planGoal: 'community-center'` in `defaultSave()` only (parsing is Task 2), and let other compile errors guide the minimal fixes.
- [ ] **Step 5: Run `npx vitest run src/data/plans.test.ts`.** Expected: PASS.
- [ ] **Step 6: Commit**

```bash
git add src/data src/state/save.ts
git commit -m "feat: plan types and day selectors"
```

---

### Task 2: Save the plan goal

**Files:**
- Modify: `src/state/save.ts`, `src/state/SaveContext.tsx`
- Test: `src/state/save.test.ts`, `src/state/SaveContext.test.tsx`

**Interfaces:**
- Consumes: `PlanGoal`, `isPlanGoal`, `DEFAULT_PLAN_GOAL` from Task 1.
- Produces: `SaveApi.setPlanGoal: (goal: PlanGoal) => void`; `parseSave` reads `profile.planGoal`.

- [ ] **Step 1: Write failing tests**
  - `save.test.ts`: `parseSave` of a version 1 save with no `profile.planGoal` returns `planGoal: 'community-center'`; with `planGoal: 'money'` keeps it; with `planGoal: 'bogus'` returns `{ ok: false, error: 'The save plan goal is invalid.' }`; round trip `parseSave(serializeSave(s))` keeps `planGoal`; unknown extra profile keys are still dropped.
  - `SaveContext.test.tsx`: `setPlanGoal('money')` updates `save.profile.planGoal` and persists to localStorage; after `toggle('plan:community-center:t1')` then `setPlanGoal('money')`, `save.checked` still contains `plan:community-center:t1`; `importSave` of a JSON with a bad goal returns `{ ok: false }` and leaves the save unchanged.
- [ ] **Step 2: Run `npx vitest run src/state`.** Expected: new tests FAIL.
- [ ] **Step 3: Implement** in `parseSave`: `profile.planGoal === undefined` gives `DEFAULT_PLAN_GOAL`, a value failing `isPlanGoal` gives the error above, and the parsed profile includes `planGoal`. In `SaveContext`, add `setPlanGoal` following the `setRoute` pattern.
- [ ] **Step 4: Run `npx vitest run src/state`.** Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/state
git commit -m "feat: save the plan goal in the profile"
```

---

### Task 3: Goal picker

**Files:**
- Create: `src/components/PlanGoalPicker.tsx`, `src/components/PlanGoalPicker.test.tsx`
- Modify: `src/components/Layout.tsx` (next to `<RouteToggle />` at line ~100), `src/test-utils.tsx`

**Interfaces:**
- Consumes: `PLAN_GOALS`, `PlanGoal`, `useSave().setPlanGoal`.
- Produces: default export `PlanGoalPicker()` — a labeled `<select>` ("Plan goal") with one option per `PLAN_GOALS` entry, and the selected goal's `description` shown in a `<small>` linked by `aria-describedby`.

- [ ] **Step 1: Write failing tests**: renders a combobox named "Plan goal" with both goal labels; defaults to Community Center; choosing "Max money and farm growth" calls through to the save (`localStorage['field-notes-save']` contains `"planGoal": "money"`); the description text updates with the selection.
- [ ] **Step 2: Run `npx vitest run src/components/PlanGoalPicker.test.tsx`.** Expected: FAIL.
- [ ] **Step 3: Implement** `PlanGoalPicker` in the style of `RouteToggle`, add it to `Layout.tsx` in `.controls` and to `renderWithState` in `test-utils.tsx` after `<RouteToggle />`.
- [ ] **Step 4: Run `npx vitest run`.** Expected: PASS (existing Layout and view tests may need a `getByRole('combobox', { name: ... })` tightening if they select by a bare `combobox` role; fix those queries by name).
- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: plan goal picker in the header"
```

---

### Task 4: Day plan card

**Files:**
- Create: `src/components/today/DayPlanCard.tsx`, `src/components/today/CatchUp.tsx`, `src/components/today/DayPlanCard.test.tsx`
- Modify: `src/styles.css` (only if needed for the new rows; reuse existing classes first)

**Interfaces:**
- Consumes: `planForDay`, `missedTasks`, `planTaskId`, `yearComplete` (Task 1); `useSave().save` and `toggle`; `ItemIcon` (`src/components/ItemIcon.tsx`, props `{ name: string }`); `formatTime` from `src/state/clock.ts`.
- Produces: default export `DayPlanCard({ fallback }: { fallback: ReactNode })`. The clock `null` counts as Spring 1 sunny.

Behavior (all selected by the goal and route in `save.profile`):
  - `yearComplete(save.clock)`: render a card with the text "Year 1 complete".
  - no `planForDay` result: render `fallback` only.
  - otherwise: a `section.card` with an `h2` "Day plan", a tag with `done/total` for the shown tasks, the day's `why` as a paragraph, a rain label ("Rainy day plan") only when `raining`, and an `<ol aria-label="Day tasks">` of checkbox rows (class `path-row`/`row-check`) whose label is the task `text`, with `ItemIcon` when `item` is set, and the place and `formatTime(time)` as secondary text when set. Checking calls `toggle(planTaskId(goal, task))`.
  - `CatchUp` ({ groups }): renders nothing when `groups` is empty; otherwise a `<details>` (closed by default) with summary "Catch-up (N)" and, per group, a heading "<Season> <day>" and the same checkbox rows.

- [ ] **Step 1: Write failing tests** in `DayPlanCard.test.tsx`, seeding the save with `localStorage.setItem('field-notes-save', serializeSave({...defaultSave(), clock, checked}))` as `WhereCard.test.tsx` does, and mocking `./../../data/plans` with `vi.mock` partial overrides so `PLANS` is a small fixture (a Spring 1 day with a rain variant, a Spring 2 day with no rain variant, a joja-only task, and no Summer 1 entry):
  - null clock shows Spring 1's `why` and tasks
  - rain clock shows the rain tasks and "Rainy day plan"; Spring 2 on rain shows normal tasks and no rain label
  - checking a task writes `plan:community-center:<id>` to `save.checked` and the counter updates
  - joja route hides a community-center-only task and shows the joja-only one (and the reverse)
  - Summer 1 (no entry) renders the `fallback` text and not "Day plan"
  - Winter 28 `ended` renders "Year 1 complete"
  - Catch-up: clock at Spring 2 with Spring 1 tasks unchecked shows "Catch-up (2)" collapsed; checking a catch-up task decrements it; clock at Spring 1 shows no Catch-up
  - switching to the `money` goal keeps the community-center ids in `checked`
- [ ] **Step 2: Run `npx vitest run src/components/today/DayPlanCard.test.tsx`.** Expected: FAIL.
- [ ] **Step 3: Implement** `DayPlanCard` and `CatchUp`. Share one small row component between them in `DayPlanCard.tsx` rather than duplicating the checkbox markup.
- [ ] **Step 4: Run the test file.** Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: day plan card with rain variants and catch-up"
```

---

### Task 5: Wire into the Today tab

**Files:**
- Modify: `src/views/PathView.tsx`, `src/components/today/NextGoalCard.tsx`
- Test: `src/views/PathView.test.tsx`, `src/components/today/NextGoalCard.test.tsx` (create)

**Interfaces:**
- Consumes: `DayPlanCard` (Task 4), `nextPlanTask` (Task 1), existing `PathCard`.
- Produces: `PathView` renders `<DayPlanCard fallback={<PathCard steps={steps} />} />` in place of `<PathCard steps={steps} />`. `NextGoalCard({ steps })` keeps its props and shows the plan's next task (title = task `text`, detail = the day's `why`); when `nextPlanTask` is `undefined` it shows the existing legacy behavior unchanged.

- [ ] **Step 1: Write failing tests**
  - `NextGoalCard.test.tsx`: with a fixture plan, shows the next unchecked task; after checking it shows the following one; with no plan data for the goal it shows the legacy goal (path step 9/10) as before.
  - `PathView.test.tsx`: with a fixture plan covering Spring 1, "Day plan" is on the page and "Today's path" is not; with no plan entry for the day, "Today's path" is shown; existing assertions still pass.
- [ ] **Step 2: Run `npx vitest run src/views src/components/today`.** Expected: new tests FAIL.
- [ ] **Step 3: Implement** both changes.
- [ ] **Step 4: Run `npx vitest run`.** Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: show the day plan on the Today tab"
```

---

### Task 6: Seed plan data and integrity tests

**Files:**
- Modify: `src/data/plans/community-center.json`, `src/data/plans/money.json` (Spring 1-7 each)
- Create: `src/data/plans-data.test.ts`

**Interfaces:**
- Consumes: `PLANS`, `PLAN_GOALS`, `planTaskId`; `src/data/item-icons.json` (keys are item names), `src/data/schedules.json` (stop `place` names).
- Produces: real, wiki-checked content for Spring 1-7 for both goals, using the legacy opening-route steps in `src/data/path-steps.json` as the factual starting point (plant the 15 Parsnip Seeds, meet the town, Willy's letter on Spring 2, Queen of Sauce on Spring 7).

- [ ] **Step 1: Write the integrity test** `plans-data.test.ts`: every `PLAN_GOALS` id has a plan; every day has `season` in the four seasons and `day` 1-28, a non-empty `why`, and at least one task; (season, day) pairs are unique within a plan; task ids are unique within a plan (including `rainTasks`) and contain no `:` characters; every `item` is a key of `item-icons.json`; every `place` is a `place` in `schedules.json` or in a small `EXTRA_PLACES` set at the top of the test (start with `Farm`, add others only with a comment saying why the schedules data lacks them); `time`, when present, is between 360 and 1560; no checkbox id collides with `path:`, `bundle:` or other existing id prefixes (all ids start with `plan:`).
- [ ] **Step 2: Run `npx vitest run src/data/plans-data.test.ts`.** Expected: PASS vacuously on the empty arrays, then fail once you add content with a bad item or place name, which is the point.
- [ ] **Step 3: Author Spring 1-7 for both goals.** Each day needs a one-line `why` and 3-6 tasks; at least one day per plan has `rainTasks` (rain-day fishing for the Spring 4-7 range) and at least one task tagged `route`. Check every claim (recipe air days, quest triggers, shop opening) against the wiki at stardewvalleywiki.com before committing it, and take item names from `item-icons.json` spelling.
- [ ] **Step 4: Run `npx vitest run`.** Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add src/data
git commit -m "feat: plan data for Spring 1-7 and integrity tests"
```

---

### Task 7: Author Spring 8-28

**Files:**
- Modify: `src/data/plans/community-center.json`, `src/data/plans/money.json`

- [ ] **Step 1: Author Spring 8-28 for both goals** in the same shape and with the same rules as Task 6 (the `why` line, 3-6 tasks, rain variants where the weather changes what you should do, route tags where Joja differs). Cover the known Spring events (Egg Festival on Spring 13, Flower Dance on Spring 24, birthdays that matter for friendship) and the Spring bundle items from `bundles.json` for the Community Center goal. Verify each claim against the wiki.
- [ ] **Step 2: Run `npx vitest run`.** Expected: PASS (integrity test enforces ids, items and places).
- [ ] **Step 3: Play-through spot check** with `npm run dev`: set the clock to a handful of Spring dates in both goals and both weathers; confirm the card, Catch-up and Next goal read sensibly at phone width and in print preview.
- [ ] **Step 4: Commit**

```bash
git add src/data/plans
git commit -m "feat: plan data for Spring 8-28"
```

---

### Task 8: README and final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the README:** Features (plan goal picker, day plan with rain variants and catch-up, checkbox progress saved in browser, export/import includes the plan goal); Roadmap (mark the day-by-day plan "in progress: engine done, Spring covered" and state exact day coverage per goal); a note that days without a plan entry show the opening route; the Your data section mentions the plan goal.
- [ ] **Step 2: Run `npm run build` and `npm test`.** Expected: both succeed with no type or test failures. Also run `npm run lint`.
- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README for the year 1 plan"
```

---

## Self-Review

- **Spec coverage:** profile goal and defaulting (Task 2), data model and selectors (1), picker (3), day card, rain, catch-up, idle, ended, fallback (4), Next goal and wiring (5), data tests and content (6, 7), README and verification (8). The spec's out-of-scope items are not planned.
- **Deviation from spec:** the selectors take an optional trailing `plans` argument so tests can inject fixtures; behavior is otherwise as specified. `nextPlanTask` and `yearComplete` are added to support the Next goal card and the ended state the spec describes.
- **Content scope:** only Spring is authored in this plan; Summer to Winter days fall back to the opening route and are follow-up content work, as the spec's partial-plans decision allows.
