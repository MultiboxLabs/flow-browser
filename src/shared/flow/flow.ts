import { FlowAppAPI } from "~/flow/interfaces/app/app";
import { FlowWindowsAPI } from "~/flow/interfaces/app/windows";
import { FlowExtensionsAPI } from "~/flow/interfaces/app/extensions";

import { FlowBrowserAPI } from "~/flow/interfaces/browser/browser";
import { FlowTabsAPI } from "~/flow/interfaces/browser/tabs";
import { FlowPageAPI } from "~/flow/interfaces/browser/page";
import { FlowNavigationAPI } from "~/flow/interfaces/browser/navigation";
import { FlowInterfaceAPI } from "~/flow/interfaces/browser/interface";
import { FlowOmniboxAPI } from "~/flow/interfaces/browser/omnibox";
import { FlowNewTabAPI } from "~/flow/interfaces/browser/newTab";
import { FlowFindInPageAPI } from "~/flow/interfaces/browser/find-in-page";
import { FlowHistoryAPI } from "~/flow/interfaces/browser/history";
import { FlowOmniboxShortcutsAPI } from "~/flow/interfaces/browser/omnibox-shortcuts";

import { FlowProfilesAPI } from "~/flow/interfaces/sessions/profiles";
import { FlowSpacesAPI } from "~/flow/interfaces/sessions/spaces";

import { FlowSettingsAPI } from "~/flow/interfaces/settings/settings";
import { FlowIconsAPI } from "~/flow/interfaces/settings/icons";
import { FlowOpenExternalAPI } from "~/flow/interfaces/settings/openExternal";
import { FlowOnboardingAPI } from "~/flow/interfaces/settings/onboarding";
import { FlowUpdatesAPI } from "~/flow/interfaces/app/updates";
import { FlowActionsAPI } from "~/flow/interfaces/app/actions";
import { FlowShortcutsAPI } from "~/flow/interfaces/app/shortcuts";

declare global {
  /**
   * The Flow API instance exposed by the Electron preload script.
   * This is defined in electron/preload.ts and exposed via contextBridge
   */
  const flow: {
    // App APIs
    app: FlowAppAPI;
    windows: FlowWindowsAPI;
    extensions: FlowExtensionsAPI;
    updates: FlowUpdatesAPI;
    actions: FlowActionsAPI;
    shortcuts: FlowShortcutsAPI;

    // Browser APIs
    browser: FlowBrowserAPI;
    tabs: FlowTabsAPI;
    page: FlowPageAPI;
    navigation: FlowNavigationAPI;
    interface: FlowInterfaceAPI;
    omnibox: FlowOmniboxAPI;
    newTab: FlowNewTabAPI;
    findInPage: FlowFindInPageAPI;
    history: FlowHistoryAPI;
    omniboxShortcuts: FlowOmniboxShortcutsAPI;

    // Session APIs
    profiles: FlowProfilesAPI;
    spaces: FlowSpacesAPI;

    // Settings APIs
    settings: FlowSettingsAPI;
    icons: FlowIconsAPI;
    openExternal: FlowOpenExternalAPI;
    onboarding: FlowOnboardingAPI;
  };
}
