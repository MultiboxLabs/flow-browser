import { findLatestStableMajorVersion, getCommitHashForTag } from "./github";
import { updateBunLock, updatePackageJson } from "./updater";

// GRAB RELEASE FROM GITHUB //
const latestStableVersion = await findLatestStableMajorVersion();

if (!latestStableVersion) {
  throw new Error("No stable version found");
}

const commitHash = await getCommitHashForTag(latestStableVersion);

if (!commitHash) {
  throw new Error("No commit hash found");
}

console.log(`Latest stable version: ${latestStableVersion}`);
console.log(`Commit hash: ${commitHash}`);

// UPDATE PACKAGE.JSON //
updatePackageJson(latestStableVersion);

console.log("package.json updated!");

// UPDATE BUN.LOCK //
updateBunLock(latestStableVersion, commitHash);

console.log("bun.lock updated!");
