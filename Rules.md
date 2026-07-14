# Rules.md — NewsFeed Google AI
> **Project:** `NewsFeed-Google-AI-/` inside `AI side project`
> **Global infrastructure rules:** See [`../.bob/GLOBAL_RULES.md`](../.bob/GLOBAL_RULES.md) — read that file first.
> This file contains ONLY rules specific to this project.

---

## AGENT STARTUP (This Project)

1. Read `../GLOBAL_RULES.md`.
2. Read this file.
3. Read `Memory.md` — understand what has already been built.
4. Read `Architecture.md` — understand the data flow before touching any service.

---

## 1. Project Purpose

AI-curated news feed that aggregates articles from Google Sheets (as master data source), enriches them with WatsonX/Gemini AI summaries and category tags, and displays them in a React/Vite UI backed by Firebase.

---

## 2. Data Source Rules

- **Master data source:** Google Sheets — ID stored in `DEFAULT_SPREADSHEET_ID` in `.env`.
- Sheets are fetched via the Google Sheets API (not scraping).
- If Sheets API fails, fall back to cached `data/news-cache.json` — never show blank feed.
- RSS/external fetches (`fetch.mjs`) are supplementary — failures must not break the main feed.

---

## 3. AI Usage Rules

- Use `../shared/watsonx.js` for all AI calls — do not duplicate the fallback chain.
- AI is used for: article summarization, category classification, headline scoring.
- Summary prompts: max 200 tokens input, `max_new_tokens=150`, `temperature=0.3`.
- Classification prompts: max 100 tokens, `max_new_tokens=20`, `temperature=0`.
- Cache AI-generated summaries per article ID — never re-summarize the same article in the same session.

---

## 4. Firebase Rules

- Firebase config in `firebase-applet-config.json` — never hard-code project ID or API key in source.
- Firestore used for: article cache, user preferences, read-state.
- All Firestore writes must have error handling — failed writes log to console, never crash UI.
- Security rules: authenticated read, no public write.

---

## 5. UI Rules

- Responsive: min 375px. Dark + Light theme via CSS variables.
- Article cards must render in a loading skeleton state while data fetches.
- Category filter must have an "All" option that resets to full feed.
- Empty state (no articles): show friendly message + retry button, never blank page.
- AI summary: show "Summarizing..." skeleton while pending, "Summary unavailable" on failure.

---

## 6. Test Files

- `test_*.mjs` files in root are integration tests — run before any deployment.
- `test_404.mjs` — verifies 404 handling. `test_rss.mjs` — verifies RSS fetch. Must all pass.
- Never delete test files without replacing with equivalent coverage.

---

## 7. What NOT to Change Without Asking

- Do not change `DEFAULT_SPREADSHEET_ID` — it points to the live master news source.
- Do not change Firebase project config without updating `Architecture.md`.

---

*Last updated: 2025-07-12 | Project: NewsFeed Google AI | Owner: Saurabh Solanki (IBM)*
