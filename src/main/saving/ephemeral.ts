// Ephemeral Data Store
// Store data such as Pending Update (for use after app restart)

import { getDatastore } from "./datastore";

const EphemeralDataStore = getDatastore("ephemeral");

export function markUpdateStarted(currentAppVersion: string) {
  EphemeralDataStore.set("appUpdatedFromVersion", currentAppVersion);
  return true;
}

export async function getVersionUpdatedFrom(): Promise<string | undefined> {
  const updatedFromVersion = await EphemeralDataStore.get<string>("appUpdatedFromVersion");
  if (updatedFromVersion !== undefined) {
    await EphemeralDataStore.remove("appUpdatedFromVersion");
  }
  if (typeof updatedFromVersion === "string") {
    return updatedFromVersion;
  }
  return undefined;
}
