// This controller handles all profile related operations
// The raw controller is used to handle the raw data operations, and operations are cached here

import { ProfileData, RawProfilesController } from "@/controllers/profiles-controller/raw";
import { generateID } from "@/modules/utils";

class ProfilesController {
  private raw: RawProfilesController;
  private cache: Map<string, ProfileData>;

  constructor() {
    this.raw = new RawProfilesController();
    this.cache = new Map();
  }

  // Cache Functions //
  private _invalidateCache(profileId: string) {
    this.cache.delete(profileId);
  }
  private _getCachedProfileData(profileId: string) {
    return this.cache.get(profileId);
  }
  private _setCachedProfileData(profileId: string, profileData: ProfileData) {
    this.cache.set(profileId, profileData);
  }

  // Utility Functions //
  public getProfilePath(profileId: string) {
    return this.raw.getProfilePath(profileId);
  }

  // Main Functions //
  public async create(profileName: string, shouldCreateSpace: boolean = true): Promise<boolean> {
    const profileId = generateID();
    const result = await this.raw.create(profileId, profileName, shouldCreateSpace);
    if (result.success) {
      this._setCachedProfileData(profileId, result.profileData);
      return true;
    }
    return false;
  }

  public async get(profileId: string) {
    const cachedData = this._getCachedProfileData(profileId);
    if (cachedData) {
      return cachedData;
    }

    const result = await this.raw.get(profileId);
    if (result) {
      this._setCachedProfileData(profileId, result);
    }
    return result;
  }

  public async update(profileId: string, profileData: Partial<ProfileData>): Promise<boolean> {
    const result = await this.raw.update(profileId, profileData);

    // Reconcile the cached data with the updated fields if it exists
    // Otherwise do nothing as cache is empty
    if (result.success) {
      const cachedData = this._getCachedProfileData(profileId);
      if (cachedData) {
        this._setCachedProfileData(profileId, {
          ...cachedData,
          ...result.updatedFields
        });
      }
    }
    return result.success;
  }

  public async delete(profileId: string): Promise<boolean> {
    const result = await this.raw.delete(profileId);
    if (result) {
      this._invalidateCache(profileId);
      return true;
    }
    return false;
  }
}

export const profilesController = new ProfilesController();
