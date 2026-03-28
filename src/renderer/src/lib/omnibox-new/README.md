# Omnibox Implementation

## Module Layout

- `suggestor.ts` - Raw suggestion production for the current query
- `index.ts` - Public facade for request orchestration and suggestion list utilities
- `states.ts` - Tiny shared omnibox state store for the active profile id and URL-title cache
- `suggestors/zero-suggest.ts` - Empty-input suggestion composition over warmed open-tab and history caches
- `suggestors/quick-history.ts` - Synchronous, profile-scoped history cache and ranking
- `suggestors/open-tabs.ts` - Synchronous, current-space open-tab ranking over a cache primed when the omnibox opens

## Suggestors

- Verbatim (Synchronous) - Provide exact search suggestion, and website suggestion if the input is a valid URL (bangs are supported)
- Quick History (Synchronous) - Suggest a small set of high-value history URLs from a warm in-memory cache using match quality plus frecency
- Open Tabs (Synchronous) - Suggest a small set of matching open tabs from the active space using a cache primed when the omnibox opens
- Pedal (Synchronous) - Provide pedal suggestions based on the input
- Search Suggestions (Asynchronous) - Provide search & link suggestions based on the input, powered by the search provider

## Synchronous vs Asynchronous

What's the difference between synchronous and asynchronous suggestions?

- Synchronous suggestions are provided immediately, while asynchronous suggestions could take some time to be provided.
- Synchronous suggestions must have a higher priority than asynchronous suggestions, as we do not want the top suggestion to be replaced after it is provided.
- Empty input is handled entirely synchronously by Zero Suggest; it does not request remote search suggestions or produce verbatim/pedal rows.
- The current pipeline flushes all synchronous suggestors together in one batch: `verbatim + quick history + open tabs + pedal`, then merges async search suggestions afterward.

## Zero Suggest

This feature provides a list of suggestions when the input is empty.

It suggests:

- Open Tabs
- History Records

## Quick History

- History data comes from `flow.history.list()` and is cached in the renderer per profile id.
- `OmniboxMain` keeps the cache warm when the active profile changes and when the omnibox open sequence changes.
- `suggestor.ts` reads the active profile indirectly through `states.ts`, which is set immediately before each request.
- Quick History only runs for non-empty input and returns at most 3 results.
- Matching is intentionally stricter for URL-like input such as domains or paths. In those cases, history rows must have a strong URL/hostname prefix match to compete.
- URL normalization uses `getUniqueKeyFromUrl`, the same helper used by omnibox dedupe logic, so history matching and suggestion identity stay aligned.
- Ranking combines:
  - Match tier
  - Typed count bonus
  - Visit count bonus
  - Recency bonus
  - Hostname/title prefix bonuses

## Current Limitations

- Quick History is only as fresh as the last cache prime; there is no push-based history invalidation yet.
- If the cache is still cold when the user types, Quick History may be absent until a later request.
- The ranking constants are hand-tuned and not backed by fixture tests yet.

## Open Tabs

- Open-tab data is cached per active space and refreshed when the omnibox opens.
- `OmniboxMain` primes the cache with `primeOpenTabsCache(..., { force: true })` whenever the omnibox open sequence changes.
- The debug route also primes the cache explicitly so synchronous open-tab suggestions are available there.
- `suggestor.ts` reads the active space through `states.ts`, which is set immediately before each request.
- Open Tabs only runs for non-empty input with at least 3 characters and returns at most 3 results.
- Matching is restricted to tabs in the active space, excludes the focused tab, and excludes ephemeral tabs.
- URL-like input requires a strong hostname/path prefix match.
- Ranking uses a fixed open-tab band from `300` to `500`.
- Relevance is derived only from the best string similarity between the input and:
  - The tab title
  - The normalized hostname
- The similarity score is then mapped directly into the `300` to `500` band.

## Relevance Scores

- Zero Suggest Open Tabs - 780 to 840
- Zero Suggest History - up to 760
- Quick History - up to 690, intended to beat weak verbatim/search results when the history match is strong
- Pedal Suggestions (similarity >= 0.85) - 600 to 700
- Verbatim Suggestion (Exact URL) - 502
- Verbatim Suggestion (Exact Search) - 501
- Open Tabs - sync, relevance band 300 to 500
- Pedal Suggestions (similarity >= 0.4) - 300 to 400
- Search Suggestions - 100 to 400
