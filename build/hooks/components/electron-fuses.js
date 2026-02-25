/** @type {import('@electron/fuses').FuseConfig} */
const fuseConfig = {
  version: FuseVersion.V1,
  [FuseV1Options.RunAsNode]: false,
  [FuseV1Options.EnableCookieEncryption]: true,
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
  [FuseV1Options.EnableNodeCliInspectArguments]: false,
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
  [FuseV1Options.OnlyLoadAppFromAsar]: true,
  [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
  [FuseV1Options.GrantFileProtocolExtraPrivileges]: true
};

import { flipFuses, FuseVersion, FuseV1Options } from "@electron/fuses";

import { promises as fs } from "fs";
import path from "path";

/** @type {(appOutDir: string) => Promise<void>} */
async function applyElectronFuses(appOutDir) {
  console.log("\nApplying electron fuses");

  // Find the .app folder in the appOutDir
  const files = await fs.readdir(appOutDir);
  const appFolder = files.find((file) => file.endsWith(".app"));
  if (!appFolder) {
    console.log("No .app folder found in appOutDir");
    return Promise.reject();
  }

  const electronPath = path.join(appOutDir, appFolder);
  console.log(`Applying fuses to ${electronPath}`);

  await flipFuses(electronPath, fuseConfig)
    .then(() => true)
    .catch(() => false);

  console.log("Fuses applied successfully");

  return Promise.resolve();
}

export { applyElectronFuses };
