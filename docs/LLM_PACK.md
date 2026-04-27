# Local LLM Pack (≤60K context)

Use this file as the “entry point” when you ask a small-context local model for help.

## Always Include
- Current task + acceptance criteria (1–5 bullets)
- Filepaths you’re working on (only those files)
- Relevant excerpts (paste small snippets, not whole files)

## Repo Facts (don’t restate every time)
- Watch order comes from `list.txt`
- Generator: `tools/build-watchlist.mjs` → `web/public/watchlist.json`
- App: `web/` (Vite + React + TS)
- Storage: IndexedDB (no login)

## Suggested Prompt Template
Task:
- …

Constraints:
- Don’t change the JSON schema in `docs/SCHEMA.md` unless required.
- Keep changes minimal and additive.

Files:
- `path/to/file.tsx` (paste snippet)

Question:
- …

