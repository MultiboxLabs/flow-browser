import { duckduckgoSearchProvider } from "./duckduckgo";
import { googleSearchProvider } from "./google";
import { buildCustomSearchUrl } from "./custom-utils";
import { yandexSearchProvider } from "./yandex";
import type { SearchProvider } from "./types";

export const searchProviders = {
  duckduckgo: duckduckgoSearchProvider,
  google: googleSearchProvider,
  yandex: yandexSearchProvider
} satisfies Record<string, SearchProvider>;

export type SearchProviderId = keyof typeof searchProviders;
export type SearchEngineSettingId = SearchProviderId | "custom";
export type CustomSearchSuggestionsProviderId = "none" | SearchProviderId;

const DEFAULT_SEARCH_PROVIDER_ID: SearchProviderId = "google";
const DEFAULT_SEARCH_ENGINE_SETTING_ID: SearchEngineSettingId = DEFAULT_SEARCH_PROVIDER_ID;
const DEFAULT_CUSTOM_SEARCH_SUGGESTIONS_PROVIDER_ID: CustomSearchSuggestionsProviderId = "none";

let selectedSearchEngineSettingId: SearchEngineSettingId = DEFAULT_SEARCH_ENGINE_SETTING_ID;
let customSearchUrlTemplate = "";
let customSearchSuggestionsProviderId: CustomSearchSuggestionsProviderId =
  DEFAULT_CUSTOM_SEARCH_SUGGESTIONS_PROVIDER_ID;
let hasInitializedSearchProviderSetting = false;

export function isSearchProviderId(value: unknown): value is SearchProviderId {
  return typeof value === "string" && value in searchProviders;
}

export function isSearchEngineSettingId(value: unknown): value is SearchEngineSettingId {
  return value === "custom" || isSearchProviderId(value);
}

export function isCustomSearchSuggestionsProviderId(value: unknown): value is CustomSearchSuggestionsProviderId {
  return value === "none" || isSearchProviderId(value);
}

function createCustomSearchProvider(): SearchProvider {
  const suggestionsProvider =
    customSearchSuggestionsProviderId !== "none" ? searchProviders[customSearchSuggestionsProviderId] : null;

  return {
    id: "custom",
    label: "Custom Search Engine",
    buildSearchUrl(query: string): string {
      return buildCustomSearchUrl(customSearchUrlTemplate, query) ?? searchProviders.google.buildSearchUrl(query);
    },
    getSuggestions: suggestionsProvider?.getSuggestions?.bind(suggestionsProvider)
  };
}

async function refreshSelectedSearchProvider(): Promise<void> {
  if (typeof flow === "undefined") {
    return;
  }

  const settingValue = await flow.settings.getSetting("searchEngine").catch(() => undefined);
  if (isSearchEngineSettingId(settingValue)) {
    selectedSearchEngineSettingId = settingValue;
  } else {
    selectedSearchEngineSettingId = DEFAULT_SEARCH_ENGINE_SETTING_ID;
  }

  const customTemplateValue = await flow.settings.getSetting("customSearchUrlTemplate").catch(() => undefined);
  customSearchUrlTemplate = typeof customTemplateValue === "string" ? customTemplateValue : "";

  const suggestionsProviderValue = await flow.settings
    .getSetting("customSearchSuggestionsProvider")
    .catch(() => undefined);
  customSearchSuggestionsProviderId = isCustomSearchSuggestionsProviderId(suggestionsProviderValue)
    ? suggestionsProviderValue
    : DEFAULT_CUSTOM_SEARCH_SUGGESTIONS_PROVIDER_ID;
}

function initializeSearchProviderSetting() {
  if (hasInitializedSearchProviderSetting || typeof flow === "undefined") {
    return;
  }

  hasInitializedSearchProviderSetting = true;
  void refreshSelectedSearchProvider();
  flow.settings.onSettingsChanged(() => {
    void refreshSelectedSearchProvider();
  });
}

initializeSearchProviderSetting();

/**
 * Returns the current search provider based on the user's settings. If no specific provider is requested, it returns the one selected in the settings.
 * @param id Optional ID of the search provider to retrieve. If not provided, the function returns the currently selected search provider based on user settings.
 * @returns The search provider corresponding to the provided ID or the currently selected search provider if no ID is given.
 */
export function getSearchProvider(id?: SearchEngineSettingId): SearchProvider {
  if (id) {
    return id === "custom" ? createCustomSearchProvider() : searchProviders[id];
  }

  initializeSearchProviderSetting();
  return selectedSearchEngineSettingId === "custom"
    ? createCustomSearchProvider()
    : searchProviders[selectedSearchEngineSettingId];
}
