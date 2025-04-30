import { MenuItemConstructorOptions, nativeImage, NativeImage } from "electron";
import { getSpaces } from "@/sessions/spaces";
import { getFocusedBrowserWindowData } from "../helpers";
import { settings } from "@/settings/main";
import sharp from "sharp";
import { setWindowSpace } from "@/ipc/session/spaces";
import path from "path";
import { readFile } from "fs/promises";
import { IconEntry, icons } from "@phosphor-icons/core";
import { getFocusedWindow } from "@/modules/windows";

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

  try {
    const iconPath = path.join(
      require.resolve("@phosphor-icons/core"),
      "..",
      "..",
      "assets",
      "duotone",
      `${name}-duotone.svg`
    );
    return iconPath;
  } catch (error) {
    console.error("Failed to resolve phosphor-icons path:", error);
    return null;
  }
}

const svgPlatforms: NodeJS.Platform[] = ["darwin"];
async function createSvgFromIconPath(iconPath: string): Promise<NativeImage | null> {
  if (!svgPlatforms.includes(process.platform)) {
    // The SVG will not show on the platform, so it's not needed
    return null;
  }

  try {
    let svgString = await readFile(iconPath, "utf8");

    // Make SVG white using a more robust approach
    // 1. Handle existing fill attributes on the SVG root
    svgString = svgString.replace(/<svg([^>]*)>/, (_match, attributes) => {
      // Remove any existing fill attribute
      const cleanedAttributes = attributes.replace(/\s*fill="[^"]*"\s*/g, " ");
      return `<svg${cleanedAttributes} fill="white">`;
    });

    // 2. Add style to ensure all elements inherit the white color
    svgString = svgString.replace(/<svg([^>]*)>/, (match) => {
      return `${match}<style>* { fill: white; stroke: white; }</style>`;
    });

    // Convert to native image
    const iconBuffer = await sharp(Buffer.from(svgString)).png().resize(16, 16).toBuffer();

    return nativeImage.createFromBuffer(iconBuffer);
  } catch (error) {
    console.error("Error creating SVG from path:", error);
    return null;
  }
}

// Icon cache
type IconCacheKey = `${string}`;
const iconCache = new Map<IconCacheKey, NativeImage>();

async function getIconAsNativeImage(name: string): Promise<NativeImage | null> {
  const cacheKey = `${name}` as IconCacheKey;

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
  currentSpaceId: string | null
): Promise<MenuItemConstructorOptions> {
  let iconImage: NativeImage | null = null;

  if (space.icon) {
    try {
      iconImage = await getIconAsNativeImage(space.icon);
    } catch (error) {
      console.error(`Failed to load icon for space "${space.name}":`, error);
      // Continue without an icon
    }
  }

  const checked = space.id === currentSpaceId;
  return {
    type: "checkbox",
    id: `space-${space.id}-${checked ? "checked" : "unchecked"}`,
    checked,
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
export async function createSpacesMenu(): Promise<MenuItemConstructorOptions> {
  try {
    const spaces = await getSpaces();

    const focusedWindow = getFocusedWindow();
    const currentSpaceId = focusedWindow?.tabbedBrowserWindow?.getCurrentSpace() ?? null;

    if (!focusedWindow?.tabbedBrowserWindow) {
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

    // Use Promise.allSettled to ensure all space menu items are attempted
    // even if some fail to be created
    const spaceMenuItemResults = await Promise.allSettled(
      spaces.map((space, index) => createSpaceMenuItem(space, index, currentSpaceId))
    );

    // Filter out any rejected promises and only keep the fulfilled ones
    const spaceMenuItems = spaceMenuItemResults
      .filter((result): result is PromiseFulfilledResult<MenuItemConstructorOptions> => result.status === "fulfilled")
      .map((result) => result.value);

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
  } catch (error) {
    console.error("Failed to create spaces menu:", error);
    // Provide a fallback menu if the spaces menu creation fails
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
}
