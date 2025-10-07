/**
 * Events emitted by the Browser
 */
export type BrowserEvents = {
  "profile-loaded": [profileId: string];
  "profile-unloaded": [profileId: string];
  destroy: [];
};
