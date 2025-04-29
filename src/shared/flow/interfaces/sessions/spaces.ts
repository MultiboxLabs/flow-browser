import { IPCListener } from "~/flow/types";

export type Space = {
  id: string;
  name: string;
  profileId: string;
  bgStartColor: string;
  bgEndColor: string;
  icon: string;
};

// API //
export interface FlowSpacesAPI {
  /**
   * Gets the spaces
   */
  getSpaces: () => Promise<Space[]>;

  /**
   * Gets the spaces from a profile
   */
  getSpacesFromProfile: (profileId: string) => Promise<Space[]>;

  /**
   * Creates a space
   */
  createSpace: (profileId: string, spaceName: string) => Promise<boolean>;

  /**
   * Deletes a space
   */
  deleteSpace: (profileId: string, spaceId: string) => Promise<boolean>;

  /**
   * Updates a space
   */
  updateSpace: (profileId: string, spaceId: string, spaceData: Partial<Space>) => Promise<boolean>;

  /**
   * Sets the space that is currently being used
   */
  setUsingSpace: (profileId: string, spaceId: string) => Promise<boolean>;

  /**
   * Gets the space id that is currently being used
   */
  getUsingSpace: () => Promise<string | null>;

  /**
   * Gets the last used space
   */
  getLastUsedSpace: () => Promise<Space | null>;

  /**
   * Reorders the spaces
   */
  reorderSpaces: (orderMap: { profileId: string; spaceId: string; order: number }[]) => Promise<boolean>;

  /**
   * Listens for changes to the spaces
   */
  onSpacesChanged: IPCListener<[void]>;

  /**
   * Listens for changes to the space that the current window is using
   */
  onSetWindowSpace: IPCListener<[string]>;
}
