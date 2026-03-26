# Omnibox Implementation

## Module Layout

- `suggestor.ts` - Raw suggestion production for the current query
- `index.ts` - Public facade for request orchestration and suggestion list utilities

## Suggestors

- Verbatim (Synchronous) - Provide exact search suggestion, and website suggestion if the input is a valid URL (bangs are supported)
- Pedal (Synchronous) - Provide pedal suggestions based on the input
- Search Suggestions (Asynchronous) - Provide search & link suggestions based on the input, powered by the search provider

## Synchronous vs Asynchronous

What's the difference between synchronous and asynchronous suggestions?

- Synchronous suggestions are provided immediately, while asynchronous suggestions could take some time to be provided.
- Synchronous suggestions must have a higher priority than asynchronous suggestions, as we do not want the top suggestion to be replaced after it is provided.

## Relevance Scores

- Pedal Suggestions (similarity >= 0.85) - 600 to 700
- Verbatim Suggestion (Exact URL) - 500
- Verbatim Suggestion (Exact Search) - 499
- Pedal Suggestions (similarity >= 0.4) - 300 to 400
- Search Suggestions - 100 to 400
