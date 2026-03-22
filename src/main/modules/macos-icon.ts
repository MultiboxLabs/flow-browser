/**
 * macOS-specific icon helpers using objc-js + objcjs-types.
 *
 * Handles persistent icon changes across Dock, Finder, Spotlight, and Launchpad
 * using native macOS APIs — following the approach documented by Granola:
 * https://www.granola.ai/blog/so-you-think-its-easy-to-change-an-app-icon
 */

import { app } from "electron";
import path from "path";
import fs from "fs";
import { NSApplication, NSImage, NSImageView, NSWorkspace } from "objcjs-types/AppKit";
import { NSDistributedNotificationCenter } from "objcjs-types/Foundation";
import { NSStringFromString } from "objcjs-types/helpers";
import { debugError, debugPrint } from "@/modules/output";
import { FLOW_DATA_DIR } from "@/modules/paths";
import { NSClassFromString } from "objcjs-types/Foundation/functions";

// ---------------------------------------------------------------------------
// Shared-file path for DockTilePlugin communication
// ---------------------------------------------------------------------------

const SHARED_DIR = FLOW_DATA_DIR;
const SHARED_FILE = path.join(SHARED_DIR, "dock-tile-icon-path");
const DOCK_TILE_UPDATE_NOTIFICATION = "dev.iamevan.flow.dock-tile.update";

// ---------------------------------------------------------------------------
// App-bundle path resolution
// ---------------------------------------------------------------------------

/**
 * Walk up from `app.getAppPath()` to the nearest `.app` directory.
 * Returns `null` in dev mode (no `.app` wrapper).
 */
