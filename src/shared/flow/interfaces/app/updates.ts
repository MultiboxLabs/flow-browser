import type { IPCListener } from "~/flow/types";
import type { UpdateStatus } from "~/types/updates";

// API //
export interface FlowUpdatesAPI {
  /**
   * Checks if automatic updates are supported on the current platform
   * @returns Promise resolving to a boolean indicating support status
   */
  isAutoUpdateSupported: () => Promise<boolean>;

  /**
   * Gets the current update status
   * @returns Promise resolving to the current UpdateStatus
   */
  getUpdateStatus: () => Promise<UpdateStatus>;

  /**
   * Listener for update status change events
   * @param callback Function called when update status changes
   * @returns Cleanup function
   */
  onUpdateStatusChanged: IPCListener<[UpdateStatus]>;

  /**
   * Initiates a check for application updates
   * @returns Promise resolving to a boolean indicating if an update is available
   */
  checkForUpdates: () => Promise<boolean>;

  /**
   * Downloads the latest update
   * @returns Promise resolving to a boolean indicating if the download was started
   */
  downloadUpdate: () => Promise<boolean>;

  /**
   * Installs the latest update
   * @returns Promise resolving to a boolean indicating if the installation was started
   */
  installUpdate: () => Promise<boolean>;
}
