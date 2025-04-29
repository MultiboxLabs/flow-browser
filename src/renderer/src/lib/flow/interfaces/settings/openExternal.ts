export interface ExternalAppPermission {
  requestingURL: string;
  openingProtocol: string;
}

// API //
export interface FlowOpenExternalAPI {
  /**
   * Gets the list of always open external applications
   */
  getAlwaysOpenExternal: () => Promise<ExternalAppPermission[]>;

  /**
   * Unsets an always open external application
   */
  unsetAlwaysOpenExternal: (requestingURL: string, openingURL: string) => Promise<boolean>;
}