export function getAppBundlePath(): string | null {
  let current = app.getAppPath();
  while (current !== "/" && current !== ".") {
    if (current.endsWith(".app")) {
      return current;
    }
    current = path.dirname(current);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Finder / Spotlight / Launchpad icon
// ---------------------------------------------------------------------------

/**
 * Set a custom icon on the `.app` bundle so Finder, Spotlight, and Launchpad
 * display it.
 */
export function setFinderIcon(pngPath: string, appBundlePath: string): boolean {
  try {
    const nsPath = NSStringFromString(pngPath);

    const image = NSImage.alloc().initWithContentsOfFile$(nsPath);
    if (!image) {
      debugError("ICONS", "macOS: failed to load NSImage from", pngPath);
      return false;
    }

    const bundleNSPath = NSStringFromString(appBundlePath);

    const ok = NSWorkspace.sharedWorkspace().setIcon$forFile$options$(image, bundleNSPath, 0);
    debugPrint("ICONS", `macOS: setIcon on bundle → ${ok}`);
    return !!ok;
  } catch (err) {
    debugError("ICONS", "macOS: setFinderIcon failed:", err);
    return false;
  }
}

/**
 * Clear the custom icon from the `.app` bundle so macOS falls back to the
 * native Liquid Glass icon in `Assets.car`.
 */
export function clearFinderIcon(appBundlePath: string): boolean {
  try {
    const bundleNSPath = NSStringFromString(appBundlePath);
    const ok = NSWorkspace.sharedWorkspace().setIcon$forFile$options$(null, bundleNSPath, 0);
    debugPrint("ICONS", `macOS: clearFinderIcon on bundle → ${ok}`);
    return !!ok;
  } catch (err) {
    debugError("ICONS", "macOS: clearFinderIcon failed:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Running Dock icon (via NSApplication)
// ---------------------------------------------------------------------------

/**
 * Set the running app's Dock tile to a custom image.
 */
export function setDockIcon(pngPath: string): boolean {
  try {
    const nsPath = NSStringFromString(pngPath);

    const image = NSImage.alloc().initWithContentsOfFile$(nsPath);
    if (!image) {
      debugError("ICONS", "macOS: failed to load NSImage for dock icon from", pngPath);
      return false;
    }

    const dockTile = NSApplication.sharedApplication().dockTile();

    // Set the dock tile's content view for crisp rendering
    const imageView = NSImageView.imageViewWithImage$(image);

    dockTile.setContentView$(imageView);

    dockTile.display();

    debugPrint("ICONS", "macOS: dock icon set via NSApplication");
    return true;
  } catch (err) {
    debugError("ICONS", "macOS: setDockIcon failed:", err);
    return false;
  }
}

/**
 * Reset the running Dock icon to the default bundle icon (Liquid Glass).
 * This clears the content view and reloads the icon from bundle resources.
 */
export function resetDockIconToDefault(): boolean {
  try {
    const dockTile = NSApplication.sharedApplication().dockTile();

    // For reset, we can't easily animate since we're removing the view
    // The bundle icon will appear immediately after clearing

    // Clear the dock tile content view so the bundle icon renders
    dockTile.setContentView$(null);

    dockTile.display();

    // Also clear the application icon image to force reload from bundle
    NSApplication.sharedApplication().setApplicationIconImage$(null);

    debugPrint("ICONS", "macOS: resetDockIconToDefault complete");
    return true;
  } catch (err) {
    debugError("ICONS", "macOS: resetDockIconToDefault failed:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Dock cache invalidation (private SkyLight API)
// ---------------------------------------------------------------------------

/**
 * Force the Dock to flush its icon cache using the private
 * `SLSIconAppearanceConfiguration` API. This avoids `killall Dock`.
 *
 * Accessed via `NSClassFromString` since it's in the private SkyLight framework.
 */
export function invalidateDockCache(): boolean {
  try {
    const clsName = NSStringFromString("SLSIconAppearanceConfiguration");
    const cls = NSClassFromString(clsName);
    if (!cls) {
      debugPrint("ICONS", "macOS: SLSIconAppearanceConfiguration not available — skipping cache invalidation");
      return false;
    }

    const config = cls.fetchCurrentIconAppearanceConfiguration();
    if (!config) {
      debugPrint("ICONS", "macOS: fetchCurrentIconAppearanceConfiguration returned nil");
      return false;
    }

    config.save();
    debugPrint("ICONS", "macOS: Dock cache invalidated via SLSIconAppearanceConfiguration");
    return true;
  } catch (err) {
    debugError("ICONS", "macOS: invalidateDockCache failed:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Shared file (DockTilePlugin communication)
// ---------------------------------------------------------------------------

/**
 * Write (or clear) the icon path that the NSDockTilePlugIn reads.
 *
 * - `iconPath` = absolute path to a PNG → plugin shows that icon
 * - `iconPath` = null → plugin shows default (Liquid Glass)
 */
export function writeIconChoiceToSharedFile(iconPath: string | null): void {
  try {
    fs.mkdirSync(SHARED_DIR, { recursive: true });

    if (iconPath) {
      fs.writeFileSync(SHARED_FILE, iconPath, "utf-8");
      debugPrint("ICONS", "macOS: wrote shared file →", iconPath);
    } else {
      // Empty file = default icon
      if (fs.existsSync(SHARED_FILE)) {
        fs.unlinkSync(SHARED_FILE);
      }
      debugPrint("ICONS", "macOS: cleared shared file");
    }
  } catch (err) {
    debugError("ICONS", "macOS: writeIconChoiceToSharedFile failed:", err);
  }
}

/**
 * Ask the DockTile plugin to reload the shared icon state immediately.
 */
export function notifyDockTilePluginUpdate(): void {
  try {
    NSDistributedNotificationCenter.defaultCenter().postNotificationName$object$userInfo$deliverImmediately$(
      NSStringFromString(DOCK_TILE_UPDATE_NOTIFICATION),
      null,
      null,
      true
    );
    debugPrint("ICONS", "macOS: posted Dock tile update notification");
  } catch (err) {
    debugError("ICONS", "macOS: failed to post Dock tile update notification:", err);
  }
}
