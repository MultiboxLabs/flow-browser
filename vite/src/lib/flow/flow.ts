import { FlowBrowserAPI } from "@/lib/flow/interfaces/browser/browser";
import { FlowNavigationAPI } from "@/lib/flow/interfaces/browser/navigation";
import { FlowPageAPI } from "@/lib/flow/interfaces/browser/page";
import { FlowTabsAPI } from "@/lib/flow/interfaces/browser/tabs";
import { FlowInterfaceAPI } from "@/lib/flow/interfaces/browser/interface";
import { FlowProfilesAPI } from "@/lib/flow/interfaces/sessions/profiles";
import { FlowSpacesAPI } from "@/lib/flow/interfaces/sessions/spaces";
import { FlowAppAPI } from "@/lib/flow/interfaces/app/app";
import { FlowIconsAPI } from "@/lib/flow/interfaces/app/icons";
import { FlowNewTabAPI } from "@/lib/flow/interfaces/app/newTab";
import { FlowOmniboxAPI } from "@/lib/flow/interfaces/windows/omnibox";
import { FlowSettingsAPI } from "@/lib/flow/interfaces/windows/settings";
import { FlowOpenExternalAPI } from "@/lib/flow/interfaces/app/openExternal";
import { FlowOnboardingAPI } from "@/lib/flow/interfaces/app/onboarding";

declare global {
  /**
   * The Flow API instance exposed by the Electron preload script.
   * This is defined in electron/preload.ts and exposed via contextBridge
   */
  const flow: {
    // Browser APIs
    browser: FlowBrowserAPI;
    tabs: FlowTabsAPI;
    page: FlowPageAPI;
    navigation: FlowNavigationAPI;
    interface: FlowInterfaceAPI;

    // Session APIs
    profiles: FlowProfilesAPI;
    spaces: FlowSpacesAPI;

    // App APIs
    app: FlowAppAPI;
    icons: FlowIconsAPI;
    newTab: FlowNewTabAPI;
    openExternal: FlowOpenExternalAPI;
    onboarding: FlowOnboardingAPI;

    // Windows APIs
    omnibox: FlowOmniboxAPI;
    settings: FlowSettingsAPI;
  };
}
