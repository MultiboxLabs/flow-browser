import { getUniqueKeyFromUrl } from "@/lib/omnibox-new/helpers";

// Stores the current profile id for the omnibox.
let currentProfileId: string | undefined = undefined;
export function setOmniboxCurrentProfileId(profileId: string | undefined) {
  currentProfileId = profileId;
}
export function getOmniboxCurrentProfileId(): string | undefined {
  return currentProfileId;
}

// Stores the current space id for the omnibox.
let currentSpaceId: string | undefined = undefined;
export function setOmniboxCurrentSpaceId(spaceId: string | undefined) {
  currentSpaceId = spaceId;
}
export function getOmniboxCurrentSpaceId(): string | undefined {
  return currentSpaceId;
}

// URL Title Cache
const urlTitleCache = new Map<string, string>();
export function cacheUrlTitle(url: string, title: string) {
  const key = getUniqueKeyFromUrl(url);
  urlTitleCache.set(key, title);
}
export function getCachedUrlTitle(url: string): string | undefined {
  const key = getUniqueKeyFromUrl(url);
  return urlTitleCache.get(key);
}
