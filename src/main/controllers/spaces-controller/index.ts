// This controller handles all space related operations
// The raw controller is used to handle the raw data operations, and operations are cached here

import { profilesController } from "@/controllers/profiles-controller";
import { RawSpacesController, SpaceData, SpaceDataSchema } from "@/controllers/spaces-controller/raw";
import { debugError } from "@/modules/output";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { generateID } from "@/modules/utils";

type SpaceDataWithId = SpaceData & { id: string };
export type SpaceOrderMap = { profileId: string; spaceId: string; order: number }[];

// Events //
type SpacesControllerEvents = {
  "space-created": [profileId: string, spaceId: string, spaceData: SpaceData];
  "space-updated": [profileId: string, spaceId: string, updatedFields: Partial<SpaceData>];
  "space-deleted": [profileId: string, spaceId: string];

  "requested-all-spaces-from-profile": [profileId: string];
};

// Re-exporting Schema
export { type SpaceData, SpaceDataSchema };

class SpacesController extends TypedEventEmitter<SpacesControllerEvents> {
  private raw: RawSpacesController;
  private cache: Map<string, SpaceData>;

  private requestedAllSpaces: Set<string>;
  private _requestedAllSpacesPromises: Map<string, Promise<void>>;

  constructor() {
    super();

    this.raw = new RawSpacesController();
    this.cache = new Map();

    this.requestedAllSpaces = new Set();
    this._requestedAllSpacesPromises = new Map();
  }

  // Request All Spaces //
  private _requestAllSpacesFromProfile(profileId: string) {
    // If the promise has already been resolved, then only the boolean will be stored
    if (this.hasRequestedAllSpaces(profileId)) {
      return Promise.resolve();
    }

    // The promise will be stored in the map when it is being processed
    const existingPromise = this._requestedAllSpacesPromises.get(profileId);
    if (existingPromise) {
      return existingPromise;
    }

    const runner = async () => {
      const potentialSpaceIds = await this.raw.listSpacesWithProfile(profileId);
      const promises = potentialSpaceIds.map((spaceId) => this.getWithProfile(profileId, spaceId));
      await Promise.all(promises);

      // Add a 'completed' boolean to the map and remove the promise to save memory
      this.requestedAllSpaces.add(profileId);
      this._requestedAllSpacesPromises.delete(profileId);

      this.emit("requested-all-spaces-from-profile", profileId);
    };
    const promise = runner();
    this._requestedAllSpacesPromises.set(profileId, promise);
    return promise;
  }

  public hasRequestedAllSpaces(profileId: string) {
    return this.requestedAllSpaces.has(profileId);
  }

  // Cache Functions //
  private _invalidateCache(spaceId: string) {
    this.cache.delete(spaceId);
  }
  private _getCachedSpaceData(spaceId: string) {
    return this.cache.get(spaceId);
  }
  private _setCachedSpaceData(spaceId: string, spaceData: SpaceData) {
    this.cache.set(spaceId, spaceData);
  }

  // Basic CRUD Functions //
  public async create(profileId: string, spaceName: string): Promise<boolean> {
    const spaceId = generateID();
    const result = await this.raw.create(profileId, spaceId, spaceName);
    if (result.success) {
      this._setCachedSpaceData(spaceId, result.spaceData);
      this.emit("space-created", profileId, spaceId, result.spaceData);
      return true;
    }
    return false;
  }

  public async getWithProfile(profileId: string, spaceId: string): Promise<SpaceData | null> {
    const cachedData = this._getCachedSpaceData(spaceId);
    if (cachedData && cachedData.profileId === profileId) {
      return cachedData;
    }

    const result = await this.raw.get(profileId, spaceId);
    if (result) {
      this._setCachedSpaceData(spaceId, result);
    }
    return result;
  }

  public async update(profileId: string, spaceId: string, spaceData: Partial<SpaceData>): Promise<boolean> {
    const result = await this.raw.update(profileId, spaceId, spaceData);

    // Reconcile the cached data with the updated fields if it exists
    // Otherwise do nothing as cache is empty
    if (result.success) {
      const cachedData = this._getCachedSpaceData(spaceId);
      if (cachedData) {
        this._setCachedSpaceData(spaceId, {
          ...cachedData,
          ...result.updatedFields
        });
      }
      this.emit("space-updated", profileId, spaceId, result.updatedFields);
    }

    return result.success;
  }

  public async delete(profileId: string, spaceId: string): Promise<boolean> {
    const result = await this.raw.delete(profileId, spaceId);
    if (result) {
      this._invalidateCache(spaceId);
      this.emit("space-deleted", profileId, spaceId);
    }
    return result;
  }

  // Additional Getters //
  public async get(spaceId: string): Promise<SpaceData | null> {
    for (const profile of await profilesController.getAll()) {
      const space = await this.getWithProfile(profile.id, spaceId);
      if (space) {
        return space;
      }
    }
    return null;
  }

  // Last Used Space //
  public async setLastUsed(profileId: string, spaceId: string): Promise<boolean> {
    return await this.update(profileId, spaceId, { lastUsed: Date.now() });
  }

  private _getLastUsedFromSpaces(spaces: SpaceDataWithId[]): SpaceDataWithId | null {
    if (spaces.length === 0) {
      return null;
    }

    const sortedSpaces = spaces.sort((a, b) => b.lastUsed - a.lastUsed);
    return sortedSpaces[0];
  }

  public async getLastUsedFromProfile(profileId: string): Promise<SpaceDataWithId | null> {
    const spaces = await this.getAllFromProfile(profileId);
    return this._getLastUsedFromSpaces(spaces);
  }

  public async getLastUsed(): Promise<SpaceDataWithId | null> {
    const spaces = await this.getAll();
    return this._getLastUsedFromSpaces(spaces);
  }

  // Ordering Functions //
  public async reorder(orderMap: SpaceOrderMap): Promise<boolean> {
    try {
      const promises = orderMap.map(async ({ profileId, spaceId, order }) => {
        await this.update(profileId, spaceId, { order });
      });
      await Promise.all(promises);
      return true;
    } catch (error) {
      debugError("SPACES", "Error reordering spaces:", error);
      return false;
    }
  }

  // Other Functions //
  public async getAllFromProfile(profileId: string): Promise<SpaceDataWithId[]> {
    if (this.hasRequestedAllSpaces(profileId)) {
      const spaces: SpaceDataWithId[] = [];

      // Grab all the spaces from the cache
      this.cache.forEach((spaceData, spaceId) => {
        if (spaceData.profileId === profileId) {
          spaces.push({ ...spaceData, id: spaceId });
        }
      });

      // Sort the spaces by order
      spaces.sort((a, b) => a.order - b.order);

      return spaces;
    }

    await this._requestAllSpacesFromProfile(profileId);
    return await this.getAllFromProfile(profileId);
  }

  public async getAll(): Promise<SpaceDataWithId[]> {
    const profileDatas = await profilesController.getAll();

    const promises = profileDatas.map(async (profileData) => {
      const spaces = await this.getAllFromProfile(profileData.id);
      return spaces;
    });

    const profileSpaces = await Promise.all(promises);

    const spaceDatas: SpaceDataWithId[] = profileSpaces.flat();
    spaceDatas.sort((a, b) => a.order - b.order);
    return spaceDatas;
  }
}

export const spacesController = new SpacesController();
