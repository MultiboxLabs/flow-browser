import { findLatestBetaMajorVersion, getCommitHashForTag } from "./github";
import { updateBunLock, updatePackageJson } from "./updater";

// GRAB RELEASE FROM GITHUB //
const latestBetaVersion = await findLatestBetaMajorVersion();

if (!latestBetaVersion) {
  throw new Error("No beta version found");
}

const commitHash = await getCommitHashForTag(latestBetaVersion);

if (!commitHash) {
  throw new Error("No commit hash found");
}

console.log(`Latest beta version: ${latestBetaVersion}`);
console.log(`Commit hash: ${commitHash}`);

// UPDATE PACKAGE.JSON //
updatePackageJson(latestBetaVersion);

console.log("package.json updated!");

// UPDATE BUN.LOCK //
updateBunLock(latestBetaVersion, commitHash);

console.log("bun.lock updated!");
