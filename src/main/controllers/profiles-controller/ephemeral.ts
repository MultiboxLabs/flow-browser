import { profilesController } from "@/controllers/profiles-controller";

/**
 * Removes stale ephemeral profiles from disk (e.g. after an app crash or force quit).
 * A profile is considered stale if it has ephemeral: true.
 * Should run once during startup before windows are created.
 */
export async function cleanupStaleEphemeralProfiles() {
  const profiles = await profilesController.getAll();
  const staleProfileIds = profiles.filter((profile) => profile.ephemeral).map((profile) => profile.id);

  const cleanupPromises = staleProfileIds.map(async (profileId) => {
    await profilesController.delete(profileId);
  });
  await Promise.all(cleanupPromises);
}
