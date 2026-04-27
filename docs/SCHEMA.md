# Data Model

## `web/public/watchlist.json`
Generated from `list.txt` by `tools/build-watchlist.mjs`.

Shape (schemaVersion `1`):
- `schemaVersion`: number
- `generatedAt`: ISO datetime string
- `contents`: record keyed by `contentId`
  - `contentId`: string (stable)
  - `kind`: `"movie" | "special" | "episode" | "unexpanded_series"`
  - `title`: string (canonical title)
  - `displayTitle`: string (as shown in UI)
  - `series?`: `{ key, title, season?, episode? }` (for episodes)
  - `unreleased?`: boolean (best-effort, based on the line text)
- `timeline`: ordered array of entries
  - `entryId`: unique string (can repeat the same `contentId` multiple times)
  - `contentId`: string (links to `contents`)
  - `order`: number (1-based)
  - `sourceLine`: number (line number in `list.txt`)
  - `sourceText`: string (original non-empty line)

Rationale:
- `contentId` is deduped so the same thing can appear twice in `list.txt` (e.g. alternative placement) without forcing you to “watch it twice”.
- `timeline` preserves your exact planned order.

## Browser Progress (IndexedDB)
Single object store keyed by `contentId`:
- `contentId`: string
- `watched`: boolean
- `updatedAt`: ISO datetime string

Export/import is simply:
- `{ schemaVersion, exportedAt, progress: Record<contentId, { watched, updatedAt }> }`

