import { FlowAppAPI } from "@/lib/flow/interfaces/app/app";
import { FlowInterfaceAPI } from "@/lib/flow/interfaces/interface/interface";
import { FlowNewTabAPI } from "@/lib/flow/interfaces/app/newTab";
import { FlowOmniboxAPI } from "@/lib/flow/interfaces/windows/omnibox";
import { FlowProfilesAPI } from "@/lib/flow/interfaces/sessions/profiles";
import { FlowSettingsAPI } from "@/lib/flow/interfaces/windows/settings";
import { FlowSpacesAPI } from "@/lib/flow/interfaces/sessions/spaces";
import { FlowTabsAPI } from "@/lib/flow/interfaces/interface/tabs";

declare global {
  /**
   * The Flow API instance exposed by the Electron preload script.
   * This is defined in electron/preload.ts and exposed via contextBridge
   */
  const flow: {
    // Interface APIs
    interface: FlowInterfaceAPI;
    tabs: FlowTabsAPI;

    // Session APIs
    profiles: FlowProfilesAPI;
    spaces: FlowSpacesAPI;

    // App APIs
    app: FlowAppAPI;
    newTab: FlowNewTabAPI;

    // Windows APIs
    omnibox: FlowOmniboxAPI;
    settings: FlowSettingsAPI;
  };
}
