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

class DataStoreError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "DataStoreError";
  }
}

class DataStore {
  private directoryPath: string;
  private accessQueue: Queue;

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

  getFullData() {
    return this.getDataStoreNamespace((data) => {
      return data;
    });
  }

  get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    if (!key || typeof key !== "string") {
      throw new DataStoreError("Invalid key provided to get method");
    }

    return this.getDataStoreNamespace((data) => {
      return data[key] ?? defaultValue;
    });
  }

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

  async set<T>(key: string, value: T): Promise<void> {
    if (!key || typeof key !== "string") {
      throw new DataStoreError("Invalid key provided to set method");
    }

    await this.accessDataStore((data) => {
      data[key] = value;
      return data;
    });
  }
}

// Only export the type of the class, not the class itself
// This makes sure the classes are only created using the singleton
export type { DataStore };

// Singleton //
const datastores = new Map<string, DataStore>();

export function getDatastore(namespace: string, containers?: string[] | string): DataStore {
  if (datastores.has(namespace)) {
    return datastores.get(namespace) as DataStore;
  }

  if (typeof containers === "string") {
    containers = [containers];
  }

  const datastore = new DataStore(namespace, containers);
  datastores.set(namespace, datastore);
  return datastore;
}
