# marvel-tracker

Local-first MCU rewatch tracker (episode-level) generated from `list.txt`.

## Structure
- `list.txt`: your ordered watchlist (source of truth)
- `tools/build-watchlist.mjs`: generates the app data
- `web/`: Vite + React + TypeScript app

## Generate watchlist JSON
From repo root:

```bash
node tools/build-watchlist.mjs
```

This writes `web/public/watchlist.json`.

## Run locally
```bash
cd web
npm install
npm run dev
```

## Deploy
Build a static bundle:
```bash
cd web
npm run build
```

Serve `web/dist/` behind your reverse proxy.

If you host under a subpath (not `/`), build with:
```bash
cd web
BASE_PATH=/mcu/ npm run build
```
