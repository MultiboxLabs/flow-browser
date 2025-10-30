import { getExtensionIcon } from "@/modules/extensions/management";
import { loadedProfilesController } from "@/controllers/loaded-profiles-controller";
import { HonoApp } from ".";
import { bufferToArrayBuffer } from "@/modules/utils";

export function registerExtensionIconRoutes(app: HonoApp) {
  app.get("/extension-icon", async (c) => {
    const extensionId = c.req.query("id");
    const profileId = c.req.query("profile");

    if (!extensionId || !profileId) {
      return c.text("Missing arguments", 400);
    }

    const loadedProfile = loadedProfilesController.get(profileId);
    if (!loadedProfile) {
      return c.text("No loaded profile found", 404);
    }

    const { extensionsManager } = loadedProfile;

    const extData = extensionsManager.getExtensionDataFromCache(extensionId);
    if (!extData) {
      return c.text("No extension data found", 404);
    }

    const extensionPath = await extensionsManager.getExtensionPath(extensionId, extData);
    if (!extensionPath) {
      return c.text("No extension path found", 404);
    }

    const icon = await getExtensionIcon(extensionPath);
    if (!icon) {
      return c.text("Extension icon not found", 404);
    }

    return c.body(bufferToArrayBuffer(icon.toPNG()), 200, { "Content-Type": "image/png" });
  });
}
