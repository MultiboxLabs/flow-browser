import { IPCListener } from "~/flow/types";
import { SharedExtensionData } from "~/types/extensions";

// API //
export interface FlowExtensionsAPI {
  /**
   * Get all extensions in the current profile
   */
  getAllInCurrentProfile: () => Promise<SharedExtensionData[]>;

  /**
   * Listen for updates to the extensions in the current profile
   */
  onUpdated: IPCListener<[string, SharedExtensionData[]]>;

  /**
   * Set the enabled state of an extension
   */
  setExtensionEnabled: (extensionId: string, enabled: boolean) => Promise<boolean>;

  /**
   * Uninstall an extension
   */
  uninstallExtension: (extensionId: string) => Promise<boolean>;

  /**
   * Set the pinned state of an extension
   */
  setExtensionPinned: (extensionId: string, pinned: boolean) => Promise<boolean>;
}
