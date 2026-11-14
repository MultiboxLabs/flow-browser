import { buildCustomSearchUrl, CUSTOM_SEARCH_QUERY_TOKEN, validateCustomSearchUrlTemplate } from "./custom-search";

export interface SearchUrlBuildOptions {
  duckduckgoAiEnabled?: boolean;
}

function buildGoogleSearchUrl(query: string): string {
  const url = new URL("https://www.google.com/search");
  url.searchParams.set("q", query);
  return url.toString();
}

function buildDuckDuckGoSearchUrl(query: string, options?: SearchUrlBuildOptions): string {
  const url = new URL("https://duckduckgo.com");
  url.searchParams.set("q", query);
  const aiEnabled = options?.duckduckgoAiEnabled ?? true;
  if (!aiEnabled) {
    url.searchParams.set("ia", "web");
    url.searchParams.set("assist", "false");
  }
  return url.toString();
}

function buildYandexSearchUrl(query: string): string {
  const url = new URL("https://yandex.com/search/");
  url.searchParams.set("text", query);
  return url.toString();
}

const SEARCH_PROVIDER_METADATA = {
  google: {
    label: "Google",
    buildSearchUrl: buildGoogleSearchUrl
  },
  duckduckgo: {
    label: "DuckDuckGo",
    buildSearchUrl: buildDuckDuckGoSearchUrl
  },
  yandex: {
    label: "Yandex",
    buildSearchUrl: buildYandexSearchUrl
  }
} as const;

export type SearchProviderId = keyof typeof SEARCH_PROVIDER_METADATA;
export type SearchEngineSettingId = SearchProviderId | "custom";
export type CustomSearchSuggestionsProviderId = "none" | SearchProviderId;

export interface SearchSettingsSnapshot {
  searchEngine: SearchEngineSettingId;
  customSearchUrlTemplate: string;
  customSearchSuggestionsProvider: CustomSearchSuggestionsProviderId;
  duckduckgoAiEnabled: boolean;
}

export type SearchSettingsSnapshotKey = keyof SearchSettingsSnapshot;

export const DEFAULT_SEARCH_PROVIDER_ID: SearchProviderId = "google";

export const DEFAULT_SEARCH_SETTINGS_SNAPSHOT: SearchSettingsSnapshot = {
  searchEngine: DEFAULT_SEARCH_PROVIDER_ID,
  customSearchUrlTemplate: "",
  customSearchSuggestionsProvider: "none",
  duckduckgoAiEnabled: true
};

export const SEARCH_PROVIDER_OPTIONS: Array<{ id: SearchProviderId; name: string }> = [
  { id: "google", name: SEARCH_PROVIDER_METADATA.google.label },
  { id: "duckduckgo", name: SEARCH_PROVIDER_METADATA.duckduckgo.label },
  { id: "yandex", name: SEARCH_PROVIDER_METADATA.yandex.label }
];

export const SEARCH_ENGINE_SETTING_OPTIONS: Array<{ id: SearchEngineSettingId; name: string }> = [
  ...SEARCH_PROVIDER_OPTIONS,
  { id: "custom", name: "Custom Search Engine" }
];

export const CUSTOM_SEARCH_SUGGESTION_PROVIDER_OPTIONS: Array<{
  id: CustomSearchSuggestionsProviderId;
  name: string;
}> = [{ id: "none", name: "None" }, ...SEARCH_PROVIDER_OPTIONS];

const SEARCH_SETTINGS_KEYS: SearchSettingsSnapshotKey[] = [
  "searchEngine",
  "customSearchUrlTemplate",
  "customSearchSuggestionsProvider",
  "duckduckgoAiEnabled"
];

export function getDefaultSearchSettingsSnapshot(): SearchSettingsSnapshot {
  return {
    ...DEFAULT_SEARCH_SETTINGS_SNAPSHOT
  };
}

export function isSearchProviderId(value: unknown): value is SearchProviderId {
  return typeof value === "string" && value in SEARCH_PROVIDER_METADATA;
}

