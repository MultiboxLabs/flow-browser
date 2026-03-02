// Shared MIME type constants for cross-window tab drag-and-drop.
// The payload is serialized as JSON under TAB_GROUP_MIME_TYPE.
// An additional empty-value entry keyed by TAB_GROUP_PROFILE_MIME_PREFIX + profileId
// is registered so that external drop targets can check profile compatibility
// during the drag phase (MIME type *names* are visible; values are not).

export const TAB_GROUP_MIME_TYPE = "application/x-flow-tab-group";
export const TAB_GROUP_PROFILE_MIME_PREFIX = "application/x-flow-tab-group-profile-";
