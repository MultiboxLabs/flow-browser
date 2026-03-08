import { generateID } from "@/modules/utils";

const INCOGNITO_PROFILE_PREFIX = "incognito";

export function createIncognitoProfileId(): string {
  return `${INCOGNITO_PROFILE_PREFIX}-${generateID()}`;
}

export function isIncognitoProfileId(profileId: string): boolean {
  return profileId.startsWith(`${INCOGNITO_PROFILE_PREFIX}-`);
}
