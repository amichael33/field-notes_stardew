# Field Notes: Item Icons, Obtained Items and Markdown Notes (Sub-project 2b)

## Purpose
Make the bundle checklist visual and playable: every needed item shows its in-game icon, clicking the icon shows its details, and clicking the name marks it obtained so it leaves the "still needed" list. Notes for tomorrow support Markdown (bullets and nested sub-bullets). Everything stays in the browser, with no backend.

## Decisions
- Icons come from the author's own copy of the game, unpacked with [StardewXnbHack](https://github.com/Pathoschild/StardewXnbHack) into `Content (unpacked)/` at the repo root. That folder is git-ignored (done in commit `b35aae1`) and is never committed or deployed.
- A script crops the ~125 icons the site needs into `public/items/` and writes a name-to-file map. Those small PNGs and the map are committed, so the deployed site does not need the game files. The icons are ConcernedApe's artwork; the README credits that, credits StardewXnbHack for how they were unpacked, and keeps the non-affiliation notice.
- The wiki is not used for images: it now blocks automated clients behind a bot check, and the project does not work around that.
- Obtained flags reuse the existing saved `checked: string[]` list with ids `bundle:<bundle id>:<item name>`. A later item with the same name in the same bundle gets a `#2`, `#3`, ... suffix (e.g. `bundle:construction:Wood#2`) so duplicates are tracked separately. No save-format change and no version bump; Export/Import carry them automatically.
- Markdown is rendered with `react-markdown` and no raw HTML. It is the only new runtime dependency. `pngjs` is a dev-only dependency for the icon script.
- Items with no icon file (the four gold amounts) show an inline SVG gold coin, which is our own drawing, not game art. Any other item missing a file shows a text tile.

## Icons
- `npm run icons` runs `scripts/icons/build-icons.mjs`. It reads `Content (unpacked)/Data/Objects.json`, `Content (unpacked)/Strings/Objects.json`, `Content (unpacked)/Maps/springobjects.png` and `Content (unpacked)/TileSheets/Objects_2.png`. If the folder is missing it exits with a clear message and writes nothing.
- Sprites are 16x16. `springobjects.png` is 384 wide (24 columns): sprite index `i` is at x = (i % 24) * 16, y = floor(i / 24) * 16. `Objects_2.png` is 128 wide (8 columns), used for items whose `Texture` is `TileSheets\Objects_2` (Jelly, Wine).
- Item names are matched to `Objects.json` by `Name` or by the localised `DisplayName` string. Quality suffixes such as " (gold quality)" or " (silver quality or better)" are stripped, so those variants reuse the base icon. Hand mappings (name to object id): "Large Brown Egg" is 182 and "Large Goat Milk" is 438. When two objects share a name (the white and brown eggs are both called "Large Egg" in the data), the first id wins unless a hand mapping says otherwise.
- Output: `public/items/<slug>.png` per item (slug is the lowercase name with non-alphanumerics replaced by `-`) and `src/data/item-icons.json`, a map of item name to relative file path (`items/<slug>.png`) or `null` for the gold amounts. The script prints every bundle item it could not match and exits non-zero if any item other than the four gold amounts is unmatched.
- Icons are shown at 48px with `image-rendering: pixelated`.

## Obtained items and the detail panel
- `ItemTile` shows the icon (or the gold coin, or the text tile). The image is a button that opens `ItemDetail`. The item name beside it is a separate button that toggles obtained.
- `ItemDetail` is a native `<dialog>` showing name, quantity, source, seasons and bundle. It closes with Escape or a Close button and returns focus to the tile that opened it. The same component is used in both views.
- **Today view, "Needed this season":** obtained items are removed from "Still needed". The count reads "k of N" where N is `slotsRequired` and k is the number of obtained items in that bundle. When k reaches N the bundle shows "Complete" and no "Still needed" list. The existing messages stay: "Bundles are not used on the Joja route." and "No bundle items available this season."
- **Community Center tab:** every item stays listed with its tile; obtained items are struck through and greyed, and clicking the name again un-obtains them.
- The same item appearing in two bundles is tracked separately per bundle (the id includes the bundle id).
- An imported or stored `bundle:` id that matches no current item is ignored for display and kept in the saved list.

## Markdown notes
- `MarkdownNotes` is one shared component used by the Today "Notes for tomorrow" card and the Notes tab, over the same saved `notes` field. It has an Edit / Preview toggle: Edit is the textarea, Preview renders the Markdown.
- Bullets and nested sub-bullets work (indent a sub-bullet by two spaces under a `- ` item). Raw HTML is not rendered: a pasted `<script>` shows as plain text. Links open in a new tab with `rel="noopener noreferrer"`.
- A very long unbroken note wraps (`overflow-wrap: anywhere`) and does not widen its card.

## Docs
README gains: the StardewXnbHack credit with a link and the sentence that the icons were unpacked from the author's own copy of the game with it; a credit that the artwork belongs to ConcernedApe; how to regenerate icons (`npm run icons` after unpacking the game with StardewXnbHack into `Content (unpacked)/`); and Markdown notes in the feature list. The font credit line for Fisherman is added in the same edit.

## Testing
- **Icon script (unit):** crop coordinates for both sheets on a small generated fixture sheet; name matching including quality stripping, the two hand mappings, duplicate-name handling, and the gold amounts mapping to `null`.
- **Selectors/state (unit):** `bundleItemId(bundle, item)`; obtained count and completion per bundle; removing obtained items from the Today list.
- **View:** Today view removes an obtained item and updates "k of N" and shows "Complete"; the Community Center tab strikes it through and un-obtains on a second click; the same item in two bundles toggles independently; the detail dialog opens from the image, shows the fields, closes on Escape and returns focus; the Joja and empty-season messages still show.
- **Markdown (view):** nested bullets render as a nested list; `<script>` is shown as text; the toggle keeps the note text; the note is shared between the Today card and the Notes tab.

## Review focus
1. An item in two bundles: ticking one does not tick the other.
2. A bundle that reaches its required slots before all its items are ticked shows "Complete".
3. An imported `bundle:` id for an item that no longer exists causes no crash and no visible entry.
4. An item whose icon file is missing shows a text tile, not a broken image.
5. A very long note, and Markdown with HTML in it, do not break the card or run code.

## Out of scope
Wiki scraping, other tabs' items (achievements, recipes, gifts) getting icons, image upload, per-item notes, drag-to-reorder, and a Tab-key shortcut for indenting bullets in the textarea.
