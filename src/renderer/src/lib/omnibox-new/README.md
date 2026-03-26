# Omnibox Implementation

## Suggestors

- Verbatim Suggestor - Provide exact search suggestion, and website suggestion if the input is a valid URL
- Pedal Suggestor - Provide pedal suggestions based on the input
- Search Suggestions Suggestor - Provide search & link suggestions based on the input, powered by the search provider

## Relevance Scores

- Pedal Suggestion (similarity >= 0.85) - 600 to 700
- Verbatim Suggestion (Exact Search) - 500
- Verbatim Suggestion (Exact URL) - 499
- Pedal Suggestion (similarity >= 0.4) - 300 to 400
