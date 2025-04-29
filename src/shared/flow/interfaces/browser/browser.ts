// API //
export interface FlowBrowserAPI {
  /**
   * Loads a profile
   * @param profileId The id of the profile to load
   */
  loadProfile: (profileId: string) => Promise<void>;

  /**
   * Unloads a profile
   * @param profileId The id of the profile to unload
   */
  unloadProfile: (profileId: string) => Promise<void>;

  /**
   * Creates a new window
   */
  createWindow: () => void;
}
