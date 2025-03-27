import { app, NativeImage, nativeImage } from "electron";
import path from "path";
import { PATHS } from "./paths";
import fs from "fs";
import sharp from "sharp";
import { getWindows, windowEvents, WindowEventType } from "./windows";

const iconsDirectory = path.join(PATHS.ASSETS, "public", "icons");

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
    app.dock.setIcon(currentIcon);
  } else if (["win32", "linux"].includes(process.platform)) {
    getWindows().forEach(({ window }) => {
      window.setIcon(currentIcon);
    });
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
  console.log("window added");
  updateAppIcon();
});
