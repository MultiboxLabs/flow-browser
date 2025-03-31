import { FLOW_DATA_DIR } from "./paths";
import path from "path";
import fs from "fs";
import { DataStoreData, getDatastore } from "@/saving/datastore";
import z from "zod";
import { debugError } from "@/modules/output";

const PROFILES_DIR = path.join(FLOW_DATA_DIR, "Profiles");

// Private
function getProfileDataStore(profileId: string) {
  return getDatastore("main", ["profiles", profileId]);
}

const ProfileDataSchema = z.object({
  name: z.string(),
  iconId: z.string(),
  bgGradient: z.array(z.string())
});
type ProfileData = z.infer<typeof ProfileDataSchema>;

function reconcileProfileData(profileId: string, data: DataStoreData): ProfileData {
  return {
    name: data.name ?? profileId,
    iconId: data.iconId ?? "orbit",
    bgGradient: data.bgGradient ?? ["#000000", "#000000"]
  };
}

// Utilities
export function getProfilePath(profileId: string): string {
  return path.join(PROFILES_DIR, profileId);
}

// CRUD Operations
export async function createProfile(profileId: string, profileName: string) {
  try {
    const profilePath = getProfilePath(profileId);
    fs.mkdirSync(profilePath, { recursive: true });

    const profileStore = getProfileDataStore(profileId);
    await profileStore.set("name", profileName);

    return true;
  } catch (error) {
    debugError("PROFILES", `Error creating profile ${profileId}:`, error);
    return false;
  }
}

export async function deleteProfile(profileId: string) {
  try {
    const profilePath = getProfilePath(profileId);
    fs.rmSync(profilePath, { recursive: true, force: true });

    return true;
  } catch (error) {
    debugError("PROFILES", `Error deleting profile ${profileId}:`, error);
    return false;
  }
}

export async function getProfiles() {
  try {
    // Check if directory exists first
    if (!fs.existsSync(PROFILES_DIR)) {
      fs.mkdirSync(PROFILES_DIR, { recursive: true });
      return [];
    }

    const promises = fs.readdirSync(PROFILES_DIR).map(async (profileId) => {
      const profileDir = path.join(PROFILES_DIR, profileId);
      if (!fs.statSync(profileDir).isDirectory()) {
        return null;
      }

      const profileStore = getProfileDataStore(profileId);
      const profileData = await profileStore.getFullData().then((data) => reconcileProfileData(profileId, data));

      return {
        id: profileId,
        ...profileData
      };
    });

    return (await Promise.all(promises)).filter((profile) => profile !== null);
  } catch (error) {
    console.error("Error reading profiles directory:", error);
    return [];
  }
}
