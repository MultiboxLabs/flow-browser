import { FLOW_DATA_DIR } from "./paths";
import path from "path";
import fs from "fs";

const PROFILES_DIR = path.join(FLOW_DATA_DIR, "Profiles");

export function getProfilePath(profileId: string): string {
  return path.join(PROFILES_DIR, profileId);
}

export function createProfile(profileName: string) {
  try {
    const profilePath = getProfilePath(profileName);
    fs.mkdirSync(profilePath, { recursive: true });
    return true;
  } catch (error) {
    console.error(`Error creating profile ${profileName}:`, error);
    return false;
  }
}

export function getProfiles() {
  try {
    // Check if directory exists first
    if (!fs.existsSync(PROFILES_DIR)) {
      fs.mkdirSync(PROFILES_DIR, { recursive: true });
      return [];
    }
    
    return fs.readdirSync(PROFILES_DIR).map((profile) => ({
      id: profile,
      name: profile
    }));
  } catch (error) {
    console.error("Error reading profiles directory:", error);
    return [];
  }
}
