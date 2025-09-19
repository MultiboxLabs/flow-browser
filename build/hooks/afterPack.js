import { signAppWithVMP } from "./components/castlabs-evs.js";
import { createNotarizationApiKeyFile } from "./components/notarization.js";
import { copyAssetsCar } from "./components/macos.js";

const vmpSignPlatforms = ["darwin"];

// Set this to true if you're building for universal
const MACOS_IS_UNIVERSAL = true;

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

  // macOS needs to VMP-sign the app before signing it with Apple
  if (vmpSignPlatforms.includes(process.platform)) {
    let shouldSign = true;
    if (process.platform === "darwin" && MACOS_IS_UNIVERSAL) {
      const appOutDir = context.appOutDir;
      // Only sign the universal build, not the unmerged builds
      if (!appOutDir.endsWith("/mac-universal")) {
        shouldSign = false;
      }
    }

    if (shouldSign) {
      await signAppWithVMP(context.appOutDir)
        .then(() => true)
        .catch(() => false);
    }
  }

  // macOS needs to notarize the app with a path to APPLE_API_KEY
  if (process.platform === "darwin") {
    await createNotarizationApiKeyFile()
      .then(() => true)
      .catch(() => false);
  }

  // Footer
  console.log("---------\n");
}

export default handler;
