import { app, NativeImage, nativeImage } from "electron";
import path from "path";
import { PATHS } from "./paths";
import fs from "fs";
import sharp from "sharp";
import { getWindows, windowEvents, WindowEventType } from "./windows";
import z from "zod";
import { SettingsDataStore } from "@/saving/settings";
import { debugError, debugPrint } from "@/modules/output";

export const supportedPlatforms: NodeJS.Platform[] = [
  // macOS: through app.dock.setIcon()
  "darwin",
  // Linux: through BrowserWindow.setIcon()
  "linux"
  // No support for Windows or other platforms
];
const iconsDirectory = path.join(PATHS.ASSETS, "public", "icons");

type IconData = {
  id: string;
  name: string;
  image_id: string;
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
  }
] as const satisfies IconData[];

export type IconId = (typeof icons)[number]["id"];
const IconIdSchema = z.enum(icons.map((icon) => icon.id) as [IconId, ...IconId[]]);

async function transformAppIcon(imagePath: string): Promise<Buffer> {
  debugPrint("ICONS", "Transforming app icon:", imagePath);
  try {
    // Read the image file
    const inputBuffer = fs.readFileSync(imagePath);

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

function generateIconPath(iconId: string) {
  const imagePath = path.join(iconsDirectory, `${iconId}.png`);
  debugPrint("ICONS", "Generated icon path:", imagePath);
  return imagePath;
}

let currentIcon: NativeImage | null = null;

function updateAppIcon() {
  if (!currentIcon) {
    debugPrint("ICONS", "No current icon set, skipping update.");
    return;
  }

  debugPrint("ICONS", `Updating app icon for platform: ${process.platform}`);
  if (process.platform === "darwin") {
    app.dock?.setIcon(currentIcon);
    debugPrint("ICONS", "Updated dock icon on macOS.");
  } else if (process.platform === "linux") {
    const windows = getWindows();
    debugPrint("ICONS", `Updating icon for ${windows.length} windows on Linux.`);
    for (const { window } of windows) {
      window.setIcon(currentIcon);
    }
  } else {
    debugPrint("ICONS", "Platform not supported for icon update, skipping.");
  }
}

export async function setAppIcon(iconId: string) {
  debugPrint("ICONS", "Attempting to set app icon to:", iconId);
  const imagePath = generateIconPath(iconId);

  if (!fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) {
    debugError("ICONS", `Icon image not found or not a file: ${imagePath}`);
    throw new Error(`Icon image not found: ${imagePath}`);
  }

  if (!supportedPlatforms.includes(process.platform)) {
    debugPrint("ICONS", `Platform ${process.platform} not supported for setting app icon.`);
    return false;
  }

  try {
    // Use the transformed icon
    const imgBuffer = await transformAppIcon(imagePath);
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

setAppIcon("default").catch((error) => {
  debugError("ICONS", "Failed initial setAppIcon call:", error);
});

app.whenReady().then(() => {
  debugPrint("ICONS", "App ready, ensuring icon is updated.");
  updateAppIcon();
});

windowEvents.on(WindowEventType.ADDED, (id) => {
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
      await setAppIcon(currentIconId);
      debugPrint("ICONS", "Set icon to default due to no icon ID found.");
      return;
    }

    const parseResult = IconIdSchema.safeParse(iconId);
    if (parseResult.success) {
      currentIconId = parseResult.data;
      debugPrint("ICONS", "Successfully parsed and validated icon ID:", currentIconId);
      await setAppIcon(currentIconId);
    } else {
      debugError("ICONS", "Failed to parse icon ID from settings:", iconId, parseResult.error);
      // Optionally set a default icon if parsing fails
      currentIconId = "default";
      await setAppIcon(currentIconId);
      debugPrint("ICONS", "Set icon to default due to parsing error.");
    }
  } catch (error) {
    debugError("ICONS", "Error retrieving currentIcon from settings, using default:", error);
    // Use default value if error raised during retrieval
    currentIconId = "default";
    await setAppIcon(currentIconId);
  }
}
cacheCurrentIcon();

export function getCurrentIconId() {
  return currentIconId;
}
export async function setCurrentIconId(iconId: IconId) {
  debugPrint("ICONS", "Attempting to set current icon ID to:", iconId);
  const parseResult = IconIdSchema.safeParse(iconId);
  if (parseResult.success) {
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
    debugError("ICONS", "Failed to parse provided icon ID:", iconId, parseResult.error);
    return false;
  }
}
