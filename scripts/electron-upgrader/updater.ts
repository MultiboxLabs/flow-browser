import * as fs from "fs";
import * as path from "path";
import * as jju from "jju";

const DEP_PREFIX = "github:castlabs/electron-releases#";
const HASH_PREFIX = "electron@git+ssh://github.com/castlabs/electron-releases#";

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

export function updateBunLock(electronVersion: string, commitHash: string) {
  const bunLockPath = path.join(process.cwd(), "bun.lock");

  // Read and parse bun.lock with jju to preserve formatting
  const bunLockContent = fs.readFileSync(bunLockPath, "utf8");
  const bunLock = jju.parse(bunLockContent);

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
    mode: "json",
    indent: 2
  });

  fs.writeFileSync(bunLockPath, updatedContent);
}
