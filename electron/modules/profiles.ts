import { FLOW_DATA_DIR } from "./paths";
import path from "path";
import fs from "fs";

const PROFILES_DIR = path.join(FLOW_DATA_DIR, "Profiles");

export function getProfilePath(profileId: string): string {
  return path.join(PROFILES_DIR, profileId);
}

export function createProfile(profileName: string) {
  const profilePath = getProfilePath(profileName);
  fs.mkdirSync(profilePath, { recursive: true });
}

export function getProfiles() {
  return fs.readdirSync(PROFILES_DIR).map((profile) => ({
    id: profile,
    name: profile
  }));
}
