# Chromium-inspired browsing history (Flow)

This document is the **source of truth** for how Flow stores and surfaces browsing history. It is derived from the Chromium History deep dive (URLs + visits, SQLite, per-profile scope, retention) but **kept simpler** than Chromium—no sync, separate Favicons DB, Top Sites, segments, clusters, or downloads-in-history.

## Goals

- Persist **real** history for omnibox and **`flow://history`**.
- Mirror Chromium’s **core data model**: one row per URL (`urls`) and one row per navigation (`visits`).
- Scope data **per profile**, like Chromium’s per-profile `History` file.
- Apply a simple **90-day retention** policy aligned with Chromium’s default horizon.

## Non-goals (out of scope)

- Parity with Chromium schema v70, transition bitmasks, `from_visit` graphs, or keyword search terms.
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

- **Triggers:**
  - Main-frame load completes (`did-finish-load`).
  - Main-frame **in-page** navigations (`did-navigate-in-page`), e.g. `pushState` / hash changes (SPAs).
- **Active tab only:** nothing is written while the tab is **not** the selected tab (or not in the selected tab group) for its window + space — including **session-restored** tabs until you activate them. When a tab **becomes** active, we record the current page once (still subject to consecutive-URL dedupe). `page-title-updated` history title patches apply only while the tab is active.
- **URL filter:** only `http:` and `https:` (skip internal `flow:`, `flow-internal:`, `about:`, error pages, etc.).
- **Privacy:** do **not** record for **ephemeral** (incognito) profiles. **Ephemeral tabs** (e.g. pinned-tab slot tabs) **are** recorded so pinned browsing appears in history; those tabs still skip **session tab persistence** as before.
- **Consecutive same URL (per tab “session”):** while a tab’s `WebContents` is alive, if the **last visit we stored** for that tab has the same **canonical URL key** as the new one, the new one is **ignored** (refresh, duplicate `did-finish-load` / `did-navigate-in-page`, omnibox to the same page, etc.). After you navigate elsewhere and come back, the URL can be recorded again. The key strips the hash; on YouTube, shorts and watch URLs normalize to the video id so tracking query params don’t create false differences. Reset when the tab gets a new `WebContents` (e.g. wake from sleep).
- **Title:** use `getTitle()` when non-empty; otherwise fall back to URL hostname. On `page-title-updated` (active tab only), the `history_urls` row for the current URL (same profile + exact URL string) is updated so the stored title tracks the latest document title without adding visits.

### Typed count (`typed_count`)

Incremented when the user navigates via the **omnibox / address bar** (submit or choosing a suggestion), including **open in new tab** from the omnibox. Implemented by setting a one-shot flag on the tab before `loadURL`:

- `navigation:go-to` optional `typedFromAddressBar`
- `tabs:new-tab` optional `typedFromAddressBar` (initial load only)

Other navigations (links, redirects, UI outside the omnibox) do not increment `typed_count`.

## Surfaces

### Omnibox

- **`flow.history.list()`** — aggregated URL rows for the window’s profile.
- Ranking uses `visit_count`, `typed_count`, `last_visit_time`, and match quality.

### History page (`flow://history`)

- Chronological **visit** list (join visits + URLs), Chromium-style **grouping by calendar day** (Today, Yesterday, …).
- **Search** filters title and URL (case-insensitive substring).
- **Row actions:** primary row is a normal `<a href>` (same-tab navigation); **context menu** (right-click) for open in current tab, new tab, copy link, delete one visit, delete all visits for that URL row.
- **Clear browsing data** clears all history for the current profile.
- Uses Flow UI patterns (cards, dark theme route, shadcn-style components) like **Extensions**.

### Discoverability

- Default **new tab** quick link **History** (`flow://history`).
- Omnibox **pedal** for queries like “history” / “browse history”.

## Retention

- On database init (after migrations), delete visits with `visit_time` older than **90 days**.
- Remove URL rows that no longer have any visits.
- Recompute `visit_count` and `last_visit_time` on remaining URLs from their visits so aggregates stay consistent.

## API surface (preload → main)

All handlers resolve `profile_id` from `event.sender` → browser window → active space (same idea as `profile:get-using`).

| API                                      | Purpose                             |
| ---------------------------------------- | ----------------------------------- |
| `flow.history.list()`                    | Aggregated URLs (omnibox)           |
| `flow.history.listVisits(search?)`       | Visit rows for the history page     |
| `flow.history.deleteVisit(id)`           | Remove one visit; reconcile URL row |
| `flow.history.deleteAllForUrl(urlRowId)` | Remove URL row and its visits       |
| `flow.history.clearAll()`                | Clear profile history               |

## Future extensions

- Transition types and “user-visible” filtering like `chrome://history`.
- Time-range deletion (not only “clear all”).
- Deduping edge cases where `did-finish-load` and `did-navigate-in-page` might both fire for the same logical navigation.
