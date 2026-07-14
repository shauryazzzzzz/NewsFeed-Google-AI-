# Architecture.md — NewsFeed Google AI

## Overview
React/Vite news feed app that pulls articles from Google Sheets, enriches them with WatsonX/Gemini AI summaries and category tags, stores state in Firebase Firestore, and renders a responsive filterable feed.

## Data Flow

```
┌───────────────────────────────────────────────────────────┐
│                   React UI (Vite)                          │
│   Category filter → Article cards → AI summary panel      │
└────────────────┬──────────────────────────────────────────┘
                 │
┌────────────────▼──────────────────────────────────────────┐
│              server.ts (Express backend)                   │
│  GET /api/feed     → fetch Sheets + RSS + AI enrich       │
│  GET /api/article  → single article with AI summary       │
└───────┬────────────────────────────────────────┬──────────┘
        │                                        │
┌───────▼──────────┐                   ┌─────────▼─────────┐
│  Google Sheets   │                   │  Firebase Firestore│
│  (master source) │                   │  (article cache,  │
│  DEFAULT_SPREAD- │                   │   user prefs,     │
│  SHEET_ID        │                   │   read state)     │
└───────┬──────────┘                   └───────────────────┘
        │ articles[]
┌───────▼──────────────────────────────────────────────────┐
│            AI Enrichment (shared/watsonx.js)              │
│   summarizeAI()   → article summary (max 150 tokens)     │
│   classifyAI()    → category tag (max 20 tokens)         │
│   Per-article cache — never re-summarize same article ID │
└──────────────────────────────────────────────────────────┘
```

## Components

| File/Dir | Role |
|---|---|
| `src/` | React frontend |
| `server.ts` | Express backend — Sheets fetch, AI proxy, Firebase write |
| `fetch.mjs` | RSS/supplementary feed fetcher (runs separately) |
| `test_*.mjs` | Integration tests (404, RSS, endpoint, server logic) |
| `firebase-applet-config.json` | Firebase project config |
| `data/news-cache.json` | Offline fallback cache |

## External Services

| Service | Purpose |
|---|---|
| Google Sheets API | Master article data source |
| Firebase Firestore | Article cache, user preferences |
| IBM WatsonX AI | Article summarization, category classification |
| Google Gemini | AI fallback |
| RSS feeds | Supplementary article source |

## Key Design Decisions

1. Google Sheets is the single source of truth — all articles flow from there.
2. AI summaries cached per article ID in memory — no re-summarization in same session.
3. Firebase used for persistence across sessions — Sheets fetch is expensive, Firestore cache is fast.
4. Fallback to `data/news-cache.json` if both Sheets and Firebase are unavailable — feed never blank.
