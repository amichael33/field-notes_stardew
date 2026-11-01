# Field Notes

A todo list and planner for Stardew Valley. The goal is an optimized, day-by-day plan for the most efficient first year, with the reference data you need beside it, in a site you can use (or print) while you play.

Live site: https://amichael33.github.io/field-notes_stardew/

This is an early version. It has the opening route with a checklist, bundles with item icons and obtained tracking, villager gifts and birthdays, achievements, and notes, and it saves your progress in your browser.

## Features (current)

- **Today**: the opening route as a checklist (Willy's pole, the rainy-day fishing plan, early money goals) with progress shown in a banner and ribbon, plus the Queen of Sauce recipes in air order. A "Where is everyone" card appears only when there is something to show.
- **Year 1 day plan**: pick a plan goal in the header (Community Center in year 1, or Max money and farm growth). The Today tab then shows a Day plan for the clock's current day, with a one-line reason and a checklist, a rainy-day variant when the weather is Rain, and unchecked tasks from earlier days carried over into an open list. Tasks tagged for the Community Center or Joja route only show on that route. Next goal shows your next unchecked plan task. Days with no plan entry fall back to the opening route checklist.
- **Game clock**: press Start day in the Today banner to run a manual in-game clock (10 game minutes per 7 real seconds). Pause, nudge by 10 minutes, set the date and time, and switch between Sunny and Rain. Next day (while the day is running or paused, for going to bed early) and Start day (after the day ends at 2:00 AM) move to the next date at 6:00 AM. If the site is open in two tabs, only the tab where you last changed the clock advances it. The last day is saved and carried by Export / Import; a reload restores a running clock as paused.
- **Where is everyone (live)**: with the clock running, the card shows where each villager or shop owner named in your unchecked steps is right now and where they go next, for example "Pierre's General Store since 7:00 AM" (Pierre on Spring 1). Rain schedules are used when it rains, and villagers whose rainy routine can vary say so. Without a clock it prompts you to press Start day.
- **Item icons**: the Needed-this-season card on Today and the Community Center tab show each item's icon. Gold amounts show a drawn gold-coin tile.
- **Community Center**: Community Center bundle items grouped by bundle, filterable by season, with where to get each item. Cards are staggered, and rooms show Locked or Unlocked based on how many bundles you have completed (Pantry and Fish Tank after 1, Boiler Room after 2, Bulletin Board after 3, Vault after 4, and the Missing Bundle after all the rest). A Community Center / Joja toggle hides the bundles on the Joja route.
- **Item details and obtained items**: click an item's image for details (name, quantity, source, seasons, bundle). Click its name to mark it obtained: it leaves the Today list and is struck through on the Community Center tab. Obtained items are saved in your browser and included in Export / Import.
- **People**: the game's own birthday calendar with each villager's portrait, and every villager's loved and liked gifts. With the clock running, each card says where that villager is now and where they go next; hover or click it to see the spot marked on the game's map for the current season; the map goes away when the pointer leaves it.
- **Goals**: a Needed for Perfection list (the 11 requirements and what each is worth, adding up to 100%) and all 49 achievements with their icons, what they unlock and notes such as the Polyculture and Monoculture crop lists. Tick an entry to mark it done: it drops to the bottom of its list and is saved with the rest of your progress. Spoilers (secret and late-game entries) sit at the bottom of each list, greyed out until you click them.
- **Notes**: plain-text notes with bullets: type a dash and a space for a bullet, Enter continues it, Tab nests it. On both the Today card and the Notes tab, which edit the same saved note.
- **Your tasks**: add your own tasks to any day under the Day plan. They are saved, included in Export / Import, and unfinished ones from earlier days stay listed.
- **Saved in your browser**: checklist progress, plan task checkboxes, obtained items, notes, your plan goal and your Community Center / Joja route choice are kept between visits.
- **Export / import**: download your saved progress as a JSON file and load it back later or on another device.
- **Farm**: one page at a glance. On the left, **Ready today** lists crops that are ready now or tomorrow, with a Harvested button, the crops that died at the season change, and the next three harvests coming up. Under it, **Next goal** shows the building you picked, with its cost and materials. On the right, small **Crops planted**, **Buildings** and **Animals** boxes show picture tiles: tap a tile for its actions, or tap **+** to add. ★ sets a building as the next goal. The goal also shows on Today and clears itself once it is built. Animals are counted per type, with coop and barn capacity shown and a warning when a building is over capacity. The Today tab also has a Ready to harvest card. Everything is saved in your browser and included in Export / Import.
- **Print-friendly**: printing from the browser uses the print-friendly styles, which hide the header, controls and footer.

## Roadmap

1. Core site and static reference data (done)
2. Saving: notes, checklist progress, route choice, and JSON export/import, all in your browser with no accounts (done)
3. Game clock and villager schedules (done)
4. In progress: a day-by-day year 1 plan. The engine is done and Spring 1 to 28 is covered for both goals (Summer, Fall and Winter come next). Days with no entry show the opening route.
5. Farm tracker (done); farm layout uploads later
6. Later: layout optimizer and save-file import

## Your data

Everything you save (checklist progress, obtained items, notes, route choice, plan goal, plan task checkboxes, the farm section (buildings, animals, crops and the next goal), and the game clock's date, time, weather and status) lives only in your browser's local storage. Nothing is sent anywhere. Clearing site data erases it, so use Export to keep a copy.

## Run it locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev      # start the dev server
npm test         # run the tests
npm run lint     # lint
npm run icons    # regenerate item icons (needs the unpacked game, see below)
npm run portraits # regenerate villager portraits (needs the unpacked game, see below)
npm run schedules # regenerate villager schedules (needs the unpacked game, see below)
npm run farm     # regenerate farm data (needs the unpacked game, see below)
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
- Schedules cover normal days only (weather, date, weekday and season rules, at 0 hearts). Marriage, festival and heart-level schedules are skipped, and mail-gated rules use the not-yet-received branch (for example, before the beach bridge or the bus is fixed). Krobus, the Wizard and the Dwarf have no schedule file, and Leo's file is skipped on purpose because it is his Ginger Island schedule.

## Game art and icons

The item icons are artwork from Stardew Valley and belong to ConcernedApe. They were unpacked from the author's own copy of the game using [StardewXnbHack](https://github.com/Pathoschild/StardewXnbHack) by Pathoschild. The achievement icons on the Goals page come from the Stardew Valley Wiki, and 28 crop icons were drawn by hand (in `scripts/icons/hand/`); every other picture comes from the game files. The gold amounts use a drawn gold-coin tile instead of game art.

To regenerate them, unpack the game into a `Content (unpacked)/` folder at the repo root with StardewXnbHack, then run:

```bash
npm run icons
```

This writes `public/items/` and `src/data/item-icons.json`. `npm run portraits` likewise crops each villager's neutral portrait from `Content (unpacked)/Portraits/` into `public/portraits/`. The `Content (unpacked)/` folder is git-ignored and never published.

Villager schedule data comes from the same place: the player's own unpacked game files (`Content (unpacked)/Characters/schedules/`), not the wiki. It is ConcernedApe's data, trimmed by a script. To regenerate it, with the game unpacked as above, run:

```bash
npm run schedules
```

This writes `src/data/schedules.json`.

Farm data is read the same way. `npm run farm` reads the buildings, animals, crops and objects tables from `Content (unpacked)/Data/` and writes `src/data/farm-buildings.json`, `src/data/farm-animals.json` and `src/data/farm-crops.json`. It also cuts the building and animal sprites from the same files into `public/farm/` and writes `src/data/farm-sprites.json`. The house upgrade costs are a small hand-written table (`src/data/farm-upgrades.json`), checked against the [Stardew Valley Wiki](https://stardewvalleywiki.com).

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
