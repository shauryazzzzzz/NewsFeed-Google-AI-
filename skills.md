# skills.md — NewsFeed Google AI

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| `react` | ^18.x | UI framework |
| `vite` | ^5.x | Dev server + build tool |
| `typescript` | ^5.x | Type safety |
| `firebase` | ^10.x | Firestore cache + auth |
| `axios` | ^1.x | HTTP client |

## Custom Utilities

| File | What it does |
|---|---|
| `fetch.mjs` | RSS feed fetcher — supplementary articles |
| `test_*.mjs` | Integration tests: 404, RSS, endpoint, server logic, fetch |
| `src/lib/firebase.ts` | Firebase initialisation + Firestore helpers |
| `src/lib/sheets.ts` | Google Sheets API connector |

## Known Limitations / Tech Debt

- [ ] No per-article AI summary cache persistence (lost on page reload)
- [ ] `data/news-cache.json` offline fallback not yet created
- [ ] Firebase security rules not documented in Architecture.md
- [ ] README only references Gemini — needs update for WatsonX-first chain

## Testing Checklist

- [ ] Run `test_rss.mjs` — RSS fetch must return ≥ 1 article
- [ ] Run `test_404.mjs` — must return proper 404, not crash
- [ ] Run `test_server_logic.mjs` — all endpoints respond correctly
- [ ] Category filter: select each category, correct articles shown
- [ ] AI fallback: set `WATSONX_API_KEY=` empty → summary shows "unavailable", not blank/crash
- [ ] Responsive: 375px, 768px, 1280px
- [ ] Dark/Light theme: all text readable
