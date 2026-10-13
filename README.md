# Field Notes

A todo list and planner for Stardew Valley. The goal is an optimized, day-by-day plan for the most efficient first year, with the reference data you need beside it, in a site you can use (or print) while you play.

This is an early version. Right now it is a **read-only reference** with the opening route, bundles, villager gifts and birthdays, and achievements.

## Features (current)

- **Today**: the opening route as plain-text steps (Willy's pole, the rainy-day fishing plan, early money goals) plus the Queen of Sauce recipes in air order.
- **Community Center**: Community Center bundle items grouped by bundle, filterable by season, with where to get each item. A Community Center / Joja toggle hides the bundles on the Joja route.
- **People**: a birthday calendar and every villager's loved and liked gifts.
- **Goals**: what each achievement requires.
- **Farm and Notes** tabs are placeholders for now (see the roadmap).
- **Print-friendly**: the header, controls and footer are hidden when you print, and a Print page button is in the header.

## Roadmap

1. Core site and static reference data (this release)
2. Saving: notes, checklist progress, a new-save profile (Joja or Community Center route, farm type), and JSON export/import. Everything stays in your browser, with no accounts.
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

## Where the data comes from

Villager birthdays and gift tastes and the Community Center bundles are generated from the [Stardew Valley Wiki](https://stardewvalleywiki.com) by a script, not typed by hand:

```bash
npm run data:wiki
```

The script (in `scripts/wiki/`) fetches each page once through the wiki's MediaWiki API, waits a second between requests, identifies itself in its user-agent, and saves pages in `scripts/.cache/` (git-ignored) so they are never fetched twice. It rewrites `src/data/villagers.json` and `src/data/bundles.json`, prints every difference from the previous files, and refuses to write anything if a page fails to parse. Run it again only after a game update. The site itself never contacts the wiki.

The achievements, the Queen of Sauce recipes and the opening-route steps are still hand-written in `src/data/`. Bundle item seasons are kept from the hand-curated file; the script only derives seasons for brand-new items and lists them for checking.

`npm test` runs the parser tests (against saved wiki pages in `scripts/wiki/fixtures/`) and the data-integrity tests.

Known limits of the data today:
- Gift lists keep the wiki's wording, e.g. "All Universal Loves (except ...)".
- Only the first-year Queen of Sauce recipes are listed.
- The path has no villager schedule times yet.

## License

The wiki's text is available under [Creative Commons Attribution-NonCommercial-ShareAlike 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/). The data files and fixtures derived from it, and this site, are therefore non-commercial and should be shared under the same license, with credit to the Stardew Valley Wiki and its editors.

## Deploying

Pushes to `main` build and deploy to GitHub Pages through `.github/workflows/deploy.yml`. In the repo settings, set Pages source to **GitHub Actions**.

## Credits

Game data comes from the [Stardew Valley Wiki](https://stardewvalleywiki.com), which is community-written (see License above). Thank you to its editors.

## Disclaimer

This is an unofficial fan project. It is not affiliated with or endorsed by ConcernedApe or Stardew Valley. Stardew Valley is a trademark of ConcernedApe.
