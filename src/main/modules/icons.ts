import { app, NativeImage, nativeImage } from "electron";
import path from "path";
import { PATHS } from "./paths";
import { FLOW_DATA_DIR } from "./paths";
import fs from "fs";
import sharp from "sharp";
import { type } from "arktype";
import { SettingsDataStore } from "@/saving/settings";
import { debugError, debugPrint } from "@/modules/output";
import { windowsController } from "@/controllers/windows-controller";

// Lazily-loaded macOS-specific helpers (only used on darwin).
// Uses dynamic import() so Vite resolves the @/ alias and bundles the module.
// Typed as `any` because objc-js is a macOS-only native addon that doesn't
// install on Linux, so we cannot reference the module's types at compile time.
let _macosIcon: typeof import("@/modules/macos-icon") | null = null;
async function getMacosIcon() {
  if (process.platform !== "darwin") return null;
  if (!_macosIcon) {
    _macosIcon = await import("@/modules/macos-icon");
  }
  return _macosIcon;
}

export const supportedPlatforms: NodeJS.Platform[] = [
  // macOS: persistent icons via NSWorkspace + NSDockTilePlugIn
  "darwin",

  // Linux: through BrowserWindow.setIcon()
  "linux"
  // No support for Windows or other platforms
];
const iconsDirectory = path.join(PATHS.ASSETS, "public", process.platform === "darwin" ? "macos-icons" : "icons");

// Persistent icon directory — transformed PNGs saved here for macOS Finder/Dock
const persistentIconsDir = path.join(FLOW_DATA_DIR, "icons");

type IconData = {
  id: string;
  name: string;
  image_id: string | null;
  author?: string;
};

export const icons = [
  {
    id: "default",
    name: "Default",
    image_id: "default.png"
  },
  {
    id: "nature",
    name: "Nature",
    image_id: "nature.png"
  },
  {
    id: "3d",
    name: "3D",
    image_id: "3d.png"
  },
  {
    id: "darkness",
    name: "Darkness",
    image_id: "darkness.png"
  },
  {
    id: "glowy",
    name: "Glowy",
    image_id: "glowy.png"
  },
  {
    id: "minimal_flat",
    name: "Minimal Flat",
    image_id: "minimal_flat.png"
  },
  {
    id: "retro",
    name: "Retro",
    image_id: "retro.png"
  },
  {
    id: "summer",
    name: "Summer",
    image_id: "summer.png"
  },
  {
    id: "aquatic",
    name: "Aquatic",
    image_id: "aquatic.png",
    author: "CK4C"
  },
  {
    id: "digital",
    name: "Digital",
    image_id: "digital.png",
    author: "CK4C"
  },
  {
    id: "dynamic",
    name: "Dynamic",
    image_id: "dynamic.png",
    author: "CK4C"
  },
  {
    id: "futuristic",
    name: "Futuristic",
    image_id: "futuristic.png",
    author: "CK4C"
  },
  {
    id: "galactic",
    name: "Galactic",
    image_id: "galactic.png",
    author: "CK4C"
  },
  {
    id: "vibrant",
    name: "Vibrant",
    image_id: "vibrant.png",
    author: "CK4C"
  }
] as const satisfies IconData[];

// macOS-specific icon set — served from assets/public/macos-icons/.
// "default" has no image_id; selecting it resets to the Liquid Glass system icon.
export const macOsIcons = [
  {
    id: "default",
    name: "Default",
    image_id: "default.png"
  },
  {
    id: "darkness",
    name: "Darkness",
    image_id: "darkness.png"
  },
  {
    id: "glowy",
    name: "Glowy",
    image_id: "glowy.png"
  },
  {
    id: "minimal_flat",
    name: "Minimal Flat",
    image_id: "minimal_flat.png"
  },
  {
    id: "nature",
    name: "Nature",
    image_id: "nature.png"
  },
  {
    id: "summer",
    name: "Summer",
    image_id: "summer.png"
  },
  {
    id: "candy",
    name: "Candy",
    image_id: "candy.png"
  }
] as const satisfies IconData[];

/** Returns the platform-appropriate icon list. */
export function getIcons() {
  return process.platform === "darwin" ? macOsIcons : icons;
}

export type MacOsIconId = (typeof macOsIcons)[number]["id"];
export type IconId = (typeof icons)[number]["id"] | MacOsIconId;

const iconIds = icons.map((icon) => icon.id);
const macOsIconIds = macOsIcons.map((icon) => icon.id);
const IconIdSchema = type.enumerated(...iconIds, ...macOsIconIds);

