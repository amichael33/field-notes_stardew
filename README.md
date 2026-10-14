# Field Notes

A todo list and planner for Stardew Valley. The goal is an optimized, day-by-day plan for the most efficient first year, with the reference data you need beside it, in a site you can use (or print) while you play.

Live site: https://amichael33.github.io/field-notes_stardew/

This is an early version. It has the opening route with a checklist, bundles with item icons and obtained tracking, villager gifts and birthdays, achievements, and Markdown notes, and it saves your progress in your browser.

## Features (current)

- **Today**: the opening route as a checklist (Willy's pole, the rainy-day fishing plan, early money goals) with progress shown in a banner and ribbon, plus the Queen of Sauce recipes in air order. A "Where is everyone" card appears only when there is something to show.
- **Item icons**: the Needed-this-season card on Today and the Community Center tab show each item's icon. Gold amounts show a drawn gold-coin tile.
- **Community Center**: Community Center bundle items grouped by bundle, filterable by season, with where to get each item. A Community Center / Joja toggle hides the bundles on the Joja route.
- **Item details and obtained items**: click an item's image for details (name, quantity, source, seasons, bundle). Click its name to mark it obtained: it leaves the Today list and is struck through on the Community Center tab. Obtained items are saved in your browser and included in Export / Import.
- **People**: a birthday calendar and every villager's loved and liked gifts.
- **Goals**: what each achievement requires.
- **Notes**: Markdown notes (bullets and nested sub-bullets) with an Edit / Preview toggle, on both the Today card and the Notes tab, which edit the same saved note.
- **Saved in your browser**: checklist progress, obtained items, notes and your Community Center / Joja route choice are kept between visits.
- **Export / import**: download your saved progress as a JSON file and load it back later or on another device.
- **Farm** tab is a placeholder for now (see the roadmap).
- **Print-friendly**: the header, controls and footer are hidden when you print, and a Print page button is in the header.

## Roadmap

1. Core site and static reference data (done)
2. Saving: notes, checklist progress, route choice, and JSON export/import, all in your browser with no accounts (done)
3. Next: game-clock sync with villager locations and schedules, and a structured day-by-day year 1 plan
4. Farm layout and avatar photo uploads
5. Later: layout optimizer and save-file import

## Your data

Everything you save (checklist progress, obtained items, notes, route choice) lives only in your browser's local storage. Nothing is sent anywhere. Clearing site data erases it, so use Export to keep a copy.

## Run it locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev      # start the dev server
npm test         # run the tests
npm run lint     # lint
npm run build    # production build into dist/
```

## Where the data comes from

Villager birthdays and gift tastes, the Community Center bundles, the achievements and the Queen of Sauce recipes are generated from the [Stardew Valley Wiki](https://stardewvalleywiki.com) by a script, not typed by hand:

```bash
npm run data:wiki
```

The script (in `scripts/wiki/`) fetches each page once through the wiki's MediaWiki API, waits a second between requests, identifies itself in its user-agent, and saves pages in `scripts/.cache/` (git-ignored) so they are never fetched twice. It rewrites `villagers.json`, `bundles.json`, `achievements.json` and `recipes.json` in `src/data/`, prints every difference from the previous files, and refuses to write anything if a page fails to parse. Run it again only after a game update. The site itself never contacts the wiki.

Only the opening-route steps are still hand-written in `src/data/path-steps.json`. Bundle item seasons are kept from the hand-curated file; the script only derives seasons for brand-new items and lists them for checking.

`npm test` runs the parser tests (against saved wiki pages in `scripts/wiki/fixtures/`) and the data-integrity tests.

Known limits of the data today:
- Gift lists keep the wiki's wording, e.g. "All Universal Loves (except ...)".
- Recipes are the 32 from The Queen of Sauce (both years) with the other places each can be bought; recipes learned from villagers or other sources are not included yet.
- The path has no villager schedule times yet.

## Game art and icons

The item icons are artwork from Stardew Valley and belong to ConcernedApe. They were unpacked from the author's own copy of the game using [StardewXnbHack](https://github.com/Pathoschild/StardewXnbHack) by Pathoschild. The wiki is not used for images. The gold amounts use a drawn gold-coin tile instead of game art.

To regenerate them, unpack the game into a `Content (unpacked)/` folder at the repo root with StardewXnbHack, then run:

```bash
npm run icons
```

This writes `public/items/` and `src/data/item-icons.json`. The `Content (unpacked)/` folder is git-ignored and never published.

## License

The wiki's text is available under [Creative Commons Attribution-NonCommercial-ShareAlike 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/). The data files and fixtures derived from it, and this site, are therefore non-commercial and should be shared under the same license, with credit to the Stardew Valley Wiki and its editors.

## Deploying

Pushes to `main` build and deploy to GitHub Pages through `.github/workflows/deploy.yml`. In the repo settings, set Pages source to **GitHub Actions**.

## Credits

Game data comes from the [Stardew Valley Wiki](https://stardewvalleywiki.com), which is community-written (see License above). Thank you to its editors.

Item icons are ConcernedApe's artwork, unpacked with [StardewXnbHack](https://github.com/Pathoschild/StardewXnbHack) by Pathoschild (see Game art and icons above).

Headings use the Fisherman font by Nurrehmet Studio. The author's contact and licence note are in `Readme.txt`.

## Disclaimer

This is an unofficial fan project. It is not affiliated with or endorsed by ConcernedApe or Stardew Valley. Stardew Valley is a trademark of ConcernedApe.
