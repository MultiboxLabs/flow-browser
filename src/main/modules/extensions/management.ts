import { DataStore, getDatastore } from "@/saving/datastore";
import { Extension, NativeImage, Session, nativeImage } from "electron";
import path from "path";
import fs from "fs/promises";
import { getActualSize, getFsStat } from "@/modules/utils";
import { ExtensionType } from "~/types/extensions";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { fireOnExtensionsUpdated } from "@/ipc/app/extensions";
import { uninstallExtension } from "electron-chrome-web-store";

export type ExtensionData = {
  type: ExtensionType;
  disabled: boolean;
  pinned: boolean;
};

type ExtensionDataWithId = ExtensionData & {
  id: string;
};

const DEFAULT_PINNED_STATE = false;

/**
 * Get the extension store for a profile
 *
 * Extension store is located at {appData}/datastore/profiles/{profileId}/extensions
 * @param profileId - The ID of the profile
 * @returns The extension store for the profile
 */
function getProfileExtensionStore(profileId: string) {
  return getDatastore("extensions", ["profiles", profileId]);
}

/**
 * Check if a path is a directory
 * @param path - The path to check
 * @returns True if the path is a directory, false otherwise
 */
async function isDirectory(path: string) {
  const stats = await getFsStat(path);
  if (!stats) return false;
  return stats.isDirectory();
}

/**
 * Check if a path is a file
 * @param path - The path to check
 * @returns True if the path is a file, false otherwise
 */
async function hasFile(path: string) {
  const stats = await getFsStat(path);
  if (!stats) return false;
  return stats.isFile();
}

/**
 * Check if a path has a manifest file
 * @param extensionPath - The path to check
 * @returns True if the path has a manifest file, false otherwise
 */
async function hasManifest(extensionPath: string) {
  return hasFile(path.join(extensionPath, "manifest.json"));
}

/**
 * Get the manifest of an extension
 * @param extensionPath - The path to the extension
 * @returns The manifest of the extension
 */
export async function getManifest(extensionPath: string) {
  const manifestPath = path.join(extensionPath, "manifest.json");
  const hasManifest = await hasFile(manifestPath);
  if (!hasManifest) return null;

  try {
    const manifestJSON = await fs.readFile(manifestPath, "utf-8");
    const manifest: chrome.runtime.Manifest = JSON.parse(manifestJSON);
    return manifest;
  } catch (error) {
    console.error(`Failed to parse manifest at ${manifestPath}:`, error);
    return null;
  }
}

/**
 * Get the size of an extension
 * @param extensionPath - The path to the extension
 * @returns The size of the extension
 */
export async function getExtensionSize(extensionPath: string) {
  return await getActualSize(extensionPath);
}

/**
 * Get the icon of an extension
 * @param extensionPath - The path to the extension
 * @returns The icon of the extension
 */
export async function getExtensionIcon(extensionPath: string): Promise<NativeImage | null> {
  const manifest = await getManifest(extensionPath);
  if (!manifest || !manifest.icons) {
    console.warn(`No manifest or icons found for extension at ${extensionPath}`);
    return null;
  }

  // Prefer 128px icon, then largest available
  const iconSizes = Object.keys(manifest.icons)
    .map(Number)
    .sort((a, b) => b - a);
  let bestIconPath: string | null = null;

  const preferredSize = "128";
  if (manifest.icons[preferredSize]) {
    bestIconPath = manifest.icons[preferredSize];
  } else if (iconSizes.length > 0) {
    const largestSize = iconSizes[0];
    const sizeKey = largestSize.toString();
    bestIconPath = (manifest.icons as Record<string, string>)[sizeKey];
    console.warn(
      `Using largest available icon size (${largestSize}px) for extension at ${extensionPath} as 128px icon is not available.`
    );
  }

  if (!bestIconPath) {
    console.warn(`No suitable icon path found in manifest for extension at ${extensionPath}`);
    return null;
  }

  const fullIconPath = path.join(extensionPath, bestIconPath);

  try {
    // Check if the icon file exists before reading using the existing getFsStat helper
    const stats = await getFsStat(fullIconPath);
    if (!stats || !stats.isFile()) {
      console.error(`Icon file not found or is not a file at ${fullIconPath}`);
      return null;
    }

    const iconBuffer = await fs.readFile(fullIconPath);
    const image = nativeImage.createFromBuffer(iconBuffer);
    // Check if the image is empty (e.g., invalid file format)
    if (image.isEmpty()) {
      console.error(`Failed to create NativeImage from ${fullIconPath}: Image is empty or invalid format.`);
      return null;
    }
    return image;
  } catch (error) {
    console.error(`Failed to read or create NativeImage for icon at ${fullIconPath}:`, error);
    return null;
  }
}

