/* eslint-disable @typescript-eslint/no-explicit-any */

/// Imports ///
import { readFileSync, writeFileSync } from "fs";
import path from "path";

/// Types ///
type PackageJSON = {
  devDependencies: {
    electron: string;
  };
};

type BunLock = {
  workspaces: {
    [""]: {
      devDependencies: {
        electron: string;
      };
    };
  };
  packages: {
    electron: any[];
  };
};

/// Utilities ///

/**
 * Remove trailing commas from JSON string to make it parseable by JSON.parse()
 * Handles commas before closing brackets ] and braces }
 */
function stripTrailingCommas(jsonString: string): string {
  return jsonString.replace(/,(\s*[}\]])/g, "$1");
}

/// Config ///
const electronVersion = "35.3.0";

const rootDir = ".";
const packageJsonPath = path.join(rootDir, "package.json");
const bunLockPath = path.join(rootDir, "bun.lock");

/// package.json ///

// Grab package.json
const packageJSONString = readFileSync(packageJsonPath, "utf8");
const packageJSON = JSON.parse(packageJSONString) as PackageJSON;

// Change Electron Version
packageJSON["devDependencies"]["electron"] = electronVersion;

// Write package.json
writeFileSync(packageJsonPath, JSON.stringify(packageJSON, null, 2));

/// bun.lock ///

// Grab bun.lock
const bunLockString = readFileSync(bunLockPath, "utf8");
const bunLock = JSON.parse(stripTrailingCommas(bunLockString)) as BunLock;

// Change Electron Version
bunLock["workspaces"][""]["devDependencies"]["electron"] = electronVersion;

bunLock["packages"]["electron"][0] = `electron@${electronVersion}`;
bunLock["packages"]["electron"].splice(1, 0, "");
bunLock["packages"]["electron"][3] = "";

// Write bun.lock
writeFileSync(bunLockPath, JSON.stringify(bunLock, null, 2));
