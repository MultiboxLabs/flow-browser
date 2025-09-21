import { debugError } from "@/modules/output";
import { FLOW_DATA_DIR } from "@/modules/paths";
import { getCurrentTimestamp } from "@/modules/utils";
import path from "path";
import fs from "fs/promises";
import { DataStoreData, getDatastore } from "@/saving/datastore";
import z from "zod";

const PROFILES_DIR = path.join(FLOW_DATA_DIR, "Profiles");

// Types
export type RawCreateProfileResult =
  | {
      success: boolean;
      profileData: ProfileData;
    }
  | {
      success: false;
    };

type RawUpdateProfileResult =
  | {
      success: true;
      updatedFields: Partial<ProfileData>;
    }
  | {
      success: false;
    };

// Schema
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ProfileDataSchema = z.object({
  name: z.string(),
  createdAt: z.number()
});
export type ProfileData = z.infer<typeof ProfileDataSchema>;

// Private functions
function getProfileDataStore(profileId: string) {
  return getDatastore("main", ["profiles", profileId]);
}

function reconcileProfileData(profileId: string, data: DataStoreData): ProfileData {
  let defaultName = profileId;
  if (profileId === "main") {
    defaultName = "Main";
  }

  return {
    name: data.name ?? defaultName,
    createdAt: data.createdAt ?? getCurrentTimestamp()
  };
}

// Controller
export class RawProfilesController {
  public getProfilePath(profileId: string) {
    return path.join(PROFILES_DIR, profileId);
  }

  public async create(
    profileId: string,
    profileName: string,
    shouldCreateSpace: boolean = true
  ): Promise<RawCreateProfileResult> {
    // Validate profileId to prevent directory traversal attacks or invalid characters
    if (!/^[a-zA-Z0-9_-]+$/.test(profileId)) {
      debugError("PROFILES", `Invalid profile ID: ${profileId}`);
      return { success: false };
    }

    // Check if profile already exists
    const existingProfile = null; // TODO: this.getProfile(profileId);
    if (existingProfile) {
      debugError("PROFILES", `Profile ${profileId} already exists`);
      return { success: false };
    }

    try {
      // Create profile directory (Holds Chromium Profile Data)
      const profilePath = this.getProfilePath(profileId);
      await fs.mkdir(profilePath, { recursive: true });

      // Set profile data
      const profileData: ProfileData = {
        name: profileName,
        createdAt: getCurrentTimestamp()
      };
      const profileStore = getProfileDataStore(profileId);
      await profileStore.set("name", profileData.name);
      await profileStore.set("createdAt", profileData.createdAt);

      if (shouldCreateSpace) {
        // TODO: create initial space
        // await createSpace(profileId, generateID(), profileName).then((success) => {
        //   if (!success) {
        //     debugError("PROFILES", `Error creating default space for profile ${profileId}`);
        //   }
        // });
      }

      return { success: true, profileData };
    } catch (error) {
      debugError("PROFILES", `Error creating profile ${profileId}:`, error);
      return { success: false };
    }
  }

  public async get(profileId: string) {
    const profileDir = this.getProfilePath(profileId);

    const stats = await fs.stat(profileDir).catch(() => null);
    if (!stats) return null;
    if (!stats.isDirectory()) return null;

    const profileStore = getProfileDataStore(profileId);
    const profileData = await profileStore.getFullData().then((data) => reconcileProfileData(profileId, data));
    return profileData;
  }

  public async update(profileId: string, profileData: Partial<ProfileData>): Promise<RawUpdateProfileResult> {
    try {
      const profileStore = getProfileDataStore(profileId);
      const updatedFields: Partial<ProfileData> = {};

      if (profileData.name) {
        await profileStore.set("name", profileData.name);
        updatedFields.name = profileData.name;
      }

      return { success: true, updatedFields };
    } catch (error) {
      debugError("PROFILES", `Error updating profile ${profileId}:`, error);
      return { success: false };
    }
  }

  public async delete(profileId: string) {
    try {
      // TODO: Delete all spaces associated with this profile
      // const spaces = await getSpacesFromProfile(profileId);
      // await Promise.all(spaces.map((space) => deleteSpace(profileId, space.id)));

      // Delete Chromium Profile
      const profilePath = this.getProfilePath(profileId);
      await fs.rm(profilePath, { recursive: true, force: true });

      // Delete Profile Data
      const profileStore = getProfileDataStore(profileId);
      await profileStore.wipe();

      return true;
    } catch (error) {
      debugError("PROFILES", `Error deleting profile ${profileId}:`, error);
      return false;
    }
  }
}
