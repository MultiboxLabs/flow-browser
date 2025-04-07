import { FLOW_DATA_DIR } from "@/modules/paths";
import path from "path";
import fs from "fs/promises";
import { DataStoreData, getDatastore } from "@/saving/datastore";
import z from "zod";
import { debugError } from "@/modules/output";
import { getProfile, getProfiles, ProfileData } from "@/sessions/profiles";

const SPACES_DIR = path.join(FLOW_DATA_DIR, "Spaces");

// Private
function getSpaceDataStore(profileId: string, spaceId: string) {
  return getDatastore("main", ["profiles", profileId, "spaces", spaceId]);
}

const SpaceDataSchema = z.object({
  name: z.string(),
  profileId: z.string(),
  bgStartColor: z.string().optional(),
  bgEndColor: z.string().optional(),
  icon: z.string().optional(),
  lastUsed: z.number().default(0)
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
    lastUsed: data.lastUsed ?? 0
  };
}

// Utilities
export function getSpacePath(profileId: string, spaceId: string): string {
  return path.join(SPACES_DIR, profileId, spaceId);
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
  const spaceDir = getSpacePath(profileId, spaceId);

  const stats = await fs.stat(spaceDir).catch(() => null);
  if (!stats) return null;
  if (!stats.isDirectory()) return null;

  const spaceStore = getSpaceDataStore(profileId, spaceId);
  const spaceData = await spaceStore.getFullData().then((data) => reconcileSpaceData(spaceId, profileId, data));

  return {
    id: spaceId,
    ...spaceData
  };
}

export async function createSpace(profileId: string, spaceId: string, spaceName: string) {
  // Validate spaceId to prevent directory traversal attacks or invalid characters
  if (!/^[a-zA-Z0-9_-]+$/.test(spaceId)) {
    debugError("PROFILES", `Invalid space ID: ${spaceId}`);
    return false;
  }

  // Make sure profile exists
  const profile = await getProfile(profileId);
  if (!profile) {
    debugError("PROFILES", `Profile ${profileId} does not exist`);
    return false;
  }

  // Check if space already exists
  const existingSpace = await getSpaceFromProfile(profileId, spaceId);
  if (existingSpace) {
    debugError("PROFILES", `Space ${spaceId} already exists in profile ${profileId}`);
    return false;
  }

  try {
    const spacePath = getSpacePath(profileId, spaceId);
    await fs.mkdir(spacePath, { recursive: true });

    const spaceStore = getSpaceDataStore(profileId, spaceId);
    await spaceStore.set("name", spaceName);
    await spaceStore.set("profileId", profileId);

    return true;
  } catch (error) {
    debugError("PROFILES", `Error creating space ${spaceId}:`, error);
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

    return true;
  } catch (error) {
    debugError("PROFILES", `Error updating space ${spaceId}:`, error);
    return false;
  }
}

export async function deleteSpace(profileId: string, spaceId: string) {
  try {
    // Delete Space Directory
    const spacePath = getSpacePath(profileId, spaceId);
    await fs.rm(spacePath, { recursive: true, force: true });

    // Delete Space Data
    const spaceStore = getSpaceDataStore(profileId, spaceId);
    await spaceStore.wipe();

    return true;
  } catch (error) {
    debugError("PROFILES", `Error deleting space ${spaceId}:`, error);
    return false;
  }
}

export async function getSpacesFromProfile(profileId: string, prefetchedProfile?: ProfileData) {
  try {
    const profile = prefetchedProfile ?? (await getProfile(profileId));
    const profileSpacesDir = path.join(SPACES_DIR, profileId);

    // Check if directory exists first
    const dirExists = await fs
      .stat(profileSpacesDir)
      .then((stats) => {
        return stats.isDirectory();
      })
      .catch(() => false);

    if (!dirExists) {
      await fs.mkdir(profileSpacesDir, { recursive: true });
      return [];
    }

    const spaceDatas = await fs.readdir(profileSpacesDir).then((spaceIds) => {
      const promises = spaceIds.map((spaceId) => getSpaceFromProfile(profileId, spaceId));
      return Promise.all(promises);
    });

    const spaces = spaceDatas.filter((space) => space !== null);
    return spaces;
  } catch (error) {
    console.error("Error reading spaces directory:", error);
    return [];
  }
}

export async function getSpaces() {
  try {
    const profiles = await getProfiles();
    const spaces = await Promise.all(
      profiles.map(async (profile) => {
        const profileSpaces = await getSpacesFromProfile(profile.id, profile);
        return profileSpaces;
      })
    );
    return spaces.flat();
  } catch {
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
  const sortedSpaces = spaces.sort((a, b) => {
    const transformedA = reconcileSpaceData(a.id, a.profileId, a);
    const transformedB = reconcileSpaceData(b.id, b.profileId, b);
    return transformedB.lastUsed - transformedA.lastUsed;
  });
  return sortedSpaces[0];
}

export async function getLastUsedSpace() {
  const spaces = await getSpaces();
  const sortedSpaces = spaces.sort((a, b) => {
    const transformedA = reconcileSpaceData(a.id, a.profileId, a);
    const transformedB = reconcileSpaceData(b.id, b.profileId, b);
    return transformedB.lastUsed - transformedA.lastUsed;
  });
  return sortedSpaces[0] || null;
}