export function isSearchEngineSettingId(value: unknown): value is SearchEngineSettingId {
  return value === "custom" || isSearchProviderId(value);
}

export function isCustomSearchSuggestionsProviderId(value: unknown): value is CustomSearchSuggestionsProviderId {
  return value === "none" || isSearchProviderId(value);
}

export function isSearchSettingsSnapshotKey(value: string): value is SearchSettingsSnapshotKey {
  return SEARCH_SETTINGS_KEYS.includes(value as SearchSettingsSnapshotKey);
}

export function getSearchProviderLabel(id: SearchProviderId): string {
  return SEARCH_PROVIDER_METADATA[id].label;
}

export function buildSearchUrlFromProviderId(
  providerId: SearchProviderId,
  query: string,
  options?: SearchUrlBuildOptions
): string {
  return SEARCH_PROVIDER_METADATA[providerId].buildSearchUrl(query, options);
}

export function getCustomSearchEngineDisplayName(template: string): string {
  const validation = validateCustomSearchUrlTemplate(template);
  if (!validation.valid) {
    return "Custom Search Engine";
  }

  try {
    const previewUrl = template.trim().replaceAll(CUSTOM_SEARCH_QUERY_TOKEN, "flow");
    const parsed = new URL(previewUrl);
    const hostname = parsed.hostname.replace(/^www\./, "");
    return hostname || "Custom Search Engine";
  } catch {
    return "Custom Search Engine";
  }
}

export function getSearchEngineDisplayName(searchSettings: SearchSettingsSnapshot): string {
  if (searchSettings.searchEngine === "custom") {
    return getCustomSearchEngineDisplayName(searchSettings.customSearchUrlTemplate);
  }

  return getSearchProviderLabel(searchSettings.searchEngine);
}

export function normalizeSearchSettingsSnapshot(
  searchSettings: Partial<SearchSettingsSnapshot>
): SearchSettingsSnapshot {
  return {
    searchEngine: isSearchEngineSettingId(searchSettings.searchEngine)
      ? searchSettings.searchEngine
      : DEFAULT_SEARCH_SETTINGS_SNAPSHOT.searchEngine,
    customSearchUrlTemplate:
      typeof searchSettings.customSearchUrlTemplate === "string"
        ? searchSettings.customSearchUrlTemplate
        : DEFAULT_SEARCH_SETTINGS_SNAPSHOT.customSearchUrlTemplate,
    customSearchSuggestionsProvider: isCustomSearchSuggestionsProviderId(searchSettings.customSearchSuggestionsProvider)
      ? searchSettings.customSearchSuggestionsProvider
      : DEFAULT_SEARCH_SETTINGS_SNAPSHOT.customSearchSuggestionsProvider,
    duckduckgoAiEnabled:
      typeof searchSettings.duckduckgoAiEnabled === "boolean"
        ? searchSettings.duckduckgoAiEnabled
        : DEFAULT_SEARCH_SETTINGS_SNAPSHOT.duckduckgoAiEnabled
  };
}

/**
 * Validates the active search configuration. Built-in engines are always valid;
 * custom engines require a valid template before they can be used.
 */
export function validateActiveSearchSettings(searchSettings: SearchSettingsSnapshot) {
  if (searchSettings.searchEngine !== "custom") {
    return { valid: true } as const;
  }

  return validateCustomSearchUrlTemplate(searchSettings.customSearchUrlTemplate);
}

export function buildSearchUrlFromSearchSettings(searchSettings: SearchSettingsSnapshot, query: string): string {
  if (searchSettings.searchEngine === "custom") {
    return (
      buildCustomSearchUrl(searchSettings.customSearchUrlTemplate, query) ??
      buildSearchUrlFromProviderId(DEFAULT_SEARCH_PROVIDER_ID, query)
    );
  }

  return buildSearchUrlFromProviderId(searchSettings.searchEngine, query, {
    duckduckgoAiEnabled: searchSettings.duckduckgoAiEnabled
  });
}
