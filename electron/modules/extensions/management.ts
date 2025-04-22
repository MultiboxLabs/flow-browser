import { DataStore, getDatastore } from "@/saving/datastore";
import { Extension, Session } from "electron";
import path from "path";
import fs from "fs/promises";

type ExtensionType = "unpacked" | "crx";

type ExtensionData = {
  type: ExtensionType;
  disabled: boolean;
};

type ExtensionDataWithId = ExtensionData & {
  id: string;
};

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
 * Get the stats of a path
 * @param path - The path to get the stats of
 * @returns The stats of the path
 */
async function getFsStat(path: string) {
  return await fs.stat(path).catch(() => null);
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

export class ExtensionManager {
  readonly profileId: string;
  private readonly profileSession: Session;
  private readonly extensionsPath: string;
  private readonly extensionStore: DataStore;
  private cache: ExtensionDataWithId[] = [];

  constructor(profileId: string, profileSession: Session, extensionsPath: string) {
    this.profileId = profileId;
    this.profileSession = profileSession;
    this.extensionsPath = extensionsPath;

    this.extensionStore = getProfileExtensionStore(profileId);
  }

  private async updateCache() {
    return await this.getInstalledExtensions();
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

  /**
   * Get the path of an extension
   * @param extensionId - The ID of the extension
   * @param extensionData - The data of the extension
   * @returns The path of the extension
   */
  private async getExtensionPath(extensionId: string, extensionData: ExtensionData) {
    switch (extensionData.type) {
      case "unpacked": {
        const unpackedPath = path.join(this.extensionsPath, "unpacked", extensionId);

        const unpackedHasManifest = await hasManifest(unpackedPath);
        if (!unpackedHasManifest) {
          return null;
        }

        return unpackedPath;
      }

      case "crx": {
        const crxPath = path.join(this.extensionsPath, "crx");
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

    const extension = await session.loadExtension(extensionPath);
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
    const extension = this.profileSession.getExtension(extensionId);
    if (!extension) {
      return false;
    }

    this.profileSession.removeExtension(extensionId);
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
      .set(extensionId, { type, disabled: false })
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

  /**
   * Get the disabled state of an extension
   * @param extensionId - The ID of the extension
   * @returns True if the extension is disabled, false otherwise
   */
  public getExtensionDisabled(extensionId: string): boolean {
    return this.cache.find((extension) => extension.id === extensionId)?.disabled ?? false;
  }
}
