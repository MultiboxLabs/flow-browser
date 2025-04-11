import { TabbedBrowserWindow } from "@/browser/window";

/**
 * Events emitted by the Browser
 */
export type BrowserEvents = {
  "window-created": [window: TabbedBrowserWindow];
  "window-destroyed": [window: TabbedBrowserWindow];
  "profile-loaded": [profileId: string];
  "profile-unloaded": [profileId: string];
  destroy: [];
};
