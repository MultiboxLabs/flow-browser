// API //
export interface FlowKeybindsAPI {
  /**
   * Ping the keybinds API
   */
  ping: () => Promise<boolean>;
}
