import * as fs from "fs";
import * as path from "path";
import * as jju from "jju";

const DEP_PREFIX = "github:castlabs/electron-releases#";
const HASH_PREFIX = "electron@git+ssh://github.com/castlabs/electron-releases#";

/**
 * Updates the package.json file to set the electron dependency to use the specified version
 * from the castlabs/electron-releases repository.
 *
 * @param {string} electronVersion - The electron version to update to (e.g., "v36.4.0+wvcus")
 * @throws {Error} Throws an error if the package.json file cannot be read or written
 * @example
 * updatePackageJson("v36.4.0+wvcus");
 * // Updates package.json electron dependency to "github:castlabs/electron-releases#v36.4.0+wvcus"
 */
export function updatePackageJson(electronVersion: string) {
  const packageJsonPath = path.join(process.cwd(), "package.json");

  // Read and parse package.json with jju to preserve formatting and comments
  const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
  const packageJson = jju.parse(packageJsonContent);

  // Update the electron dependency
  if (packageJson.devDependencies && packageJson.devDependencies.electron) {
    packageJson.devDependencies.electron = `${DEP_PREFIX}${electronVersion}`;
  }

  // Write back to package.json with preserved formatting
  const updatedContent = jju.update(packageJsonContent, packageJson, {
    mode: "json",
    indent: 2
  });

  fs.writeFileSync(packageJsonPath, updatedContent);
}

/**
 * Updates the bun.lock file to set the electron dependency and package entry to use the specified
 * version and commit hash from the castlabs/electron-releases repository.
 *
 * This function updates two parts of the bun.lock file:
 * 1. The workspace electron dependency in devDependencies
 * 2. The packages electron entry with the new git URL and commit hash
 *
 * @param {string} electronVersion - The electron version to update to (e.g., "v36.4.0+wvcus")
 * @param {string} commitHash - The git commit hash corresponding to the electron version
 * @throws {Error} Throws an error if the bun.lock file cannot be read, parsed, or written
 * @example
 * updateBunLock("v36.4.0+wvcus", "cc2b16d4c0e43cfd4e20da691a017606cc226f5f");
 * // Updates bun.lock with new electron version and commit hash
 */
export function updateBunLock(electronVersion: string, commitHash: string) {
  const bunLockPath = path.join(process.cwd(), "bun.lock");

  // Read bun.lock content
  const bunLockContent = fs.readFileSync(bunLockPath, "utf8");

  // Parse with jju using a more lenient mode
  let bunLock;
  try {
    bunLock = jju.parse(bunLockContent, {
      mode: "json5" // Use JSON5 mode to handle trailing commas
    });
  } catch (error) {
    console.error("Failed to parse bun.lock:", error);
    throw error;
  }

  // Update the workspace electron dependency
  if (bunLock.workspaces && bunLock.workspaces[""] && bunLock.workspaces[""].devDependencies) {
    bunLock.workspaces[""].devDependencies.electron = `${DEP_PREFIX}${electronVersion}`;
  }

  // Update the packages electron entry
  if (bunLock.packages && bunLock.packages.electron) {
    const electronEntry = bunLock.packages.electron;
    // Update the git URL in the electron package entry
    electronEntry[0] = `${HASH_PREFIX}${commitHash}`;
    // Update the commit hash at the end
    electronEntry[2] = commitHash;
  }

  // Write back to bun.lock with preserved formatting
  const updatedContent = jju.update(bunLockContent, bunLock, {
    mode: "json5",
    indent: 2
  });

  fs.writeFileSync(bunLockPath, updatedContent);
}
