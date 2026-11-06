# NewsFeed Google AI — News Intelligence Dashboard

## What it does
Full-stack news intelligence dashboard powered by Google Gemini AI and IBM watsonx. Fetches live RSS news, organises into a hierarchical tree, and generates AI summaries.

## What was fixed
- Default port changed from `:3000` → `:3002` (avoids conflicts)
- `start.bat` updated to use `node node_modules/tsx/dist/cli.mjs server.ts` (bypasses broken `.bin` shim)
- `.env.local` created with all required keys

## How to run
```bat
start.bat
```
Or manually:
```bash
node node_modules/tsx/dist/cli.mjs server.ts
```

## Port
- Backend + Frontend (Vite dev): **http://localhost:3002**

## .env variables needed
```
PORT=3002
WATSONX_API_KEY=...
WATSONX_PROJECT_ID=...
GEMINI_API_KEY=...
DEFAULT_SPREADSHEET_ID=...
```

## Test
```bash
node test.mjs
```
