# Chromium-inspired browsing history (Flow)

This document is the **source of truth** for how Flow stores and surfaces browsing history. It is derived from the Chromium History deep dive (URLs + visits, SQLite, per-profile scope, retention) but **intentionally minimal**—no sync, favicon DB, Top Sites, segments, clusters, or downloads-in-history.

## Goals

- Persist **real** history for omnibox and future history UI.
- Mirror Chromium’s **core data model**: one row per URL (`urls`) and one row per navigation (`visits`).
- Scope data **per profile**, like Chromium’s per-profile `History` file.
- Apply a simple **90-day retention** policy aligned with Chromium’s default horizon.

## Non-goals (out of scope)

- Parity with Chromium schema v70, transition bitmasks, `from_visit` graphs, keyword search terms, or omnibox typed-score flags.
- Separate `Favicons` / `Top Sites` databases.
- Encrypted DB or secure wipe beyond normal SQLite deletes.

## Storage

- **Engine:** SQLite via `better-sqlite3` / Drizzle, same `flow.db` as other Flow state.
- **Tables:**
  - `history_urls` — canonical URL row per `(profile_id, url)`:
    - `id`, `profile_id`, `url`, `title`, `visit_count`, `typed_count`, `last_visit_time`
  - `history_visits` — one row per recorded navigation:
    - `id`, `url_id` → `history_urls.id`, `visit_time` (ms since epoch)

**Indices:** unique `(profile_id, url)` on URLs; `url_id` and `visit_time` on visits for queries and pruning.

## When we record a visit

- **Trigger:** main-frame load completes (`did-finish-load` on the tab’s `WebContents`).
- **URL filter:** only `http:` and `https:` (skip internal `flow:`, `flow-internal:`, `about:`, error pages, etc.).
- **Privacy:** do **not** record for **ephemeral** (incognito) profiles.
- **Title:** use `getTitle()` when non-empty; otherwise fall back to URL hostname.

`typed_count` is stored for Chromium-like shape; Flow may increment it later when navigation is known to be omnibox-typed. Initially it may stay at zero.

## What we show (omnibox)

- Read **aggregated URL rows** for the **window’s current profile** (derived from the active space, same pattern as `profile:get-using`).
- Sort / score in existing omnibox providers using `visit_count`, `typed_count`, `last_visit_time`, and URL/title match—no change to ranking philosophy beyond feeding real data.

## Retention

- On database init (after migrations), delete visits with `visit_time` older than **90 days**.
- Remove URL rows that no longer have any visits.
- Recompute `visit_count` and `last_visit_time` on remaining URLs from their visits so aggregates stay consistent.

## API surface

- **Preload:** `flow.history.list()` → returns `BrowsingHistoryEntry[]` for the invoking window’s profile.
- **Main:** IPC handler resolves `profile_id` from `event.sender` → browser window → current space (see `profile:get-using`).

## Future extensions (not implemented now)

- In-page / SPA navigations (`did-navigate-in-page`).
- Transition types and user-visible filtering like `chrome://history`.
- Clear-browsing-data hooks to delete ranges or full history.
