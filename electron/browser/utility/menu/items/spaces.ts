import { MenuItemConstructorOptions, nativeImage, NativeImage } from "electron";
import { Browser } from "@/browser/browser";
import { getLastUsedSpace, getSpaces } from "@/sessions/spaces";
import { getFocusedBrowserWindowData } from "../helpers";
import { settings } from "@/settings/main";
import sharp from "sharp";
import { setWindowSpace } from "@/ipc/session/spaces";
import path from "path";
import { readFile } from "fs/promises";
import { IconEntry, icons } from "@phosphor-icons/core";

// Types
interface Space {
  id: string;
  name: string;
  icon?: string;
}

const PhosphorIcons = icons as unknown as IconEntry[];

/**
 * Icon utilities
 */
function getIconNameFromPascalCase(pascalCaseName: string): string {
  const icon = PhosphorIcons.find((icon) => icon.pascal_name === pascalCaseName);
  return icon?.name || "dot-outline";
}

function getPhosphorIconPath(pascalName: string): string | null {
  const name = getIconNameFromPascalCase(pascalName);
  if (!name) return null;

  const packagePath = require.resolve("@phosphor-icons/core");
  return path.join(packagePath, "..", "..", "assets", "duotone", `${name}-duotone.svg`);
}

async function createSvgFromIconPath(iconPath: string): Promise<NativeImage | null> {
  try {
    let svgString = await readFile(iconPath, "utf8");

    // Make SVG white by modifying fill attribute safely
    // Replace existing fill attribute or add it if not present
    if (svgString.includes('fill="')) {
      svgString = svgString.replace(/fill="[^"]*"/, 'fill="white"');
    } else {
      svgString = svgString.replace(/<svg/, '<svg fill="white"');
    }

    // Convert to native image
    const iconBuffer = await sharp(Buffer.from(svgString)).png().resize(16, 16).toBuffer();

    return nativeImage.createFromBuffer(iconBuffer);
  } catch (error) {
    console.error("Error creating SVG from path:", error);
    return null;
  }
}

// Icon cache
type IconCacheKey = `${string}-${number | undefined}`;
const iconCache = new Map<IconCacheKey, NativeImage>();

async function getIconAsNativeImage(name: string, padding?: number): Promise<NativeImage | null> {
  const cacheKey = `${name}-${padding}` as IconCacheKey;

  // Check cache first
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey) as NativeImage;
  }

  // Create new icon if not in cache
  const iconPath = getPhosphorIconPath(name);
  if (!iconPath) return null;

  const image = await createSvgFromIconPath(iconPath);
  if (image) {
    iconCache.set(cacheKey, image);
  }

  return image;
}

/**
 * Space menu item creation
 */
async function createSpaceMenuItem(
  space: Space,
  index: number,
  lastUsedSpaceId: string,
  padding: number = 2
): Promise<MenuItemConstructorOptions> {
  let iconImage = null;

  if (space.icon) {
    iconImage = await getIconAsNativeImage(space.icon, padding);
  }

  return {
    checked: space.id === lastUsedSpaceId,
    label: space.name,
    accelerator: `Ctrl+${index + 1}`,
    click: () => {
      const winData = getFocusedBrowserWindowData();
      if (!winData?.tabbedBrowserWindow) return;
      setWindowSpace(winData.tabbedBrowserWindow, space.id);
    },
    ...(iconImage ? { icon: iconImage } : {})
  };
}

/**
 * Creates the Spaces menu for the application
 */
export async function createSpacesMenu(_browser: Browser, padding: number = 2): Promise<MenuItemConstructorOptions> {
  const spaces = await getSpaces();
  const lastUsedSpace = await getLastUsedSpace();

  if (!lastUsedSpace) {
    return {
      label: "Spaces",
      submenu: [
        {
          label: "Manage Spaces",
          click: () => settings.show()
        }
      ]
    };
  }

  const spaceMenuItems = await Promise.all(
    spaces.map((space, index) => createSpaceMenuItem(space, index, lastUsedSpace.id, padding))
  );

  return {
    label: "Spaces",
    submenu: [
      ...spaceMenuItems,
      { type: "separator" },
      {
        label: "Manage Spaces",
        click: () => settings.show()
      }
    ]
  };
}
