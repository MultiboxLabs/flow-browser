import { profilesController } from "@/controllers/profiles-controller";
import { spacesController } from "@/controllers/spaces-controller";
import { debugError } from "@/modules/output";
import { getAllDirectories } from "@/modules/utils";
import { DataStoreData, getDatastore } from "@/saving/datastore";
import { type } from "arktype";

// Types
type RawCreateSpaceResult =
  | {
      success: true;
      spaceData: SpaceData;
    }
  | {
      success: false;
    };

type RawUpdateSpaceResult =
  | {
      success: true;
      updatedFields: Partial<SpaceData>;
    }
  | {
      success: false;
    };

// Schema
export const SpaceDataSchema = type({
  name: "string",
  profileId: "string",
  bgStartColor: "string | undefined",
  bgEndColor: "string | undefined",
  icon: "string | undefined",
  lastUsed: "number",
  order: "number"
});
export type SpaceData = typeof SpaceDataSchema.infer;

// Private functions
function getSpaceDataStore(profileId: string, spaceId: string) {
  return getDatastore("main", ["profiles", profileId, "spaces", spaceId]);
}

function reconcileSpaceData(spaceId: string, profileId: string, data: DataStoreData): SpaceData {
  let defaultName = spaceId;
  if (spaceId === "default") {
    defaultName = "Default";
  }

  return {
    name: data.name ?? defaultName,
    profileId: data.profileId ?? profileId,
    bgStartColor: data.bgStartColor,
    bgEndColor: data.bgEndColor,
    icon: data.icon,
    lastUsed: data.lastUsed ?? 0,
    order: data.order ?? 999
  };
}

// Controller
export class RawSpacesController {
  // CRUD Functions //
  public async create(profileId: string, spaceId: string, spaceName: string): Promise<RawCreateSpaceResult> {
    // Validate spaceId to prevent invalid characters
    if (!/^[a-zA-Z0-9_-]+$/.test(spaceId)) {
      debugError("SPACES", `Invalid space ID: ${spaceId}`);
      return { success: false };
    }

    // Make sure profile exists
    const profile = await profilesController.get(profileId);
    if (!profile) {
      debugError("SPACES", `Profile ${profileId} does not exist`);
      return { success: false };
    }

    // Check if space already exists
    const existingSpace = await this.get(profileId, spaceId);
    if (existingSpace) {
      debugError("SPACES", `Space ${spaceId} already exists in profile ${profileId}`);
      return { success: false };
    }

    try {
      const order = await spacesController
        .getAll()
        .then((spaces) => {
          return (
            spaces.reduce((acc: number, space) => {
              return Math.max(acc, space.order);
            }, 0) + 1
          );
        })
        .catch(() => 999);

      // Set space data
      const spaceData = {
        name: spaceName,
        profileId: profileId,
        order: order
      };
      const spaceStore = getSpaceDataStore(profileId, spaceId);
      await spaceStore.setMany(spaceData);

      return { success: true, spaceData: reconcileSpaceData(spaceId, profileId, spaceData) };
    } catch (error) {
      debugError("SPACES", `Error creating space ${spaceId}:`, error);
      return { success: false };
    }
  }

  public async get(profileId: string, spaceId: string) {
    try {
      const spaceStore = getSpaceDataStore(profileId, spaceId);
      const data = await spaceStore.getFullData();

      // If there's no data for this space, it doesn't exist
      if (Object.keys(data).length === 0) return null;

      const spaceData = reconcileSpaceData(spaceId, profileId, data);
      return spaceData;
    } catch (error) {
      debugError("SPACES", `Error getting space ${spaceId} from profile ${profileId}:`, error);
      return null;
    }
  }

  public async update(
    profileId: string,
    spaceId: string,
    spaceData: Partial<SpaceData>
  ): Promise<RawUpdateSpaceResult> {
    try {
      const spaceStore = getSpaceDataStore(profileId, spaceId);
      const updatedFields: Partial<SpaceData> = {};

      if (spaceData.name !== undefined) {
        updatedFields.name = spaceData.name;
      }
      if (spaceData.bgStartColor !== undefined) {
        updatedFields.bgStartColor = spaceData.bgStartColor;
      }
      if (spaceData.bgEndColor !== undefined) {
        updatedFields.bgEndColor = spaceData.bgEndColor;
      }
      if (spaceData.icon !== undefined) {
        updatedFields.icon = spaceData.icon;
      }
      if (spaceData.lastUsed !== undefined) {
        updatedFields.lastUsed = spaceData.lastUsed;
      }
      if (spaceData.order !== undefined) {
        updatedFields.order = spaceData.order;
      }

      // Space order must be updated with updateSpaceOrder() / reorderSpaces()

      if (Object.keys(updatedFields).length > 0) {
        await spaceStore.setMany(updatedFields);
      }

      return { success: true, updatedFields };
    } catch (error) {
      debugError("SPACES", `Error updating space ${spaceId}:`, error);
      return { success: false };
    }
  }

  public async delete(profileId: string, spaceId: string) {
    try {
      // Delete Space Data
      const spaceStore = getSpaceDataStore(profileId, spaceId);
      await spaceStore.wipe();
      return true;
    } catch (error) {
      debugError("SPACES", `Error deleting space ${spaceId}:`, error);
      return false;
    }
  }

  // List Functions //
  /**
   * List all spaces for a profile
   * Warning: Some of the values may not be valid space IDs, use with caution.
   * @param profileId - The ID of the profile to list spaces for
   * @returns Array of space IDs
   */
  public async listSpacesWithProfile(profileId: string) {
    // Get profile spaces from datastore
    const profileStore = getDatastore("main", ["profiles", profileId, "spaces"]);

    // Use fs with datastore.directoryPath to get space IDs
    const spaceIds = await getAllDirectories(profileStore.directoryPath);
    return spaceIds;
  }
}
