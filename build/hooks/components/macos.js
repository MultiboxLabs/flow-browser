import path from "path";
import fs from "fs/promises";

/** @type {(appOutDir: string) => Promise<void>} */
export async function copyAssetsCar(appOutDir) {
  console.log("\nCopying Assets.car file for macOS");

  // Get the directory of the current project
  const dirname = process.cwd();

  // Get the path to the app by finding the first directory that ends with `.app`
  const appContents = await fs.readdir(appOutDir);
  const appName = appContents.find((item) => item.endsWith(".app"));
  if (!appName) {
    console.log("No .app directory found in appOutDir, skipping Assets.car copy");
    return;
  }
  const appPath = path.join(appOutDir, appName);

  // Craft the source and target paths
  const sourcePath = path.join(dirname, "build", "Assets.car");
  const targetPath = path.join(appPath, "Contents", "Resources", "Assets.car");

  // Log for debugging
  console.log(`Source path: ${sourcePath}`);
  console.log(`Target path: ${targetPath}`);

  // Copy the file from the source to the target
  try {
    await fs.copyFile(sourcePath, targetPath);
    console.log(`Successfully copied Assets.car to ${targetPath}`);
  } catch (error) {
    console.error(`Failed to copy Assets.car: ${error.message}`);
    throw error;
  }
}
