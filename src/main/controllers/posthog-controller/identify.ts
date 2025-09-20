import { SettingsDataStore } from "@/saving/settings";

const POSTHOG_IDENTIFIER_STORE_KEY = "posthog-anon-id";

let posthogIdentifierPromise: Promise<string> | undefined;

/**
 * Get the PostHog identifier.
 * This should only be used internally by the Posthog controller.
 * @returns The PostHog identifier.
 */
export async function _getPosthogIdentifier(): Promise<string> {
  if (!posthogIdentifierPromise) {
    posthogIdentifierPromise = cachePosthogIdentifier();
  }
  return await posthogIdentifierPromise;
}

async function cachePosthogIdentifier(): Promise<string> {
  const existingAnonId = await SettingsDataStore.get<string>(POSTHOG_IDENTIFIER_STORE_KEY);
  if (!existingAnonId) {
    const newAnonUserId = crypto.randomUUID();
    await SettingsDataStore.set(POSTHOG_IDENTIFIER_STORE_KEY, newAnonUserId);
    return newAnonUserId;
  }
  return existingAnonId;
}
