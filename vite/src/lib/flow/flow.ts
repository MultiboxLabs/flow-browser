import { FlowAppAPI } from "@/lib/flow/interfaces/app/app";
import { FlowWindowsAPI } from "@/lib/flow/interfaces/app/windows";
import { FlowExtensionsAPI } from "@/lib/flow/interfaces/app/extensions";

import { FlowBrowserAPI } from "@/lib/flow/interfaces/browser/browser";
import { FlowTabsAPI } from "@/lib/flow/interfaces/browser/tabs";
import { FlowPageAPI } from "@/lib/flow/interfaces/browser/page";
import { FlowNavigationAPI } from "@/lib/flow/interfaces/browser/navigation";
import { FlowInterfaceAPI } from "@/lib/flow/interfaces/browser/interface";
import { FlowOmniboxAPI } from "@/lib/flow/interfaces/browser/omnibox";
import { FlowNewTabAPI } from "@/lib/flow/interfaces/browser/newTab";

import { FlowProfilesAPI } from "@/lib/flow/interfaces/sessions/profiles";
import { FlowSpacesAPI } from "@/lib/flow/interfaces/sessions/spaces";

import { FlowSettingsAPI } from "@/lib/flow/interfaces/settings/settings";
import { FlowIconsAPI } from "@/lib/flow/interfaces/settings/icons";
import { FlowOpenExternalAPI } from "@/lib/flow/interfaces/settings/openExternal";
import { FlowOnboardingAPI } from "@/lib/flow/interfaces/settings/onboarding";

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

    // Browser APIs
    browser: FlowBrowserAPI;
    tabs: FlowTabsAPI;
    page: FlowPageAPI;
    navigation: FlowNavigationAPI;
    interface: FlowInterfaceAPI;
    omnibox: FlowOmniboxAPI;
    newTab: FlowNewTabAPI;

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
