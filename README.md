# Stardew Field Notes

A todo list and planner for Stardew Valley. The goal is an optimized, day-by-day plan for the most efficient first year, with the reference data you need beside it, in a site you can use (or print) while you play.

This is an early version. Right now it is a **read-only reference** with the opening route, bundles, villager gifts and birthdays, and achievements.

## Features (current)

- **Beginner Path**: the opening route as plain-text steps (Willy's pole, the rainy-day fishing plan, early money goals) plus the Queen of Sauce recipes in air order.
- **Bundles**: Community Center bundle items grouped by bundle, filterable by season, with where to get each item. A Community Center / Joja toggle hides the bundles on the Joja route.
- **Villagers**: a birthday calendar and every villager's loved and liked gifts.
- **Achievements**: what each achievement requires.
- **Print-friendly**: navigation and controls are hidden when you print the page.

## Roadmap

1. Core site and static reference data (this release)
2. Saving: notes, checklist progress, a new-save profile (character look, Joja or Community Center route, farm type), and JSON export/import. Everything stays in your browser, with no accounts.
3. Game-clock sync with villager locations and a structured day-by-day year 1 plan
4. Farm layout and avatar photo uploads
5. Later: layout optimizer and save-file import

## Run it locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev      # start the dev server
npm test         # run the tests
npm run build    # production build into dist/
```

## Contributing data

All game data lives in `src/data/*.json` with types in `src/data/types.ts`. Edit the JSON, then run `npm test`: the data-integrity tests check for missing sources, invalid seasons and bad birthdays.

Known limits of the data today:
- Gift lists keep the wiki's wording, e.g. "All Universal Loves" and "except" notes.
- Only the first-year Queen of Sauce recipes are listed.
- The path has no villager schedule times yet.

Corrections are welcome. Please cite the wiki page.

## Deploying

Pushes to `main` build and deploy to GitHub Pages through `.github/workflows/deploy.yml`. In the repo settings, set Pages source to **GitHub Actions**.

## Credits

Game data is transcribed from the [Stardew Valley Wiki](https://stardewvalleywiki.com), which is community-written. Thank you to its editors.

## Disclaimer

This is an unofficial fan project. It is not affiliated with or endorsed by ConcernedApe or Stardew Valley. Stardew Valley is a trademark of ConcernedApe.
