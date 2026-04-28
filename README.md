# mcu-tracker

Local-first MCU rewatch tracker (episode-level) generated from `list.txt`.

## Structure
- `list.txt`: your ordered watchlist (source of truth)
- `tools/build-watchlist.mjs`: generates the app data
- `web/`: Vite + React + TypeScript app

## Requirements
- Node.js (recommended: 22+)
- npm

## Quick Start (Local Dev)
From repo root:

```bash
cd web
npm install
node tools/build-watchlist.mjs
npm run dev
```

Open the dev server URL it prints.

## Generate watchlist JSON
The app reads `web/public/watchlist.json`, which is generated from `list.txt`:

```bash
node tools/build-watchlist.mjs
```

## Deploy
Build a static bundle:
```bash
node tools/build-watchlist.mjs
cd web
npm run build
```

Host the resulting static site from `web/dist/` (any static host works).

If you host under a subpath (not `/`), build with:
```bash
node tools/build-watchlist.mjs
cd web
BASE_PATH=/mcu/ npm run build
```

## GitHub Pages
This repo includes a GitHub Actions workflow that builds and deploys `web/dist/` to GitHub Pages on pushes to `main`:
- `.github/workflows/deploy-pages.yml`

In your repo settings, enable GitHub Pages to deploy from **GitHub Actions**.

This repository’s URL is:
```text
https://github.com/samrook/mcu-tracker
```

## Self-hosting notes
- Progress is stored locally in the browser (IndexedDB), so each device/browser has independent progress.
- Use **Export**/**Import** in the UI to back up or move your progress between devices.
