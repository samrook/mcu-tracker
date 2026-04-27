# MCU Rewatch Tracker (Local-First)

## Goal
Build a small website for tracking an MCU rewatch (movies + shows + Agents of S.H.I.E.L.D.) in the exact order defined in `list.txt`.

## Key Requirements
- Track at **episode level** for TV content (each episode individually).
- **No login** and **no accounts**: progress is stored locally in the browser (IndexedDB).
- Works when deployed behind a reverse proxy as a static site.
- Easy backup/restore (export/import a single JSON file).

## Non-Goals (MVP)
- No ratings, reviews, or freeform notes.
- No shared progress / sync between devices.
- No scraping metadata (posters, runtimes) required.

## Source of Truth
- `list.txt` is the only source of ordering.
- A build step converts `list.txt` into `web/public/watchlist.json` for the app to load.

