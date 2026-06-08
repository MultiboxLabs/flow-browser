import { duckduckgoSearchProvider } from "./duckduckgo";
import { googleSearchProvider } from "./google";
import type { SearchProvider } from "./types";

export const searchProviders = {
  duckduckgo: duckduckgoSearchProvider,
  google: googleSearchProvider
} satisfies Record<string, SearchProvider>;

export type SearchProviderId = keyof typeof searchProviders;

const DEFAULT_SEARCH_PROVIDER_ID: SearchProviderId = "google";

let selectedSearchProviderId: SearchProviderId = DEFAULT_SEARCH_PROVIDER_ID;
let hasInitializedSearchProviderSetting = false;

function isSearchProviderId(value: unknown): value is SearchProviderId {
  return typeof value === "string" && value in searchProviders;
}

async function refreshSelectedSearchProvider(): Promise<void> {
  if (typeof flow === "undefined") {
    return;
  }

  const settingValue = await flow.settings.getSetting("searchEngine").catch(() => undefined);
  if (isSearchProviderId(settingValue)) {
    selectedSearchProviderId = settingValue;
    return;
  }

  // Backward-compatibility with a previous duplicate setting id.
  const legacySettingValue = await flow.settings.getSetting("selectedSearchEngine").catch(() => undefined);
  selectedSearchProviderId = isSearchProviderId(legacySettingValue) ? legacySettingValue : DEFAULT_SEARCH_PROVIDER_ID;
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
export function getSearchProvider(id?: SearchProviderId): SearchProvider {
  if (id) {
    return searchProviders[id];
  }

  initializeSearchProviderSetting();
  return searchProviders[selectedSearchProviderId];
}
