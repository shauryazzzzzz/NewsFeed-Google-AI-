# API_KEYS_CONFIG.md — NewsFeed Google AI
> For rotation instructions and cross-project key map see: `../CREDENTIALS_REFERENCE.md`

## How keys are loaded

```
Priority 1: Real process.env variables (shell / CI)
Priority 2: NewsFeed-Google-AI-/.env.local  (Gemini key, PORT)
Priority 3: ../shared/secrets.env  (workspace-wide: WATSONX_*, GEMINI_*)
```

**As of 28-Oct-2026:** `shared/load-env.js` is called at server startup — any key in `shared/secrets.env` that is not already set in `.env.local` will be applied automatically.

## Required keys

| Variable | Loaded from | Purpose | Status |
|----------|------------|---------|--------|
| `PORT` | `.env.local` | Server port | Default: `3002` |
| `WATSONX_API_KEY` | `shared/secrets.env` → `.env.local` | IBM WatsonX inference | Required for news generation; skips to Gemini otherwise |
| `WATSONX_PROJECT_ID` | `shared/secrets.env` → `.env.local` | watsonx project scope | Required for WatsonX |
| `WATSONX_REGION` | `shared/secrets.env` | Region | Default: `us-south` |
| `WATSONX_TEXT_MODEL` | `shared/secrets.env` | Model | Default: `ibm/granite-4-h-small` |
| `GEMINI_API_KEY` | `shared/secrets.env` → `.env.local` | Gemini fallback for news generation | ⚠️ Currently DEAD — regenerate |
| `GEMINI_MODEL` | `shared/secrets.env` | Gemini model | Default: `gemini-2.0-flash` |
| `DEFAULT_SPREADSHEET_ID` | `.env.local` | Google Sheets CSV export ID | Default: public sheet |

## Data sources (all live, no dummy data)

| Source | Type | Key needed? | What it provides |
|--------|------|-------------|-----------------|
| IBM WatsonX | AI API | ✅ WATSONX_API_KEY | News hierarchy generation |
| Google Gemini | AI API | ✅ GEMINI_API_KEY (⚠️ dead) | News fallback generation |
| RSS feeds | HTTP | ❌ None | Live news articles from various publishers |
| Google Sheets (published CSV) | HTTP | ❌ None | Published spreadsheet data |
| Firebase | SDK | ⚠️ Key in config file | App config (may be unused) |

## Data flow (live)

```
RSS feeds (rss-parser) → live news articles
        + Google Sheets CSV → structured data
        ↓
IBM WatsonX → news categorization / hierarchy
        ↓ (fallback)
Google Gemini → news generation
        ↓
React frontend (port 3000 dev, 3002 prod) → news tree display
```

## Firebase configuration

File: `firebase-applet-config.json` (now git-ignored as of 28-Oct-2026)
- Project: `calcium-airlock-t83b3`
- API Key: see `commons/secrets.env` → `FIREBASE_WEB_API_KEY` — **rotate this key** in Firebase Console if repo was ever pushed to GitHub
- Firebase may not be actively used — remove `firebase@^12.15.0` from `package.json` if unused

## No premium features

- RSS parsing is free (public RSS feeds)
- Google Sheets CSV export is free (published spreadsheet)
- IBM watsonx.ai and Gemini both have free tiers
- Firebase is on the free Spark plan
