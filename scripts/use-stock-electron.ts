/// Imports ///
import * as fs from "fs";
import * as path from "path";
import * as jju from "jju";
import { BunLock } from "@/_types/bun-lock";

/// Types ///
interface ScriptOptions {
  version?: string;
}

/// Utilities ///

/**
 * Extracts electron version from various dependency formats
 */
function extractElectronVersion(dependency: string): string | null {
  // Handle castlabs fork: "github:castlabs/electron-releases#v36.3.1+wvcus"
  const castlabsMatch = dependency.match(/github:castlabs\/electron-releases#v?([0-9]+\.[0-9]+\.[0-9]+)/);
  if (castlabsMatch) {
    return castlabsMatch[1];
  }

  // Handle standard npm versions: "^36.3.1" or "36.3.1"
  const npmMatch = dependency.match(/[\^~]?([0-9]+\.[0-9]+\.[0-9]+)/);
  if (npmMatch) {
    return npmMatch[1];
  }

  return null;
}

/**
 * Gets the current electron version from package.json
 */
function getCurrentElectronVersion(): string {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
  const packageJson = jju.parse(packageJsonContent);

  if (!packageJson.devDependencies?.electron) {
    throw new Error("❌ No electron dependency found in package.json devDependencies");
  }

  const currentDependency = packageJson.devDependencies.electron;
  const version = extractElectronVersion(currentDependency);

  if (!version) {
    throw new Error(`❌ Unable to parse electron version from: ${currentDependency}`);
  }

  return version;
}

/**
 * Updates the package.json file to set the electron dependency to the specified version
 */
function updatePackageJson(electronVersion: string) {
  const packageJsonPath = path.join(process.cwd(), "package.json");

  // Read and parse package.json with jju to preserve formatting and comments
  const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
  const packageJson = jju.parse(packageJsonContent);

  // Update the electron dependency to use standard npm version
  if (packageJson.devDependencies && packageJson.devDependencies.electron) {
    packageJson.devDependencies.electron = electronVersion;
  }

  // Write back to package.json with preserved formatting
  const updatedContent = jju.update(packageJsonContent, packageJson, {
    mode: "json",
    indent: 2
  });

  fs.writeFileSync(packageJsonPath, updatedContent);
}

/**
 * Updates the bun.lock file to set the electron dependency
 */
function updateBunLock(electronVersion: string) {
  const bunLockPath = path.join(process.cwd(), "bun.lock");

  // Read bun.lock content
  const bunLockContent = fs.readFileSync(bunLockPath, "utf8");

  // Parse with jju using JSON5 mode to handle trailing commas
  let bunLock: BunLock;
  try {
    bunLock = jju.parse(bunLockContent, {
      mode: "json5"
    });
  } catch (error) {
    console.error("Failed to parse bun.lock:", error);
    throw error;
  }

  // Update the workspace electron dependency (with null check to fix linter error)
  if (bunLock.workspaces && bunLock.workspaces[""] && bunLock.workspaces[""].devDependencies) {
    bunLock.workspaces[""].devDependencies.electron = electronVersion;
  }

  // Update the packages electron entry for standard npm electron
  if (bunLock.packages && bunLock.packages.electron) {
    const electronEntry = bunLock.packages.electron;
    electronEntry[0] = `electron@${electronVersion}`;
    electronEntry.splice(1, 0, "");
    electronEntry[3] = "";
  }

  // Write back to bun.lock with preserved formatting
  const updatedContent = jju.update(bunLockContent, bunLock, {
    mode: "json5",
    indent: 2
  });

  fs.writeFileSync(bunLockPath, updatedContent);
}

/**
 * Parse command line arguments
 */
function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--version" && i + 1 < args.length) {
      options.version = args[i + 1];
      i++; // Skip next argument as it's the version value
    }
  }

  return options;
}

/// Main Execution ///
async function main() {
  try {
    const options = parseArgs();
    let electronVersion: string;

    if (options.version) {
      electronVersion = options.version;
      console.log(`📌 Using specified version: ${electronVersion}`);
    } else {
      console.log("🔍 Reading current electron version from package.json...");
      const currentVersion = getCurrentElectronVersion();
      electronVersion = currentVersion;
      console.log(`✅ Found current version: ${electronVersion}`);
    }

    // Update package.json
    console.log("📝 Updating package.json...");
    updatePackageJson(electronVersion);
    console.log("✅ package.json updated!");

    // Update bun.lock
    console.log("🔒 Updating bun.lock...");
    updateBunLock(electronVersion);
    console.log("✅ bun.lock updated!");

    console.log(`🎉 Successfully updated Electron to standard npm version ${electronVersion}`);
    console.log("💡 Note: This switches from castlabs/electron-releases to standard electron");
    console.log("🔄 Run 'bun install' to apply the changes");
    console.log("");
    console.log("Usage:");
    console.log("  bun run script:use-stock-electron                 # Use current version");
    console.log("  bun run script:use-stock-electron --version X.Y.Z # Use specific version");
  } catch (error) {
    console.error("❌ Error updating Electron:", error);
    process.exit(1);
  }
}

// Execute the main function
main();
