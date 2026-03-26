# Omnibox Implementation

## Suggestors

- Verbatim - Provide exact search suggestion, and website suggestion if the input is a valid URL (bangs are supported)
- Pedal - Provide pedal suggestions based on the input
- Search Suggestions - Provide search & link suggestions based on the input, powered by the search provider

## Relevance Scores

- Pedal Suggestions (similarity >= 0.85) - 600 to 700
- Verbatim Suggestion (Exact URL) - 500
- Verbatim Suggestion (Exact Search) - 499
- Pedal Suggestions (similarity >= 0.4) - 300 to 400
- Search Suggestions - 100 to 400
