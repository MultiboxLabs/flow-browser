import { loadedProfilesController } from "@/controllers/loaded-profiles-controller";
import { tabPersistenceManager } from "@/saving/tabs";
import { sleep } from "@/modules/utils";

async function flushSessionsData() {
  const promises: Promise<void>[] = [];

  const loadedProfileSessions = loadedProfilesController.loadedProfileSessions;

  for (const session of loadedProfileSessions) {
    // Flush storage data
    session.flushStorageData();

    // Flush cookies
    const cookies = session.cookies;
    promises.push(cookies.flushStore());
  }

  console.log("Flushed data for", loadedProfileSessions.size, "sessions");

  await Promise.all(promises);
  await sleep(50);

  return true;
}

// Insert Logic here to handle before the app quits
// If the handler returns true, the app will quit normally
// If the handler returns false, the quit will be cancelled
export function beforeQuit(): boolean | Promise<boolean> {
  // Flush all pending tab saves before quitting
  const flushTabsPromise = tabPersistenceManager
    .stop()
    .then(() => true)
    .catch(() => true);

  const flushSessionsDataPromise = flushSessionsData()
    .then(() => true)
    .catch(() => true);

  return Promise.all([flushTabsPromise, flushSessionsDataPromise]).then((results) => {
    return results.every((result) => result);
  });
}
