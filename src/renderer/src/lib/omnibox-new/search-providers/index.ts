import { duckduckgoSearchProvider } from "./duckduckgo";
import { googleSearchProvider } from "./google";
import { buildCustomSearchUrl } from "./custom-utils";
import { yandexSearchProvider } from "./yandex";
import type { SearchProvider } from "./types";
import {
  type CustomSearchSuggestionsProviderId,
  type SearchEngineSettingId,
  type SearchProviderId,
  type SearchSettingsSnapshot,
  buildSearchUrlFromProviderId,
  getDefaultSearchSettingsSnapshot,
  isCustomSearchSuggestionsProviderId,
  isSearchEngineSettingId,
  isSearchProviderId
} from "~/search/search-settings";

export const searchProviders: Record<SearchProviderId, SearchProvider> = {
  duckduckgo: duckduckgoSearchProvider,
  google: googleSearchProvider,
  yandex: yandexSearchProvider
};

export type { CustomSearchSuggestionsProviderId, SearchEngineSettingId, SearchProviderId };
export { isCustomSearchSuggestionsProviderId, isSearchEngineSettingId, isSearchProviderId };

let currentSearchSettings: SearchSettingsSnapshot = getDefaultSearchSettingsSnapshot();
let hasInitializedSearchProviderSetting = false;

function readSearchSettingsSnapshot(): SearchSettingsSnapshot {
  if (typeof flow === "undefined") {
    return getDefaultSearchSettingsSnapshot();
  }

  return flow.settings.getSearchSettingsSnapshotSync();
}

function createCustomSearchProvider(searchSettings: SearchSettingsSnapshot): SearchProvider {
  const suggestionsProvider =
    searchSettings.customSearchSuggestionsProvider !== "none"
      ? searchProviders[searchSettings.customSearchSuggestionsProvider]
      : null;

  return {
    id: "custom",
    label: "Custom Search Engine",
    buildSearchUrl(query: string): string {
      return (
        buildCustomSearchUrl(searchSettings.customSearchUrlTemplate, query) ??
        buildSearchUrlFromProviderId("google", query)
      );
    },
    getSuggestions: suggestionsProvider?.getSuggestions?.bind(suggestionsProvider)
  };
}

function refreshSelectedSearchProvider() {
  currentSearchSettings = readSearchSettingsSnapshot();
}

function initializeSearchProviderSetting() {
  if (hasInitializedSearchProviderSetting || typeof flow === "undefined") {
    return;
  }

  hasInitializedSearchProviderSetting = true;
  refreshSelectedSearchProvider();
  flow.settings.onSettingsChanged(() => {
    refreshSelectedSearchProvider();
  });
}

initializeSearchProviderSetting();

/**
 * Returns the current search provider based on the user's settings. If no specific provider is requested, it returns the one selected in the settings.
 * @param id Optional ID of the search provider to retrieve. If not provided, the function returns the currently selected search provider based on user settings.
 * @returns The search provider corresponding to the provided ID or the currently selected search provider if no ID is given.
 */
export function getSearchProvider(id?: SearchEngineSettingId): SearchProvider {
  initializeSearchProviderSetting();

  if (id) {
    return id === "custom" ? createCustomSearchProvider(currentSearchSettings) : searchProviders[id];
  }

  return currentSearchSettings.searchEngine === "custom"
    ? createCustomSearchProvider(currentSearchSettings)
    : searchProviders[currentSearchSettings.searchEngine];
}
