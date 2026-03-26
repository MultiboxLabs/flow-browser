export interface SearchSuggestion {
  type: "search";
  query: string;
  url: string;
  relevance: number;
}

export interface WebsiteSuggestion {
  type: "website";
  title: string;
  url: string;
  description: string;
  relevance: number;
}

export interface OpenTabSuggestion {
  type: "open-tab";
  /** Tab to activate */
  tabId: number;
  spaceId: string;
  title: string;
  url: string;
  relevance: number;
}

export interface PedalSuggestion {
  type: "pedal";
  /** e.g. open_settings, open_new_window */
  action: string;
  title: string;
  relevance: number;
}

export type OmniboxSuggestion = SearchSuggestion | WebsiteSuggestion | OpenTabSuggestion | PedalSuggestion;
