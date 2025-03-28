import { app, ipcMain, NativeImage, nativeImage } from "electron";
import path from "path";
import { PATHS } from "./paths";
import fs from "fs";
import sharp from "sharp";
import { getWindows, windowEvents, WindowEventType } from "./windows";
import z from "zod";
import { SettingsDataStore } from "@/modules/datastore";

const iconsDirectory = path.join(PATHS.ASSETS, "public", "icons");

type IconData = {
  id: string;
  name: string;
  image_id: string;
  author?: string;
};

const icons = [
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

type IconId = (typeof icons)[number]["id"];
const IconIdSchema = z.enum(icons.map((icon) => icon.id) as [IconId, ...IconId[]]);

async function transformAppIcon(imagePath: string): Promise<Buffer> {
  // Read the image file
  const inputBuffer = fs.readFileSync(imagePath);

  // Size constants
  const totalSize = 1024;
  const padding = 100;
  const artSize = totalSize - padding * 2; // 824
  const cornerRadius = Math.round(0.22 * artSize); // ~185px

  // Create a new image with padding
  return await sharp(inputBuffer)
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
}

function generateIconPath(iconId: string) {
  const imagePath = path.join(iconsDirectory, `${iconId}.png`);
  return imagePath;
}

let currentIcon: NativeImage | null = null;

function updateAppIcon() {
  if (!currentIcon) return;

  if (process.platform === "darwin") {
    app.dock?.setIcon(currentIcon);
  } else if (["win32", "linux"].includes(process.platform)) {
    for (const { window } of getWindows()) {
      window.setIcon(currentIcon);
    }
  }
}

export async function setAppIcon(iconId: string) {
  const imagePath = generateIconPath(iconId);
  if (!fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) {
    throw new Error(`Icon image not found: ${imagePath}`);
  }

  const supportedPlatforms: NodeJS.Platform[] = ["darwin"];

  if (!supportedPlatforms.includes(process.platform)) {
    return false;
  }

  // Use the transformed icon
  const imgBuffer = await transformAppIcon(imagePath);
  const img = nativeImage.createFromBuffer(imgBuffer);

  currentIcon = img;
  updateAppIcon();
  return true;
}

setAppIcon("default");

app.whenReady().then(() => {
  updateAppIcon();
});

windowEvents.on(WindowEventType.ADDED, () => {
  updateAppIcon();
});

// Settings: Current Icon //
let currentIconId: IconId = "default";

async function cacheCurrentIcon() {
  const iconId = await SettingsDataStore.get<IconId>("currentIcon");

  const parseResult = IconIdSchema.safeParse(iconId);
  if (parseResult.success) {
    currentIconId = parseResult.data;
    setAppIcon(currentIconId);
  }
}
cacheCurrentIcon();

export function getCurrentIconId() {
  return currentIconId;
}
export async function setCurrentIconId(iconId: IconId) {
  const parseResult = IconIdSchema.safeParse(iconId);
  if (parseResult.success) {
    await SettingsDataStore.set("currentIcon", iconId);
    currentIconId = iconId;
    setAppIcon(currentIconId);
    return true;
  }
  return false;
}

// IPC Handlers //
ipcMain.handle("get-icons", () => {
  return icons;
});

ipcMain.handle("get-current-icon-id", () => {
  return getCurrentIconId();
});

ipcMain.handle("set-current-icon-id", (_, iconId: IconId) => {
  return setCurrentIconId(iconId);
});
