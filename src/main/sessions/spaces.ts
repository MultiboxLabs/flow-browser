import fs from "fs/promises";
import { DataStoreData, getDatastore } from "@/saving/datastore";
import z from "zod";
import { debugError } from "@/modules/output";
import { getProfile, getProfiles } from "@/sessions/profiles";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import path from "path";

export const spacesEmitter = new TypedEventEmitter<{
  changed: [];
}>();

// Private
function getSpaceDataStore(profileId: string, spaceId: string) {
  return getDatastore("main", ["profiles", profileId, "spaces", spaceId]);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SpaceDataSchema = z.object({
  name: z.string(),
  profileId: z.string(),
  bgStartColor: z.string().optional(),
  bgEndColor: z.string().optional(),
  icon: z.string().optional(),
  lastUsed: z.number().default(0),
  order: z.number().default(999)
});

export type SpaceData = z.infer<typeof SpaceDataSchema>;

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

function onSpacesChanged() {
  spacesEmitter.emit("changed");
}

// CRUD Operations
export async function getSpace(spaceId: string) {
  const profiles = await getProfiles();
  for (const profile of profiles) {
    const space = await getSpaceFromProfile(profile.id, spaceId);
    if (space) {
      return space;
    }
  }
  return null;
}

export async function getSpaceFromProfile(profileId: string, spaceId: string) {
  try {
    const spaceStore = getSpaceDataStore(profileId, spaceId);
    const data = await spaceStore.getFullData();

    // If there's no data for this space, it doesn't exist
    if (Object.keys(data).length === 0) return null;

    const spaceData = reconcileSpaceData(spaceId, profileId, data);

    return {
      id: spaceId,
      ...spaceData
    };
  } catch (error) {
    debugError("SPACES", `Error getting space ${spaceId} from profile ${profileId}:`, error);
    return null;
  }
}

export async function createSpace(profileId: string, spaceId: string, spaceName: string) {
  // Validate spaceId to prevent invalid characters
  if (!/^[a-zA-Z0-9_-]+$/.test(spaceId)) {
    debugError("SPACES", `Invalid space ID: ${spaceId}`);
    return false;
  }

  // Make sure profile exists
  const profile = await getProfile(profileId);
  if (!profile) {
    debugError("SPACES", `Profile ${profileId} does not exist`);
    return false;
  }

  // Check if space already exists
  const existingSpace = await getSpaceFromProfile(profileId, spaceId);
  if (existingSpace) {
    debugError("SPACES", `Space ${spaceId} already exists in profile ${profileId}`);
    return false;
  }

  try {
    const order = await getSpaces()
      .then((spaces) => {
        return (
          spaces
            .filter((space) => space !== null)
            .reduce((acc: number, space) => {
              return Math.max(acc, space.order);
            }, 0) + 1
        );
      })
      .catch(() => 999);

    const spaceStore = getSpaceDataStore(profileId, spaceId);
    await spaceStore.set("name", spaceName);
    await spaceStore.set("profileId", profileId);
    await spaceStore.set("order", order);

    onSpacesChanged();
    return true;
  } catch (error) {
    debugError("SPACES", `Error creating space ${spaceId}:`, error);
    return false;
  }
}

export async function updateSpace(profileId: string, spaceId: string, spaceData: Partial<SpaceData>) {
  try {
    const spaceStore = getSpaceDataStore(profileId, spaceId);

    if (spaceData.name) {
      await spaceStore.set("name", spaceData.name);
    }
    if (spaceData.bgStartColor !== undefined) {
      await spaceStore.set("bgStartColor", spaceData.bgStartColor);
    }
    if (spaceData.bgEndColor !== undefined) {
      await spaceStore.set("bgEndColor", spaceData.bgEndColor);
    }
    if (spaceData.icon !== undefined) {
      await spaceStore.set("icon", spaceData.icon);
    }

    // Space order must be updated with updateSpaceOrder() / reorderSpaces()

    onSpacesChanged();
    return true;
  } catch (error) {
    debugError("SPACES", `Error updating space ${spaceId}:`, error);
    return false;
  }
}

export async function deleteSpace(profileId: string, spaceId: string) {
  try {
    // Delete Space Data
    const spaceStore = getSpaceDataStore(profileId, spaceId);
    await spaceStore.wipe();

    onSpacesChanged();
    return true;
  } catch (error) {
    debugError("SPACES", `Error deleting space ${spaceId}:`, error);
    return false;
  }
}

export async function getSpacesFromProfile(profileId: string) {
  try {
    // Get profile spaces from datastore
    const profileStore = getDatastore("main", ["profiles", profileId, "spaces"]);

    // Use fs with datastore.directoryPath to get space IDs
    try {
      // Get the directory path for spaces in this profile
      const spacesPath = profileStore.directoryPath;

      if (!spacesPath) {
        debugError("SPACES", `Could not get directoryPath for profile ${profileId} spaces`);
        return [];
      }

      // Check if directory exists
      const dirExists = await fs
        .stat(spacesPath)
        .then((stats) => stats.isDirectory())
        .catch(() => false);

      if (!dirExists) {
        return [];
      }

      // Read the directory to get space IDs
      const spaceIds = (
        await fs.readdir(spacesPath).then((ids) => {
          const promises = ids.map((id) => {
            const stats = fs.stat(path.join(spacesPath, id));
            return stats.then((stats) => {
              if (stats.isDirectory()) {
                return id;
              }
              return null;
            });
          });
          return Promise.all(promises);
        })
      ).filter((id) => id !== null);

      if (!spaceIds || spaceIds.length === 0) {
        return [];
      }

      // Get space data for each ID
      const promises = spaceIds.map((spaceId: string) => getSpaceFromProfile(profileId, spaceId));
      const spaces = await Promise.all(promises);

      return spaces.filter((space) => space !== null);
    } catch (error) {
      debugError("SPACES", `Error reading spaces directory for profile ${profileId}:`, error);
      return [];
    }
  } catch (error) {
    debugError("SPACES", `Error getting spaces from profile ${profileId}:`, error);
    return [];
  }
}

export async function getSpaces() {
  try {
    const profiles = await getProfiles();
    const profileSpaces = await Promise.all(
      profiles.map(async (profile) => {
        const profileSpaces = await getSpacesFromProfile(profile.id);
        return profileSpaces;
      })
    );

    const spaces = profileSpaces.flat();
    return spaces.sort((a, b) => {
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;

      const transformedA = reconcileSpaceData(a.id, a.profileId, a);
      const transformedB = reconcileSpaceData(b.id, b.profileId, b);
      return transformedA.order - transformedB.order;
    });
  } catch (error) {
    debugError("SPACES", "Error getting all spaces:", error);
    return [];
  }
}

export async function setSpaceLastUsed(profileId: string, spaceId: string) {
  const spaceStore = getSpaceDataStore(profileId, spaceId);
  return await spaceStore
    .set("lastUsed", Date.now())
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
}

export async function getLastUsedSpaceFromProfile(profileId: string) {
  const spaces = await getSpacesFromProfile(profileId);
  // Filter out null spaces before sorting
  const validSpaces = spaces.filter((space) => space !== null);

  if (validSpaces.length === 0) {
    return null;
  }

  const sortedSpaces = validSpaces.sort((a, b) => {
    const transformedA = reconcileSpaceData(a.id, a.profileId, a);
    const transformedB = reconcileSpaceData(b.id, b.profileId, b);
    return transformedB.lastUsed - transformedA.lastUsed;
  });

  return sortedSpaces[0];
}

export async function getLastUsedSpace() {
  const spaces = await getSpaces();
  // Filter out null spaces before sorting
  const validSpaces = spaces.filter((space) => space !== null);

  if (validSpaces.length === 0) {
    return null;
  }

  const sortedSpaces = validSpaces.sort((a, b) => {
    const transformedA = reconcileSpaceData(a.id, a.profileId, a);
    const transformedB = reconcileSpaceData(b.id, b.profileId, b);
    return transformedB.lastUsed - transformedA.lastUsed;
  });

  return sortedSpaces[0];
}

export async function updateSpaceOrder(profileId: string, spaceId: string, order: number) {
  try {
    const spaceStore = getSpaceDataStore(profileId, spaceId);
    await spaceStore.set("order", order);
    onSpacesChanged();
    return true;
  } catch (error) {
    debugError("SPACES", `Error updating order for space ${spaceId}:`, error);
    return false;
  }
}

export async function reorderSpaces(orderMap: { profileId: string; spaceId: string; order: number }[]) {
  try {
    const updatePromises = orderMap.map(({ profileId, spaceId, order }) => {
      const spaceStore = getSpaceDataStore(profileId, spaceId);
      return spaceStore.set("order", order);
    });

    await Promise.all(updatePromises);
    onSpacesChanged();
    return true;
  } catch (error) {
    debugError("SPACES", "Error reordering spaces:", error);
    return false;
  }
}
