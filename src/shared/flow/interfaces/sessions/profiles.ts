export type Profile = {
  id: string;
  name: string;
  /**
   * Causes all spaces in this profile to not be shown in most UI elements and
   * to not be switchable to or from by the user (e.g. incognito profiles)
   */
  internal: boolean;
  /**
   * Causes this profile and all its spaces to be deleted when the session ends
   */
  ephemeral: boolean;
};

// API //
export interface FlowProfilesAPI {
  /**
   * Gets the profiles
   */
  getProfiles: () => Promise<Profile[]>;

  /**
   * Gets a map of which profiles are internal
   */
  getAreProfilesInternal: () => Promise<Record<string, boolean>>;

  /**
   * Creates a profile
   */
  createProfile: (profileName: string) => Promise<boolean>;

  /**
   * Updates a profile
   */
  updateProfile: (profileId: string, profileData: Partial<Profile>) => Promise<boolean>;

  /**
   * Deletes a profile
   */
  deleteProfile: (profileId: string) => Promise<boolean>;

  /**
   * Gets the profile id that is currently being used
   */
  getUsingProfile: () => Promise<string | null>;
}