export class ExtensionManager extends TypedEventEmitter<{
  "cache-updated": [];
}> {
  readonly profileId: string;
  private readonly profileSession: Session;
  private readonly extensionsPath: string;
  private readonly extensionStore: DataStore;
  private cache: ExtensionDataWithId[] = [];

  constructor(profileId: string, profileSession: Session, extensionsPath: string) {
    super();

    this.profileId = profileId;
    this.profileSession = profileSession;
    this.extensionsPath = extensionsPath;

    this.extensionStore = getProfileExtensionStore(profileId);

    // Fire Event
    this.on("cache-updated", () => {
      fireOnExtensionsUpdated(profileId);
    });
  }

  private async updateCache() {
    const extensions = await this.getInstalledExtensions();
    this.emit("cache-updated");
    return extensions;
  }

  /**
   * Get all installed extensions for a profile
   * @returns An array of installed extensions
   */
  public async getInstalledExtensions(): Promise<ExtensionDataWithId[]> {
    const extensionData = await this.extensionStore.getFullData();
    const extensions = Object.entries(extensionData).map(([id, data]) => ({
      id,
      ...data
    }));

    this.cache = extensions;
    return extensions;
  }

  public getExtensionsPath(extensionType: ExtensionType) {
    switch (extensionType) {
      case "unpacked": {
        return path.join(this.extensionsPath, "unpacked");
      }

      case "crx": {
        return path.join(this.extensionsPath, "crx");
      }

      default: {
        throw new Error(`Unknown extension type: ${extensionType}`);
      }
    }
  }

  /**
   * Get the path of an extension
   * @param extensionId - The ID of the extension
   * @param extensionData - The data of the extension
   * @returns The path of the extension
   */
  public async getExtensionPath(extensionId: string, extensionData: ExtensionData) {
    switch (extensionData.type) {
      case "unpacked": {
        const unpackedPath = this.getExtensionsPath("unpacked");
        const extensionFolder = path.join(unpackedPath, extensionId);

        const isADirectory = await isDirectory(extensionFolder);
        if (!isADirectory) {
          return null;
        }

        const unpackedHasManifest = await hasManifest(extensionFolder);
        if (!unpackedHasManifest) {
          return null;
        }

        return extensionFolder;
      }

      case "crx": {
        const crxPath = this.getExtensionsPath("crx");
        const extensionFolder = path.join(crxPath, extensionId);

        const isADirectory = await isDirectory(extensionFolder);
        if (!isADirectory) {
          return null;
        }

        const files = await fs.readdir(extensionFolder);
        if (files.length === 0) {
          return null;
        }

        for (const extensionPathname of files) {
          const extensionPath = path.join(extensionFolder, extensionPathname);

          const isADirectory = await isDirectory(extensionPath);
          if (!isADirectory) {
            continue;
          }

          const extensionHasManifest = await hasManifest(extensionPath);
          if (!extensionHasManifest) {
            continue;
          }

          return extensionPath;
        }

        return null;
      }
    }

    return null;
  }

  /**
   * Do stuff after an extension is loaded
   * @param extension - The extension to do stuff after
   */
  private async _afterLoadExtension(extension: Extension) {
    const session = this.profileSession;
    if (extension.manifest.manifest_version === 3 && extension.manifest.background?.service_worker) {
      const scope = `chrome-extension://${extension.id}`;
      await session.serviceWorkers.startWorkerForScope(scope).catch(() => {
        console.error(`Failed to start worker for extension ${extension.id}`);
      });
    }
  }

  /**
   * Load an extension with data
   * @param extensionId - The ID of the extension
   * @param extensionData - The data of the extension
   * @returns The loaded extension
   */
  private async loadExtensionWithData(extensionId: string, extensionData: ExtensionData) {
    const session = this.profileSession;

    const loadedExtension = session.getExtension(extensionId);
    if (loadedExtension) {
      await this._afterLoadExtension(loadedExtension);
      return loadedExtension;
    }

    const extensionPath = await this.getExtensionPath(extensionId, extensionData);
    if (!extensionPath) {
      return null;
    }

    const extension = await session.extensions.loadExtension(extensionPath);
    if (!extension) {
      return null;
    }

    await this._afterLoadExtension(extension);
    return extension;
  }

  /**
   * Unload an extension
   * @param extensionId - The ID of the extension
   * @returns True if the extension was unloaded, false otherwise
   */
  private async unloadExtensionWithId(extensionId: string) {
    const extension = this.profileSession.extensions.getExtension(extensionId);
    if (!extension) {
      return false;
    }

    this.profileSession.extensions.removeExtension(extensionId);
    return true;
  }

  /**
   * Load extensions for a profile
   */
  public async loadExtensions() {
    const extensions = await this.getInstalledExtensions();

    const promises = extensions.map(async (extension) => {
      if (extension.disabled) {
        return null;
      }

      return await this.loadExtensionWithData(extension.id, extension);
    });

    const loadedExtensions = await Promise.all(promises);
    return loadedExtensions.filter((extension) => extension !== null);
  }

  /**
   * Set the disabled state of an extension
   * @param extensionId - The ID of the extension
   * @param disabled - The new disabled state
   * @returns True if the disabled state was changed, false otherwise
   */
  public async setExtensionDisabled(extensionId: string, disabled: boolean) {
    const oldData: ExtensionData | undefined = await this.extensionStore.get(extensionId);
    if (!oldData) {
      return false;
    }

    if (oldData.disabled === disabled) {
      return false;
    }

    await this.extensionStore.set(extensionId, { ...oldData, disabled });
    await this.updateCache();

    if (disabled) {
      this.unloadExtensionWithId(extensionId);
    } else {
      this.loadExtensionWithData(extensionId, oldData);
    }

    return true;
  }

  /**
   * Add an installed extension to a profile
   * @param extensionId - The ID of the extension
   */
  public async addInstalledExtension(type: ExtensionType, extensionId: string): Promise<boolean> {
    return await this.extensionStore
      .set(extensionId, { type, disabled: false, pinned: DEFAULT_PINNED_STATE })
      .then(async () => {
        await this.updateCache();
        return true;
      })
      .catch(() => false);
  }

  /**
   * Remove an installed extension from a profile
   * @param extensionId - The ID of the extension
   */
  public async removeInstalledExtension(extensionId: string): Promise<boolean> {
    return await this.extensionStore
      .remove(extensionId)
      .then(async () => {
        await this.unloadExtensionWithId(extensionId);
        await this.updateCache();
        return true;
      })
      .catch(() => false);
  }

  public async uninstallExtension(extensionId: string): Promise<boolean> {
    const extensionData = this.getExtensionDataFromCache(extensionId);
    if (!extensionData) {
      return false;
    }

    if (extensionData.type === "unpacked") {
      // TODO: Remove unpacked extension
    } else if (extensionData.type === "crx") {
      await uninstallExtension(extensionId, {
        extensionsPath: this.getExtensionsPath(extensionData.type),
        session: this.profileSession
      });
    }

    await this.removeInstalledExtension(extensionId);
    return true;
  }

  /**
   * Get the disabled state of an extension
   * @param extensionId - The ID of the extension
   * @returns True if the extension is disabled, false otherwise
   */
  public getExtensionDisabled(extensionId: string): boolean {
    return this.cache.find((extension) => extension.id === extensionId)?.disabled ?? false;
  }

  /**
   * Get the extension data from the cache
   * @param extensionId - The ID of the extension
   * @returns The extension data
   */
  public getExtensionDataFromCache(extensionId: string): ExtensionData | undefined {
    return this.cache.find((extension) => extension.id === extensionId);
  }

  /**
   * Set the pinned state of an extension
   * @param extensionId - The ID of the extension
   * @param pinned - The new pinned state
   * @returns True if the pinned state was changed, false otherwise
   */
  public async setPinned(extensionId: string, pinned: boolean) {
    const oldData: ExtensionData | undefined = await this.extensionStore.get(extensionId);
    if (!oldData) {
      return false;
    }

    if (oldData.pinned === pinned) {
      return false;
    }

    await this.extensionStore.set(extensionId, { ...oldData, pinned });
    await this.updateCache();
    return true;
  }
}