async function transformAppIcon(imagePath: string): Promise<Buffer> {
  debugPrint("ICONS", "Transforming app icon:", imagePath);
  try {
    // Read the image file
    const inputBuffer = fs.readFileSync(imagePath);

    // Pre-rendered Liquid Glass icons for macOS, do not need transforming
    if (process.platform === "darwin") {
      debugPrint("ICONS", "Skipping transformation for pre-rendered Liquid Glass icon.");
      return inputBuffer;
    }

    // Size constants
    const totalSize = 1024;
    const padding = 100;
    const artSize = totalSize - padding * 2; // 824
    const cornerRadius = Math.round(0.22 * artSize); // ~185px

    // Create a new image with padding
    const outputBuffer = await sharp(inputBuffer)
      .resize(artSize, artSize)
      .composite([
        {
          // Create rounded corners by using a mask
          input: Buffer.from(
            `<svg width="${artSize}" height="${artSize}">
            <rect x="0" y="0" width="${artSize}" height="${artSize}" rx="${cornerRadius}" ry="${cornerRadius}" fill="white"/>
          </svg>`
          ),
          blend: "dest-in"
        }
      ])
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    debugPrint("ICONS", "App icon transformed successfully.");
    return outputBuffer;
  } catch (error) {
    debugError("ICONS", "Error transforming app icon:", imagePath, error);
    throw error; // Re-throw the error after logging
  }
}

/**
 * Save a transformed icon buffer to disk so the DockTilePlugin and
 * NSWorkspace can reference it by absolute path.
 */
function savePersistentIcon(iconId: string, buffer: Buffer): string {
  fs.mkdirSync(persistentIconsDir, { recursive: true });
  const outPath = path.join(persistentIconsDir, `${iconId}.png`);
  fs.writeFileSync(outPath, buffer);
  debugPrint("ICONS", "Saved persistent icon to:", outPath);
  return outPath;
}

function generateIconPath(iconId: string) {
  const imagePath = path.join(iconsDirectory, `${iconId}.png`);
  debugPrint("ICONS", "Generated icon path:", imagePath);
  return imagePath;
}

let currentIcon: NativeImage | null = null;

function updateAppIcon() {
  debugPrint("ICONS", `Updating app icon for platform: ${process.platform}`);

  if (process.platform === "darwin") {
    // macOS dock icon is managed via NSDockTile (mac.setDockIcon) — no-op here.
    return;
  } else if (process.platform === "linux") {
    if (!currentIcon) {
      debugPrint("ICONS", "No current icon set, skipping update.");
      return;
    }
    const windows = windowsController.getAllWindows();
    debugPrint("ICONS", `Updating icon for ${windows.length} windows on Linux.`);
    for (const window of windows) {
      window.browserWindow.setIcon(currentIcon);
    }
  } else {
    debugPrint("ICONS", "Platform not supported for icon update, skipping.");
  }
}

// ---------------------------------------------------------------------------
// macOS: reset to default (Liquid Glass)
// ---------------------------------------------------------------------------

async function resetToDefaultMacOS(): Promise<boolean> {
  const mac = await getMacosIcon();
  if (!mac) return false;

  debugPrint("ICONS", "macOS: resetting to default (Liquid Glass)");

  // 1. Reset the running app's dock icon to the bundle icon
  mac.resetAppIconImage();

  // 2. Clear the Finder/Spotlight icon on the .app bundle
  const bundlePath = mac.getAppBundlePath();
  if (bundlePath) {
    mac.clearFinderIcon(bundlePath);
  }

  // 3. Invalidate the Dock's icon cache
  mac.invalidateDockCache();

  // 4. Clear the shared file so the DockTilePlugin uses default
  mac.writeIconChoiceToSharedFile(null);

  // 5. Clear the in-memory NativeImage — nothing to push to windows
  currentIcon = null;

  debugPrint("ICONS", "macOS: reset to default complete");
  return true;
}

// ---------------------------------------------------------------------------
// macOS: set a custom icon persistently
// ---------------------------------------------------------------------------

