const SW_START_DEBUG = false;

const SW_START_TIMEOUT_MS = 10000;
const SW_START_INTERVAL_MS = 1000 / 60;
const MAX_SW_START_TRIES = Math.ceil(SW_START_TIMEOUT_MS / SW_START_INTERVAL_MS);
async function tryStartServiceWorker(session: Electron.Session, extension: Electron.Extension) {
  if (extension.manifest.manifest_version === 3 && extension.manifest.background?.service_worker) {
    const extensionId = extension.id;
    const scope = `chrome-extension://${extensionId}`;
    return await session.serviceWorkers
      .startWorkerForScope(scope)
      .then(() => true)
      .catch(() => {
        if (SW_START_DEBUG) {
          console.error(`Failed to start worker for extension ${extensionId}`);
        }
        return false;
      });
  }
  // No service worker to start
  return true;
}
export async function startExtensionServiceWorker(session: Electron.Session, extension: Electron.Extension) {
  let tries = 0;
  while (tries < MAX_SW_START_TRIES) {
    tries++;
    const success = await tryStartServiceWorker(session, extension);
    if (success) {
      return { success: true, tries };
    }
    await new Promise((resolve) => setTimeout(resolve, SW_START_INTERVAL_MS));
  }
  return { success: false, tries };
}
