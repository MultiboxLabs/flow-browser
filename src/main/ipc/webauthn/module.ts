// Dynamically load electron-webauthn
type WebauthnModule = typeof import("electron-webauthn");
let webauthnModule: WebauthnModule | null = null;

export async function getWebauthnAddon(): Promise<WebauthnModule | null> {
  // This addon is only available on macOS
  if (process.platform !== "darwin") {
    return null;
  }

  if (!webauthnModule) {
    webauthnModule = await import("electron-webauthn");
  }
  return webauthnModule;
}
