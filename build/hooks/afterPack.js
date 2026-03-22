import { signAppWithVMP } from "./components/castlabs-evs.js";
import { createNotarizationApiKeyFile } from "./components/notarization.js";
import { copyAssetsCar } from "./components/macos.js";
import { compileDockTilePlugin } from "./components/dock-tile-plugin.js";
import fs from "fs";
import path from "path";

const vmpSignPlatforms = ["darwin"];

/** @type {(context: import("./types.js").PackContext) => void} */
export async function handler(context) {
  // Header
  console.log("\n---------");
  console.log("Executing afterPack hook");

  // macOS needs to add the Assets.car containing the Liquid Glass icon
  if (process.platform === "darwin") {
    await copyAssetsCar(context.appOutDir)
      .then(() => true)
      .catch(() => false);
  }

  // macOS needs to compile and embed the NSDockTilePlugIn for persistent icons
  if (process.platform === "darwin") {
    await compileDockTilePlugin(context.appOutDir)
      .then(() => true)
      .catch(() => false);
  }

  // macOS needs to VMP-sign the app before signing it with Apple
  if (vmpSignPlatforms.includes(process.platform)) {
    await signAppWithVMP(context.appOutDir)
      .then(() => true)
      .catch(() => false);
  }

  // macOS needs to notarize the app with a path to APPLE_API_KEY
  if (process.platform === "darwin") {
    await createNotarizationApiKeyFile()
      .then(() => true)
      .catch(() => false);
  }

  // Non-macOS builds: strip the macOS-specific icon PNGs to reduce file size.
  // The macos-icons directory is only useful on darwin; remove its contents for
  // Windows and Linux targets.
  if (context.electronPlatformName !== "darwin") {
    const macosIconsDir = path.join(
      context.appOutDir,
      "resources",
      "app.asar.unpacked",
      "assets",
      "public",
      "macos-icons"
    );
    if (fs.existsSync(macosIconsDir)) {
      for (const file of fs.readdirSync(macosIconsDir)) {
        if (file.endsWith(".png")) {
          fs.unlinkSync(path.join(macosIconsDir, file));
        }
      }
      console.log("Removed macOS-specific icons from non-macOS build.");
    }
  }

  // Footer
  console.log("---------\n");
}

export default handler;
