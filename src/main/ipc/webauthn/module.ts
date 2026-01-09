// Dynamically load electron-webauthn
type WebauthnModule = typeof import("electron-webauthn");
let webauthnModule: WebauthnModule | null = null;
let webauthnModulePromise: Promise<WebauthnModule | null> | null = null;

export async function getWebauthnAddon(): Promise<WebauthnModule | null> {
  // This addon is only available on macOS
  if (process.platform !== "darwin") {
    return null;
  }

  // If module is already loaded, return it immediately
  if (webauthnModule) {
    return webauthnModule;
  }

  // If import is in progress, await the existing promise
  if (webauthnModulePromise) {
    return webauthnModulePromise;
  }

  // Start the import and cache the promise
  webauthnModulePromise = (async () => {
    try {
      const module = await import("electron-webauthn");
      webauthnModule = module;
      return module;
    } catch (error) {
      // Clear the promise cache on failure so subsequent calls can retry
      console.error("Failed to load electron-webauthn:", error);
      return null;
    } finally {
      webauthnModulePromise = null;
    }
  })();

  return webauthnModulePromise;
}
