import { spawnSync } from "node:child_process";
import { flipFuses, FuseVersion, FuseV1Options } from "@electron/fuses";

// Get the path to the electron binary
function getElectronPath(): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("electron");
}

const appPath = getElectronPath();

// Apply dev fuses
const result = await flipFuses(appPath, {
  version: FuseVersion.V1,
  [FuseV1Options.RunAsNode]: false,
  [FuseV1Options.EnableCookieEncryption]: true,
  // Differs from production: used for debugging
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: true,
  // Differs from production: used for debugging
  [FuseV1Options.EnableNodeCliInspectArguments]: true,
  // Differs from production: development runs the app from source, not asar archive
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
  // Differs from production: development runs the app from source, not asar archive
  [FuseV1Options.OnlyLoadAppFromAsar]: false,
  [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
  [FuseV1Options.GrantFileProtocolExtraPrivileges]: true
});
console.log("Dev fuses applied successfully:", result ? "true" : "false");

// Shows the current fuses (same as `bunx @electron/fuses read --app <appPath>`)
const read = spawnSync("bunx", ["@electron/fuses", "read", "--app", appPath], {
  stdio: "inherit"
});
if (read.status !== 0) {
  process.exit(read.status ?? 1);
}
