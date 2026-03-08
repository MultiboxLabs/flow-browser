import { useCallback, useState } from "react";

/** localStorage key prefix for persisting the dismiss state per profile. */
const STORAGE_KEY_PREFIX = "PIN_GRID_EMPTY_DISMISSED";

function getStorageKey(profileId: string) {
  return `${STORAGE_KEY_PREFIX}:${profileId}`;
}

/**
 * Manages the dismissed/hidden state of the pin grid empty state placeholder.
 * Persisted per profile in localStorage so the preference survives reloads
 * and sidebar mode switches.
 */
export function useEmptyStateDismiss(profileId: string) {
  const storageKey = getStorageKey(profileId);

  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  });

  const dismiss = useCallback(() => {
    setIsDismissed(true);
    try {
      localStorage.setItem(storageKey, "true");
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  return { isDismissed, dismiss } as const;
}
