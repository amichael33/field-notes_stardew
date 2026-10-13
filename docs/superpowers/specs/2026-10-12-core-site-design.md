# Field Notes: Core Site Design (Sub-project 1)

## Purpose
A public website that works as a Stardew Valley todo and tracker for an efficient playthrough. It is for the author and other players, and is hosted free on GitHub Pages. The full wishlist is split into sub-projects, and this spec covers only the first.

## Core concept
This is a todo list, but in the first year it is an optimized day-by-day plan of what to do, aimed at the most efficient playthrough. The long-term product is that plan plus the reference data that supports it.

Sub-project 1 only hardcodes the **opening route** as plain-text path steps. The real structured schedule data (villager locations by time, per-day plans through year 1) comes in later sub-projects.

A new save starts with a profile setup:
- Customize your character, shown in a corner of the UI the way Stardew shows the player.
- Choose the **Joja route or the Community Center route**. This changes the bundles view and the plan.
- Farm type, which feeds the later layout suggestions.

## Decisions
- Static site on GitHub Pages: no backend, no logins.
- Vite + React + TypeScript.
- Game data is hand-curated typed JSON transcribed from the Stardew Valley wiki and credited in the README.
- Later persistence (sub-project 2) uses browser localStorage plus JSON export/import.

## Roadmap
1. Core site and static reference data (this spec)
2. Persistence and new-save profile (character customization shown in the corner, Joja or Community Center route, farm type), notes, checklist progress, export/import, and print-to-PDF styling
3. Game-clock sync with villager locations and schedules, plus the structured day-by-day year 1 plan
4. Farm layout image upload and avatar photo upload
5. Optional later: layout optimizer, save-file import

## Scope of sub-project 1
Read-only reference views plus the app shell:
- **Beginner path**: the opening route only, hardcoded as plain-text steps in `path-steps.json` (no structured schedule data yet). It covers the first-day route (where each person is at what time), Willie and the fishing pole, the rainy-day plan (go fishing), early money goals (e.g. backpack upgrade), and recipes in order of appearance with season.
- **Bundles**: community center items by season and availability, with where to get each. A simple Community Center / Joja toggle (held in the page, not saved) shows or hides this view. Saving the choice comes in sub-project 2.
- **Gifts and birthdays**: each villager's loves and likes, plus a birthday calendar.
- **Achievements**: requirements for each achievement.
- **App shell**: navigation, season filter, responsive layout, print-friendly base CSS.

Out of scope: saving anything (including the profile and character customization), clock sync, structured schedule data, uploads, the optimizer.

## Architecture
- `src/data/*.json` with matching `src/data/types.ts`: bundles, villagers, achievements, path steps, recipes. Data is checked against the types at build time.
- `src/views/` has one component per view. `src/components/` holds shared pieces (season filter, item chip, checklist row).
- Views read data through small selector functions (`itemsBySeason`, `birthdaysByMonth`) so later sub-projects can add state and time logic without touching raw data.
- Hash-based client routing, so GitHub Pages needs no server config.
- A GitHub Actions workflow builds and deploys to Pages.

## Testing
- Vitest unit tests for the selector functions.
- A data-integrity test: no missing fields, valid seasons, every bundle item has a source.
- Manual check of each view at desktop and phone width, plus print preview.

## Deliverables
- Working site deployed to GitHub Pages.
- Public README: what it is, screenshots, feature list, roadmap, how to run it and contribute data, wiki credit, and a non-affiliation notice for Stardew Valley and ConcernedApe.

## Verification
- `npm run build` and `npm test` pass.
- The deployed Pages URL loads all five views.
- Bundles and a sample of villagers are spot-checked against the wiki.

## Design update (2026-10-12)
The site is named **Field Notes**. The visual direction comes from the author's "Valley Path" mockup: dark green header with gold accents, Pixelify Sans headings, Nunito Sans body, white cards on a pale sage page, 44px touch targets.

Tabs: Today, Community Center, Goals, People, Farm, Notes.
- Today shows the opening route (formerly Beginner Path). The live clock, timed timeline and "where is everyone" panel arrive with sub-project 3.
- Community Center, Goals and People are the former Bundles, Achievements and Villagers views.
- Farm and Notes are "Coming soon" placeholders until sub-projects 2 and 4.
- The header has a Print page button. Export and Import arrive with sub-project 2.

Mockup parts that need later sub-projects: game clock, walking times and shop-open status (3); checkboxes, bundle progress bars, gold goal and saved notes (2).
