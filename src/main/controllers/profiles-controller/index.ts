// This controller handles all profile related operations
// The raw controller is used to handle the raw data operations, and operations are cached here

import { RawProfilesController, ProfileData, ProfileDataSchema } from "@/controllers/profiles-controller/raw";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { generateID } from "@/modules/utils";

type ProfileDataWithId = ProfileData & { id: string };

// Events //
type ProfilesControllerEvents = {
  "profile-created": [profileId: string, profileData: ProfileData];
  "profile-deleted": [profileId: string];
  "profile-updated": [profileId: string, updatedFields: Partial<ProfileData>];
  "requested-all-profiles": [];
};

// Re-exporting Schema
export { type ProfileData, ProfileDataSchema };

class ProfilesController extends TypedEventEmitter<ProfilesControllerEvents> {
  private raw: RawProfilesController;
  private cache: Map<string, ProfileData>;

  public requestedAllProfiles: boolean;
  private _requestedAllProfilesPromise: Promise<void> | null;

  constructor() {
    super();

    this.raw = new RawProfilesController();
    this.cache = new Map();

    this.requestedAllProfiles = false;
    this._requestedAllProfilesPromise = null;
  }

  // Request All Profiles //
  private _requestAllProfiles() {
    if (this._requestedAllProfilesPromise) {
      return this._requestedAllProfilesPromise;
    }

    const runner = async () => {
      const profileIds = await this.raw.listProfiles();
      const promises = profileIds.map((profileId) => this.get(profileId));
      await Promise.all(promises);
      this.requestedAllProfiles = true;
      this.emit("requested-all-profiles");
    };
    const promise = runner();
    this._requestedAllProfilesPromise = promise;
    return promise;
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

  // CRUD Functions //
  public async create(profileName: string, shouldCreateSpace: boolean = true): Promise<boolean> {
    const profileId = generateID();
    const result = await this.raw.create(profileId, profileName, shouldCreateSpace);
    if (result.success) {
      this._setCachedProfileData(profileId, result.profileData);
      this.emit("profile-created", profileId, result.profileData);
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
      this.emit("profile-updated", profileId, result.updatedFields);
    }
    return result.success;
  }

  public async delete(profileId: string): Promise<boolean> {
    const result = await this.raw.delete(profileId);
    if (result) {
      this._invalidateCache(profileId);
      this.emit("profile-deleted", profileId);
      return true;
    }
    return false;
  }

  // Other Functions //
  public async getAll(): Promise<ProfileDataWithId[]> {
    if (this.requestedAllProfiles) {
      const profiles: ProfileDataWithId[] = [];

      // Grab all the profiles from the cache
      this.cache.forEach((profileData, profileId) => {
        profiles.push({ ...profileData, id: profileId });
      });

      // Sort the profiles by createdAt
      profiles.sort((a, b) => a.createdAt - b.createdAt);

      return profiles;
    }

    // Populate the cache
    await this._requestAllProfiles();
    return await this.getAll();
  }
}

export const profilesController = new ProfilesController();
