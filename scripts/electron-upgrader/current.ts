import { findLatestCurrentMajorVersion, getCommitHashForTag } from "./_modules/github";
import { updateBunLock, updatePackageJson } from "./_modules/updater";

// GRAB RELEASE FROM GITHUB //
const latestCurrentVersion = await findLatestCurrentMajorVersion();

if (!latestCurrentVersion) {
  throw new Error("No version found in current major version");
}

const commitHash = await getCommitHashForTag(latestCurrentVersion);

if (!commitHash) {
  throw new Error("No commit hash found");
}

console.log(`Latest version in current major version: ${latestCurrentVersion}`);
console.log(`Commit hash: ${commitHash}`);

// UPDATE PACKAGE.JSON //
updatePackageJson(latestCurrentVersion);

console.log("package.json updated!");

// UPDATE BUN.LOCK //
updateBunLock(latestCurrentVersion, commitHash);

console.log("bun.lock updated!");
