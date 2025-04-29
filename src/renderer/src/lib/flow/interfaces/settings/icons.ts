export type IconData = {
  id: string;
  name: string;
  image_id: string;
  author?: string;
};

// API //
export interface FlowIconsAPI {
  /**
   * Gets the icons
   */
  getIcons: () => Promise<IconData[]>;

  /**
   * Checks if the platform is supported
   */
  isPlatformSupported: () => Promise<boolean>;

  /**
   * Gets the current app icon
   */
  getCurrentIcon: () => Promise<string>;

  /**
   * Sets the current app icon
   */
  setCurrentIcon: (iconId: string) => Promise<boolean>;
}
