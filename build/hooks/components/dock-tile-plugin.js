import path from "path";
import fs from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Compile the DockTilePlugIn.plugin bundle and place it in
 * the app's Contents/PlugIns/ directory.
 *
 * Uses `clang` (available on any Mac with Xcode Command Line Tools) to
 * build a universal (x86_64 + arm64) plugin bundle.
 *
 * @param {string} appOutDir - The output directory containing the .app
 */
export async function compileDockTilePlugin(appOutDir) {
  console.log("\nCompiling FlowDockTilePlugin");

  const dirname = process.cwd();

  // Locate the .app bundle
  const appContents = await fs.readdir(appOutDir);
  const appName = appContents.find((item) => item.endsWith(".app"));
  if (!appName) {
    console.log("No .app directory found in appOutDir, skipping DockTilePlugin compilation");
    return;
  }
  const appPath = path.join(appOutDir, appName);

  // Source paths
  const sourceFile = path.join(dirname, "build", "dock-tile-plugin", "FlowDockTilePlugin.m");
  const infoPlist = path.join(dirname, "build", "dock-tile-plugin", "Info.plist");

  // Target bundle structure
  const pluginsDir = path.join(appPath, "Contents", "PlugIns");
  const bundleDir = path.join(pluginsDir, "DockTilePlugIn.plugin");
  const contentsDir = path.join(bundleDir, "Contents");
  const macosDir = path.join(contentsDir, "MacOS");
  const targetPlist = path.join(contentsDir, "Info.plist");
  const targetBinary = path.join(macosDir, "DockTilePlugin");

  // Create the bundle directory structure
  await fs.mkdir(macosDir, { recursive: true });

  // Copy Info.plist into the bundle
  await fs.copyFile(infoPlist, targetPlist);
  console.log(`Copied Info.plist to ${targetPlist}`);

  // Compile the Objective-C source into a universal binary
  // -bundle: produce a loadable bundle (not an executable)
  // -framework Cocoa: link against Cocoa (NSImage, NSImageView, NSDockTile, etc.)
  // -arch x86_64 -arch arm64: universal binary
  // -fobjc-arc: use ARC
  const clangArgs = [
    "-bundle",
    "-framework",
    "Cocoa",
    "-arch",
    "x86_64",
    "-arch",
    "arm64",
    "-fobjc-arc",
    "-mmacosx-version-min=10.15",
    "-o",
    targetBinary,
    sourceFile
  ];

  console.log(`Compiling: clang ${clangArgs.join(" ")}`);

  try {
    const { stdout, stderr } = await execFileAsync("clang", clangArgs);
    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);
    console.log(`Successfully compiled FlowDockTilePlugin to ${targetBinary}`);
  } catch (error) {
    console.error(`Failed to compile FlowDockTilePlugin: ${error.message}`);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}
