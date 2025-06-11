import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import path from "path";
import * as jju from "jju";
import { PackageJson } from "@/_types/package-json";

const rootDir = ".";
const packageJsonPath = path.join(rootDir, "package.json");
const backupPath = path.join(rootDir, "package.json.old");

export function changeName(newName: string) {
  // Grab package.json
  const packageJSONString = readFileSync(packageJsonPath, "utf8");
  let packageJSON: PackageJson;

  try {
    packageJSON = jju.parse(packageJSONString);
  } catch (error) {
    console.error("Error parsing package.json", error);
    process.exit(1);
  }

  // Change App Name
  packageJSON["productName"] = newName;

  // Save old package.json
  writeFileSync("package.json.old", packageJSONString);

  // Write package.json with preserved formatting
  const updatedContent = jju.update(packageJSONString, packageJSON, { mode: "json", indent: 2 });
  writeFileSync(packageJsonPath, updatedContent);

  console.log("Successfully changed app name to", newName);
}

export function revertName() {
  // Check if backup exists
  if (!existsSync(backupPath)) {
    console.error("No backup file found (package.json.old)");
    process.exit(1);
  }

  // Read the backup file
  const backupContent = readFileSync(backupPath, "utf8");

  // Restore the original package.json
  writeFileSync(packageJsonPath, backupContent);

  // Remove the backup file
  unlinkSync(backupPath);

  console.log("Successfully reverted package.json to original state");
}
