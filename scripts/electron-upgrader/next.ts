import { findLatestNextMajorVersion, getCommitHashForTag } from "./_modules/github";
import { incrementElectronUpdaterVersionConfiguration, updateBunLock, updatePackageJson } from "./_modules/updater";

// GRAB RELEASE FROM GITHUB //
const latestNextVersion = await findLatestNextMajorVersion();

if (!latestNextVersion) {
  throw new Error("No version found in next major version");
}

const commitHash = await getCommitHashForTag(latestNextVersion);

if (!commitHash) {
  throw new Error("No commit hash found");
}

console.log(`Latest version in next major version: ${latestNextVersion}`);
console.log(`Commit hash: ${commitHash}`);

// UPDATE PACKAGE.JSON //
updatePackageJson(latestNextVersion);

console.log("package.json updated!");

// UPDATE BUN.LOCK //
updateBunLock(latestNextVersion, commitHash);

console.log("bun.lock updated!");

// UPDATE ELECTRON UPDATER VERSION CONFIGURATION //
incrementElectronUpdaterVersionConfiguration();

console.log("Updater Version Configuration updated!");
