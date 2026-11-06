# Memory.md — NewsFeed-Google-AI-

## Port
3002

## Start command
```
node node_modules/tsx/dist/cli.mjs server.ts
```

## Key fixes applied (2026-08)
- PORT default changed from 3000 → 3002 in server.ts
- start.bat: replaced `node_modules\.bin\tsx.cmd` with `node node_modules\tsx\dist\cli.mjs`
- .env.local created with WATSONX + GEMINI keys
- test.mjs created

## Architecture
- Express + Vite (dev middleware mode)
- WatsonX inline helper (no shared module dependency)
- Google Gemini for news generation
- RSS feed parsing via rss-parser
- Google Sheets CSV for news data

## Security Audit — 28-Oct-2026
Created `risk.md`. **HIGH finding actioned:** `firebase-applet-config.json` (contains Firebase API key `AIzaSy...`) was NOT in `.gitignore` — **FIXED**: added to `.gitignore` in this session. Firebase project: `calcium-airlock-t83b3`. Recommend rotating the Firebase Web API key in Firebase Console if this repository was ever pushed to a remote. All WatsonX/Gemini keys are properly in `.env.local` (git-ignored). No exec/eval, no injection risks. Full findings in [`risk.md`](risk.md).

## Current Dependencies
- express 4.21, @google/genai 2.4, firebase 12.15, rss-parser 3.13, dotenv 17, React 19, Vite 6, tsx 4

## Phase 9–11 Audit Completion — 28-Oct-2026

### Phase 9: API/MCP Configuration
- `API_KEYS_CONFIG.md` created documenting: `WATSONX_API_KEY`, `WATSONX_PROJECT_ID`, `GEMINI_API_KEY`.
- Keys loaded via `shared/secrets.env` → `shared/load-env.js` (`loadSharedEnv()` wired into `server.ts`).
- **GEMINI_API_KEY is DEAD** (Google revoked it after it was accidentally exposed in a previous Memory.md commit). User must regenerate at https://aistudio.google.com/app/apikey.
- Model default updated in `server.ts`: `gemini-1.5-flash` → `gemini-2.0-flash`, `ibm/granite-3-8b-instruct` → `ibm/granite-4-h-small`.

### Phase 10: Dummy Data Removal
- No hardcoded dummy data found. All news content fetched from Google Sheets CSV and processed via RSS parser.
- `shared/dummy-ai.json` provides explicit offline fallback (labelled `provider: 'dummy'`) when both WatsonX and Gemini are unavailable — intentionally retained.

### Phase 11: Integration Status
- `firebase-applet-config.json` added to `.gitignore` (HIGH risk fix). Firebase key rotation recommended if repo was ever pushed to GitHub (project: `calcium-airlock-t83b3`).
- Shared env loader active: `shared/secrets.env` is the single source of truth for this project's AI keys.
- Remaining action: user must set new `GEMINI_API_KEY` in `shared/secrets.env` before AI news features work.
- Full findings: `risk.md`, `API_KEYS_CONFIG.md`.