async function setCustomIconMacOS(iconId: string, imgBuffer: Buffer): Promise<boolean> {
  const mac = await getMacosIcon();
  if (!mac) return false;

  debugPrint("ICONS", "macOS: setting custom icon persistently:", iconId);

  // 1. Save transformed PNG to a persistent location
  const savedPath = savePersistentIcon(iconId, imgBuffer);

  // 2. Set the Finder/Spotlight/Launchpad icon on the .app bundle
  const bundlePath = mac.getAppBundlePath();
  if (bundlePath) {
    mac.setFinderIcon(savedPath, bundlePath);
  }

  // 3. Set the dock tile content view for crisp rendering
  mac.setDockIcon(savedPath);

  // 4. Write to shared file so DockTilePlugin can show it when app isn't running
  mac.writeIconChoiceToSharedFile(savedPath);

  // 5. Invalidate the Dock's icon cache so changes are reflected immediately
  mac.invalidateDockCache();

  debugPrint("ICONS", "macOS: custom icon set complete:", iconId);
  return true;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function setAppIcon(iconId: string) {
  debugPrint("ICONS", "Attempting to set app icon to:", iconId);

  if (!supportedPlatforms.includes(process.platform)) {
    debugPrint("ICONS", `Platform ${process.platform} not supported for setting app icon.`);
    return false;
  }

  // macOS: "default" means restore Liquid Glass — do NOT transform or set anything
  if (process.platform === "darwin" && iconId === "default") {
    return resetToDefaultMacOS();
  }

  const imagePath = generateIconPath(iconId);

  if (!fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) {
    debugError("ICONS", `Icon image not found or not a file: ${imagePath}`);
    throw new Error(`Icon image not found: ${imagePath}`);
  }

  try {
    // Use the transformed icon
    const imgBuffer = await transformAppIcon(imagePath);

    // macOS: full persistent icon flow
    if (process.platform === "darwin") {
      return setCustomIconMacOS(iconId, imgBuffer);
    }

    // Linux: in-memory NativeImage only
    const img = nativeImage.createFromBuffer(imgBuffer);
    currentIcon = img;
    debugPrint("ICONS", "Successfully created NativeImage from buffer.");
    updateAppIcon();
    debugPrint("ICONS", "App icon set successfully to:", iconId);
    return true;
  } catch (error) {
    debugError("ICONS", "Failed to set app icon:", iconId, error);
    return false;
  }
}

// Defer initial icon setup until the app is ready.
// Previously, setAppIcon("default") ran at import time, invoking sharp (which
// uses libuv thread-pool workers). On Linux AppImage this could exhaust the
// default 4-thread pool before the onboarding check's SettingsDataStore.get()
// had a chance to run its fs operations, causing the app to stall at startup.
app.whenReady().then(async () => {
  debugPrint("ICONS", "App ready, setting initial icon and caching current icon.");

  // On macOS, skip the initial setAppIcon("default") — Liquid Glass works
  // automatically from Assets.car without any intervention.
  if (process.platform !== "darwin") {
    await setAppIcon("default").catch((error) => {
      debugError("ICONS", "Failed initial setAppIcon call:", error);
    });
  }

  await cacheCurrentIcon();
  updateAppIcon();
});

windowsController.on("window-added", (id) => {
  debugPrint("ICONS", `Window added (ID: ${id}), ensuring icon is updated.`);
  updateAppIcon();
});

// Settings: Current Icon //
let currentIconId: IconId = "default";

async function cacheCurrentIcon() {
  debugPrint("ICONS", "Caching current icon from settings.");
  try {
    const iconId = await SettingsDataStore.get<IconId>("currentIcon");
    debugPrint("ICONS", "Retrieved icon ID from settings:", iconId);

    if (!iconId) {
      currentIconId = "default";
      // On macOS, "default" is a no-op — Liquid Glass works natively
      if (process.platform !== "darwin") {
        await setAppIcon(currentIconId);
      }
      debugPrint("ICONS", "Set icon to default due to no icon ID found.");
      return;
    }

    const parseResult = IconIdSchema(iconId);
    if (!(parseResult instanceof type.errors)) {
      currentIconId = parseResult;
      debugPrint("ICONS", "Successfully parsed and validated icon ID:", currentIconId);
      // For macOS "default", skip — Liquid Glass is already rendering
      if (process.platform === "darwin" && currentIconId === "default") {
        debugPrint("ICONS", "macOS: default icon, skipping setAppIcon (Liquid Glass active).");
        return;
      }
      await setAppIcon(currentIconId);
    } else {
      debugError("ICONS", "Failed to parse icon ID from settings:", iconId, parseResult.summary);
      // Optionally set a default icon if parsing fails
      currentIconId = "default";
      if (process.platform !== "darwin") {
        await setAppIcon(currentIconId);
      }
      debugPrint("ICONS", "Set icon to default due to parsing error.");
    }
  } catch (error) {
    debugError("ICONS", "Error retrieving currentIcon from settings, using default:", error);
    // Use default value if error raised during retrieval
    currentIconId = "default";
    if (process.platform !== "darwin") {
      await setAppIcon(currentIconId);
    }
  }
}

export function getCurrentIconId() {
  return currentIconId;
}
export async function setCurrentIconId(iconId: IconId) {
  debugPrint("ICONS", "Attempting to set current icon ID to:", iconId);
  const parseResult = IconIdSchema(iconId);
  if (!(parseResult instanceof type.errors)) {
    debugPrint("ICONS", "Parsed icon ID successfully:", iconId);
    try {
      await SettingsDataStore.set("currentIcon", iconId);
      debugPrint("ICONS", "Successfully saved icon ID to settings:", iconId);
      currentIconId = iconId;
      await setAppIcon(currentIconId); // Update the actual app icon
      debugPrint("ICONS", "Successfully updated current icon ID and app icon.");
      return true;
    } catch (error) {
      debugError("ICONS", "Failed to save icon ID to settings:", iconId, error);
      return false;
    }
  } else {
    debugError("ICONS", "Failed to parse provided icon ID:", iconId, parseResult.summary);
    return false;
  }
}
