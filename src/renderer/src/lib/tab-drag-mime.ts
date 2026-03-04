// Shared MIME type constants for cross-window tab drag-and-drop.
// The payload is serialized as JSON under TAB_GROUP_MIME_TYPE.
// An additional empty-value entry keyed by TAB_GROUP_PROFILE_MIME_PREFIX + profileId
// is registered so that external drop targets can check profile compatibility
// during the drag phase (MIME type *names* are visible; values are not).

export const TAB_GROUP_MIME_TYPE = "application/x-flow-tab-group";
export const TAB_GROUP_PROFILE_MIME_PREFIX = "application/x-flow-tab-group-profile-";

// --- Shared type --- //

export type TabGroupSourceData = {
  type: "tab-group";
  tabGroupId: string;
  primaryTabId: number;
  profileId: string;
  spaceId: string;
  position: number;
  dragToken?: string;
};

// --- Shared helpers --- //

/**
 * Returns true if the external drag source carries a tab-group payload
 * that is compatible with the given profile.
 *
 * Safe to call inside `canDrop` — only inspects MIME type *names*, not values,
 * which is the only information the browser exposes during hover.
 */
export function canDropExternalTabGroup(types: string[], profileId: string): boolean {
  return types.includes(TAB_GROUP_MIME_TYPE) && types.includes(TAB_GROUP_PROFILE_MIME_PREFIX + profileId);
}

/**
 * Returns true if an element drag source is a tab-group compatible with the given target.
 *
 * @param data              - `args.source.data` from a `dropTargetForElements` callback
 * @param profileId         - required: profile ID the drop target belongs to
 * @param excludeTabGroupId - optional: reject drops from this specific tab group (prevents self-reorder)
 * @param excludeSpaceId    - optional: reject drops from this specific space (prevents no-op moves)
 */
export function canDropElementTabGroup(
  data: unknown,
  options: {
    profileId: string;
    excludeTabGroupId?: string;
    excludeSpaceId?: string;
  }
): boolean {
  const sourceData = data as TabGroupSourceData;
  if (sourceData.type !== "tab-group") return false;
  if (options.excludeTabGroupId !== undefined && sourceData.tabGroupId === options.excludeTabGroupId) return false;
  if (sourceData.profileId !== options.profileId) return false;
  if (options.excludeSpaceId !== undefined && sourceData.spaceId === options.excludeSpaceId) return false;
  return true;
}

/**
 * Parses and validates an external tab-group drop payload.
 * Returns the `TabGroupSourceData` if the payload is well-formed and contains a drag token;
 * returns `null` if the MIME type is missing, the JSON is malformed, or the token is absent.
 */
export function parseExternalTabGroupDrop(source: {
  getStringData(type: string): string | null;
}): TabGroupSourceData | null {
  const raw = source.getStringData(TAB_GROUP_MIME_TYPE);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as TabGroupSourceData;
    if (!data.dragToken) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Builds the external DataTransfer payload for a tab-group drag.
 * Encodes the full source data under the standard MIME type, and adds
 * an empty sentinel entry keyed by the profile-specific MIME name so
 * drop targets can check profile compatibility during `canDrop`.
 */
export function makeTabGroupExternalPayload(data: TabGroupSourceData): Record<string, string> {
  return {
    [TAB_GROUP_MIME_TYPE]: JSON.stringify(data),
    [TAB_GROUP_PROFILE_MIME_PREFIX + data.profileId]: ""
  };
}
