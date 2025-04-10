// My Two Cents:
// Lucide had been great, but WHY IS ITS NAMING SCHEME SO BAD?
// It uses kebab-case for lucide-react icons, but camelCase for lucide icons.
// Why????

import { MenuItemConstructorOptions, nativeImage, NativeImage } from "electron";
import { Browser } from "@/browser/browser";
import { getLastUsedSpace, getSpaces, setSpaceLastUsed, spacesEmitter } from "@/sessions/spaces";
import { getFocusedBrowserWindowData } from "../helpers";
import { settings } from "@/settings/main";
import { icons } from "lucide";
import sharp from "sharp";

// String utilities
const toCamelCase = (str: string): string => {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
};

// Icon utilities
const getLucideIcon = (name: string): any => {
  const formattedName = toCamelCase(name);
  const icon = icons[formattedName as keyof typeof icons];

  if (!icon) {
    console.warn(`Icon ${formattedName} not found`);
    return null;
  }

  return icon;
};

const createSvgFromPathArray = async (pathArray: any[], padding: number = 2): Promise<NativeImage | null> => {
  try {
    // Create SVG string from path array
    const svgContent = pathArray
      .map(([elementType, attributes]) => {
        const attributesString = Object.entries(attributes)
          .map(([key, value]) => `${key}="${value}"`)
          .join(" ");
        return `<${elementType} ${attributesString}/>`;
      })
      .join("");

    // Adjust dimensions to account for padding
    const size = 24;
    const paddedSize = size + padding * 2;

    // Wrap in SVG element with proper dimensions and viewBox
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${paddedSize}" height="${paddedSize}" viewBox="0 0 ${paddedSize} ${paddedSize}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <g transform="translate(${padding}, ${padding})">
        ${svgContent}
      </g>
    </svg>`;

    // Convert to native image
    const iconBuffer = await sharp(Buffer.from(svgString)).png().resize(16, 16).toBuffer();
    return nativeImage.createFromBuffer(iconBuffer);
  } catch (error) {
    console.error("Error creating SVG from path array:", error);
    return null;
  }
};

type IconCacheKey = `${number}-${string}`;
const iconCache = new Map<IconCacheKey, NativeImage>();
const getLucideIconAsNativeImage = async (name: string, padding?: number): Promise<NativeImage | null> => {
  const cacheKey = `${name}-${padding}` as IconCacheKey;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey) as NativeImage;
  }

  const icon = getLucideIcon(name);
  if (!icon) return null;
  const image = await createSvgFromPathArray(icon, padding);
  iconCache.set(cacheKey, image as NativeImage);
  return image;
};

// Space menu item creation
const createSpaceMenuItem = async (
  space: any,
  index: number,
  lastUsedSpaceId: string,
  padding: number = 2
): Promise<MenuItemConstructorOptions> => {
  let iconImage = null;

  if (space.icon) {
    iconImage = await getLucideIconAsNativeImage(space.icon, padding);
  }

  return {
    checked: space.id === lastUsedSpaceId,
    label: space.name,
    accelerator: `Ctrl+${index + 1}`,
    click: () => {
      const winData = getFocusedBrowserWindowData();
      if (!winData) return;

      const win = winData.tabbedBrowserWindow;
      if (win) {
        win.setCurrentSpace(space.id);
        setSpaceLastUsed(space.profileId, space.id).then(() => {
          spacesEmitter.emit("changed");
        });
      }
    },
    ...(iconImage ? { icon: iconImage } : {})
  };
};

// Main export function
export const createSpacesMenu = async (browser: Browser, padding: number = 2): Promise<MenuItemConstructorOptions> => {
  const spaces = await getSpaces();
  const lastUsedSpace = await getLastUsedSpace();

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
};
