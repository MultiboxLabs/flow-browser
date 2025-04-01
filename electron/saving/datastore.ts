import { FLOW_DATA_DIR } from "@/modules/paths";
import { Queue } from "@/modules/queue";
import { debugPrint, debugError } from "@/modules/output";
import fs from "fs/promises";
import path from "path";

const DATASTORE_DIR = path.join(FLOW_DATA_DIR, "datastore");

type Data = {
  [key: string]: any;
};

export type DataStoreData = Data;

type AccessResult = Data | null;

/**
 * Error class specifically for DataStore related errors
 */
class DataStoreError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "DataStoreError";
  }
}

/**
 * Handles persistent storage of JSON data in the filesystem
 * Each DataStore instance manages a single namespace (file)
 */
class DataStore {
  private directoryPath: string;
  private accessQueue: Queue;

  /**
   * Creates a new DataStore instance
   * @param namespace - The unique identifier for this datastore (becomes filename)
   * @param containers - Optional subdirectories to organize datastores
   * @throws {DataStoreError} If invalid parameters are provided
   */
  constructor(
    private readonly namespace: string,
    private readonly containers?: string[]
  ) {
    if (!namespace || typeof namespace !== "string") {
      throw new DataStoreError("Invalid namespace provided to DataStore constructor");
    }

    if (containers && !Array.isArray(containers)) {
      throw new DataStoreError("Invalid containers provided to DataStore constructor");
    }

    if (this.containers) {
      this.directoryPath = path.join(DATASTORE_DIR, ...this.containers);
    } else {
      this.directoryPath = DATASTORE_DIR;
    }

    this.accessQueue = new Queue();
  }

  /**
   * Core method to handle file I/O operations with proper queuing
   * @param callback - Function that receives current data and returns new data to save
   * @returns Promise resolving to the callback result
   * @private
   */
  private accessDataStore(callback: (oldData: Data) => Promise<AccessResult> | AccessResult): Promise<AccessResult> {
    return this.accessQueue.add(async () => {
      const namespace = this.namespace;
      if (!namespace || typeof namespace !== "string") {
        debugError("DATASTORE", `Invalid namespace provided: ${namespace}`);
        throw new DataStoreError("Invalid namespace provided");
      }

      // Create the datastore directory if it doesn't exist
      await fs.mkdir(this.directoryPath, { recursive: true });
      debugPrint("DATASTORE", `Ensuring datastore directory exists: ${this.directoryPath}`);

      // Get file path
      const dataFilePath = path.join(this.directoryPath, `${namespace}.json`);
      debugPrint("DATASTORE", `Accessing datastore file: ${dataFilePath}`);

      // Read data
      const oldData: Data = await fs
        .readFile(dataFilePath, "utf8")
        .then((fileContent) => {
          const jsonData = JSON.parse(fileContent);
          debugPrint("DATASTORE", `Successfully read data from ${namespace}.json`);
          return jsonData;
        })
        .catch((error) => {
          if (error instanceof SyntaxError) {
            debugError("DATASTORE", `Invalid JSON in ${namespace}.json, resetting to empty object`);
            return {};
          } else if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            debugPrint("DATASTORE", `${namespace}.json doesn't exist, creating new datastore`);
            return {};
          } else {
            debugError("DATASTORE", `Error reading ${namespace}.json:`, error);
            throw error;
          }
        });

      // Update data
      let newData: AccessResult = null;
      try {
        newData = await callback(oldData);
      } catch (error) {
        throw new DataStoreError("Error in datastore callback execution", error as Error);
      }

      // Write data to file
      if (newData !== null) {
        try {
          await fs.writeFile(dataFilePath, JSON.stringify(newData, null, 2));
          debugPrint("DATASTORE", `Successfully wrote data to ${namespace}.json`);
        } catch (error) {
          debugError("DATASTORE", `Failed to write to ${namespace}.json:`, error);
          throw new DataStoreError(`Failed to write to datastore file: ${namespace}.json`, error as Error);
        }
      }

      return newData;
    });
  }

  /**
   * Helper method to get data from the datastore without writing it back
   * @param callback - Function that receives current data and returns a transformed value
   * @returns Promise resolving to the callback result
   * @private
   */
  private getDataStoreNamespace<T>(callback: (data: Data) => Promise<T> | T): Promise<T> {
    return new Promise((resolve, reject) => {
      const accessCallback = async (data: Data) => {
        try {
          const result = await callback(data);
          resolve(result);
          return null;
        } catch (error) {
          reject(new DataStoreError("Error in namespace callback execution", error as Error));
          return null;
        }
      };
      this.accessDataStore(accessCallback).catch(reject);
    });
  }

  /**
   * Retrieves all data stored in this namespace
   * @returns Promise resolving to the complete data object
   */
  getFullData() {
    return this.getDataStoreNamespace((data) => {
      return data;
    });
  }

  /**
   * Gets a single value by key from the datastore
   * @param key - The key to retrieve
   * @param defaultValue - Value to return if key doesn't exist
   * @returns Promise resolving to the value or defaultValue if not found
   * @throws {DataStoreError} If invalid key is provided
   */
  get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    if (!key || typeof key !== "string") {
      throw new DataStoreError("Invalid key provided to get method");
    }

    return this.getDataStoreNamespace((data) => {
      return data[key] ?? defaultValue;
    });
  }

  /**
   * Gets multiple values by keys from the datastore
   * @param keys - Array of keys to retrieve
   * @returns Promise resolving to an object with the requested keys and their values
   */
  getKeys<K extends string>(keys: K[]): Promise<{ [key in K]: any }> {
    return this.getDataStoreNamespace((data) => {
      return keys.reduce(
        (acc, key) => {
          acc[key] = data[key];
          return acc;
        },
        {} as { [key in K]: any }
      );
    });
  }

  /**
   * Sets a value in the datastore
   * @param key - The key to set
   * @param value - The value to store
   * @returns Promise that resolves when the operation is complete
   * @throws {DataStoreError} If invalid key is provided
   */
  async set<T>(key: string, value: T): Promise<void> {
    if (!key || typeof key !== "string") {
      throw new DataStoreError("Invalid key provided to set method");
    }

    await this.accessDataStore((data) => {
      data[key] = value;
      return data;
    });
  }

  /**
   * Deletes the datastore file
   * @returns Promise resolving to a boolean indicating success
   */
  async wipe(): Promise<boolean> {
    const dataFilePath = path.join(this.directoryPath, `${this.namespace}.json`);
    return await fs
      .rm(dataFilePath)
      .then(() => true)
      .catch(() => false);
  }
}

// Only export the type of the class, not the class itself
// This makes sure the classes are only created using the singleton
export type { DataStore };

// Singleton //
const datastores = new Map<string, DataStore>();

/**
 * Gets or creates a DataStore instance for the specified namespace
 * Acts as a singleton factory to ensure only one instance exists per namespace
 *
 * @param namespace - The unique identifier for this datastore
 * @param containers - Optional subdirectories or single subdirectory string
 * @returns DataStore instance for the requested namespace
 */
export function getDatastore(namespace: string, containers?: string[] | string): DataStore {
  const key = [...(containers || []), namespace].join("/");

  if (datastores.has(key)) {
    return datastores.get(key) as DataStore;
  }

  if (typeof containers === "string") {
    containers = [containers];
  }

  const datastore = new DataStore(namespace, containers);
  datastores.set(key, datastore);
  return datastore;
}
