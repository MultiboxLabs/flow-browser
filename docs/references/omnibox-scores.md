## Omnibox Scores

This document outlines the approximate relevance score ranges used by different omnibox providers. Higher scores appear higher in the suggestion list.

- **~1100 - 1500:** Open Tab (Switch) - _Encourages switching to existing tabs. Score scales with title/URL similarity._
- **1400 - 1450+:** History URL (Exact Match) - _Very high score for exact URL matches in history._
- **1300:** Verbatim Search / Typed URL - _Fixed score for the direct "Search for..." or typed URL entry._
- **1100 - 1200:** Pedal - _Browser actions triggered by keywords (e.g., "settings"). Score scales with trigger similarity._
- **~900 - 1450:** History URL (Similarity/Prefix Match) - _Score based on URL/title similarity, visit/typed counts, and prefix matching._
- **~600 - 1000:** Search Suggestion - _Fetched suggestions, ranked by provider order and similarity to input._
- **350 - 800:** Zero Suggest (Recent Tabs) - _Suggestions shown before typing, ranked by tab recency._
- **500 - 700:** Zero Suggest (Most Visited History) - _Suggestions shown before typing, ranked by visit count._

_Note: Ranges starting with '~' indicate approximate values as the final score can depend dynamically on factors like string similarity or history counts._
