/**
 * Pinned tab data that is persisted to disk.
 * Pinned tabs are persistent shortcuts tied to a profile.
 * They store a default URL and are associated with live browser tabs at runtime.
 */
export type PersistedPinnedTabData = {
  uniqueId: string;
  profileId: string;
  defaultUrl: string;
  faviconUrl: string | null;
  position: number;
};

/**
 * Pinned tab data sent to the renderer process.
 * Extends persisted data with runtime association info.
 */
export type PinnedTabData = PersistedPinnedTabData & {
  /** Runtime-only: the ID of the live browser tab associated with this pinned tab, or null */
  associatedTabId: number | null;
};
