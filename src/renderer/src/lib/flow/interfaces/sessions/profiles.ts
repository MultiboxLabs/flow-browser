export type Profile = {
  id: string;
  name: string;
};

// API //
export interface FlowProfilesAPI {
  /**
   * Gets the profiles
   */
  getProfiles: () => Promise<Profile[]>;

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
