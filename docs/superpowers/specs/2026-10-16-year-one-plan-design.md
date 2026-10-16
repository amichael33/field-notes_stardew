# Field Notes: Year 1 Day-by-Day Plan (Sub-project 4)

## Purpose
The site's main goal is an optimized day-by-day plan for an efficient first year, used while playing or printed. Sub-projects 1-3 delivered the reference data, saving, the game clock and villager schedules. This sub-project adds the plan itself.

## Decisions (from brainstorming, 2026-10-16)
- **The plan goal is chosen by the player.** It is a profile setting next to the route and farm type, saved with the rest of the profile, and changeable at any time.
- **Plans are hand-authored per goal** as typed JSON, in the same way as the other game data. No generator or optimizer (that stays on the later roadmap).
- **First goals:** `community-center` (finish the Community Center, or the Joja equivalent, in year 1) and `money` (maximize gold and farm growth). The format allows more goals without code changes.
- **Each day has a short checklist plus a one-line reason** (`why`).
- **Rain is a variant, not a reschedule.** A day may have `rainTasks` that replace its tasks when the clock's weather is rain.
- **Falling behind is visible, not automatic.** A collapsed Catch-up section lists unchecked tasks from earlier days. Nothing is rescheduled.

## Data model
- `src/data/plans/<goal>.json`: a list of day entries keyed by `season` and `day`.
- Day entry: `season`, `day`, `why`, `tasks`, optional `rainTasks`.
- Task: `id` (stable, unique within the plan), `text`, optional `item`, `place`, `time`, optional `route` (`community-center` or `joja`; tasks with no route show for both).
- `src/data/types.ts` adds `PlanGoal = 'community-center' | 'money'`, `PlanTask`, `PlanDay`, `Plan`.
- `src/data/plans.ts` exposes `PLAN_GOALS` (id, label, description) and selectors:
  - `planForDay(goal, route, season, day, weather)` returns the day's entry with tasks filtered by route and rain variant applied, or `undefined` if there is no entry.
  - `missedTasks(goal, route, clock, checked)` returns unchecked tasks from days before the clock's current day, grouped by day.
- Plans may be partial. A day with no entry falls back to the legacy opening-route steps (see UI). The README states how much of the year each plan covers.

## Profile and saving
- `SaveData.profile` gains `planGoal`. Saves and imports without it default to `community-center`. Import validation accepts only known goals.
- Checked tasks are stored in the existing `checked` array as `plan:<goal>:<taskId>`, so export/import needs no new storage and the save version does not change.
- A goal picker in the header sits next to the route toggle and shows each goal's description. Changing the goal never removes checked progress.

## UI (Today tab)
- A **Day plan card** replaces the opening-route `PathCard` as the main card. It shows the clock's current day and weather: the `why` line, then the tasks as checkboxes. In rain, `rainTasks` replace the normal list, with a small label saying so.
- A **Catch-up section** below it, collapsed by default, lists unchecked tasks from earlier days grouped by day, with the same checkboxes.
- Clock status `idle` shows Spring 1. At the end of the year (Winter 28 passed, or status `ended`) the card shows a "Year 1 complete" message.
- `NextGoalCard` shows the next unchecked plan task instead of the next path step.
- The aside (notes, needed items, where is everyone) and the Recipes section are unchanged.
- **Fallback:** if the goal has no entry for the current day, the card shows the legacy opening-route steps. `path-steps.json` and `PathCard` are kept; retiring them is a later cleanup once plans cover those days.

## Out of scope
- A full-year plan view or calendar and its print layout (natural follow-up).
- Adaptive rescheduling, dependency data between tasks, and any plan generator or optimizer.
- Farm layout uploads and save-file import.

## Testing
- Selector unit tests: rain swap, route filtering, missing-day fallback, `missedTasks` grouping and ordering, goal defaulting.
- Save tests: `planGoal` defaulting on old saves, import validation, goal change keeps checked ids.
- Component tests: Day plan card (normal, rain, idle, ended, fallback), Catch-up, goal picker.
- Data-integrity test: every plan parses against the types, task ids are unique within a plan, days are valid for their season (1-28), and every referenced `item` and `place` exists in the other data files.

## Verification
- `npm run build` and `npm test` pass.
- Manual check of the Today tab at desktop and phone width, plus print preview.
- Plan content is spot-checked against the Stardew Valley wiki (credited in the README, which also gets updated: features, roadmap, plan coverage).

## Risks
- **Content volume.** Two plans of up to 112 days each is a lot of hand-written data that must be accurate. Partial plans are allowed so the engine can ship and the content can grow in follow-up commits, with the earliest days written first.
