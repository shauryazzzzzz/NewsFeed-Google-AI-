# risk.md — NewsFeed-Google-AI-
> Security audit performed: 28-Oct-2026. Auditor: Bob (AI).
> Append-only. Add new entries below; never edit past findings.

---

## Audit Summary

**Overall verdict: ACTION REQUIRED — Firebase API key exposed in tracked JSON file**

This project is functionally sound (no exec/eval, no injection, proper env-var credential management for WatsonX/Gemini). However, one HIGH-severity issue requires immediate action: a real Firebase API key is stored in [`firebase-applet-config.json`](firebase-applet-config.json) which is NOT excluded by `.gitignore`.

---

## Risk Findings

### 🔴 HIGH — Firebase API key exposed in git-tracked file
**File:** [`firebase-applet-config.json`](firebase-applet-config.json)
**Finding:** This file contains:
```json
{
  "apiKey": "[REDACTED-SEE-COMMONS-SECRETS-ENV]",
  "projectId": "calcium-airlock-t83b3",
  ...
}
```
The `apiKey` is a real Firebase Web API key. The `.gitignore` excludes `.env*` files but **does NOT exclude `firebase-applet-config.json`**. If this repository is pushed to GitHub or any remote, the key is exposed publicly.
**Severity:** High — Firebase Web API keys are not secret in the traditional sense (they are embedded in browser code), BUT if the Firebase project has open Firestore/Storage rules, this key can be used to read/write data. The key here is labeled `AIzaSy...` which is the standard Firebase browser key format.
**Mitigation (REQUIRED):**
1. Add `firebase-applet-config.json` to `.gitignore` immediately.
2. If this repository has ever been pushed with this file, rotate the Firebase API key in the Firebase Console (Project Settings → Web API Key) and restrict it to authorized domains.
3. Review Firebase Security Rules for the project `calcium-airlock-t83b3` to ensure no open read/write access.
4. For local use only: keep the file but add to `.gitignore`. Move values to `.env.local` and load from there.
**Status:** OPEN — add to `.gitignore` now.

### 🟡 MEDIUM — Google Spreadsheet ID exposed in `/api/config` endpoint
**File:** [`server.ts:48`](server.ts)
**Finding:** The `/api/config` endpoint returns `DEFAULT_SPREADSHEET_ID` to the browser. The default value (`e/2PACX-1vSesH...`) is the public CSV export link ID for a Google Sheets document. This is a published, publicly-accessible spreadsheet ID.
**Severity:** Medium — since this is a published (public) Google Sheets CSV export, the ID itself is not a secret. However, exposing configuration via an API endpoint is a pattern to monitor.
**Status:** Acceptable — Google Sheets publish-to-web IDs are intended to be public.

### 🟡 MEDIUM — WatsonX API key used via `fetch()` with inline token exchange
**File:** [`server.ts:12`](server.ts)
**Finding:** WatsonX API key is fetched from `process.env.WATSONX_API_KEY` and used in an IAM token exchange with `iam.cloud.ibm.com`. This is correct. The key is properly gated: `if (!KEY || !PID) return { text: '', provider: 'none' }`.
**Severity:** Medium — key is correctly loaded from env, not hardcoded. Risk only if `.env.local` is leaked.
**Mitigation:** Ensure `.env.local` is in `.gitignore` (it is: `.env*` pattern covers it).
**Status:** Adequately mitigated.

### 🟢 LOW — RSS parser makes outbound HTTP calls to arbitrary feed URLs
**File:** [`server.ts:36`](server.ts)
**Finding:** `new Parser()` from `rss-parser` fetches arbitrary RSS feed URLs. If feed URLs are sourced from user input, a server-side request forgery (SSRF) risk exists.
**Severity:** Low — feed URLs appear to be hardcoded in the server logic (not user-supplied from the audit). `rss-parser` uses standard HTTPS only.
**Status:** Acceptable. Would need re-evaluation if RSS URLs become user-configurable.

### 🟢 LOW — Firebase SDK included as dependency
**File:** [`package.json`](package.json)
**Finding:** `firebase@^12.15.0` is listed as a production dependency. Firebase SDK makes connections to Firebase services. If no Firebase features are actively used in the app, this is dead code.
**Severity:** Low — unused SDK dependency. Does not make connections unless explicitly initialized.
**Status:** Acceptable. Consider removing if unused to reduce attack surface.

### ✅ CLEAR — No shell injection or exec/eval
**Finding:** Grep across `server.ts` and `src/` found zero `eval()`, `exec()`, `execSync()`, `spawnSync()`, or `child_process` usage.

### ✅ CLEAR — No hardcoded WatsonX or Gemini credentials in source
**Finding:** WatsonX API key and Gemini API key are loaded exclusively from `process.env.*`. The `.env.example` shows all values as empty placeholders.

---

## Immediate Action Required

```bash
# 1. Add firebase-applet-config.json to .gitignore
echo "firebase-applet-config.json" >> .gitignore

# 2. If ever pushed to remote, also rotate the Firebase key:
#    Firebase Console → Project Settings → General → Web API Key → Regenerate
```

---

## External Dependencies Assessment

| Package | Version | Purpose | Risk |
|---------|---------|---------|------|
| `@google/genai` | ^2.4.0 | Gemini AI | Low — official Google SDK |
| `firebase` | ^12.15.0 | Firebase (possibly unused) | Low |
| `rss-parser` | ^3.13.0 | RSS feeds | Low |
| `express` | ^4.21.2 | HTTP server | Low |
| `react` + Vite | — | Frontend | Low |

---

## Isolation Compliance
- ✅ Runs locally on port 3002
- ✅ No database, no file system writes
- ✅ All AI credentials in `.env.local` (git-ignored)
- ⛔ `firebase-applet-config.json` NOT in `.gitignore` — **MUST FIX**
