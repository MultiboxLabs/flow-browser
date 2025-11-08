import { signAppWithVMP } from "./components/castlabs-evs.js";
import { createNotarizationApiKeyFile } from "./components/notarization.js";
import { applyElectronFuses } from "./components/electron-fuses.js";
import { copyAssetsCar } from "./components/macos.js";

const vmpSignPlatforms = ["darwin"];

/** @type {(context: import("./types.js").PackContext) => void} */
export async function handler(context) {
  // Header
  console.log("\n---------");
  console.log("Executing afterPack hook");

  // Apply electron fuses
  await applyElectronFuses(context.appOutDir)
    .then(() => true)
    .catch(() => false);

  // macOS needs to add the Assets.car containing the Liquid Glass icon
  if (process.platform === "darwin") {
    await copyAssetsCar(context.appOutDir)
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

  // Footer
  console.log("---------\n");
}

export default handler;
