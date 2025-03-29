import { FLOW_DATA_DIR } from "@/modules/paths";
import fs from "fs/promises";
import path from "path";

const DATASTORE_DIR = path.join(FLOW_DATA_DIR, "datastore");

type Data = {
  [key: string]: any;
};

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

async function accessDataStore(
  namespace: string,
  callback: (oldData: Data) => Promise<AccessResult> | AccessResult
): Promise<AccessResult> {
  if (!namespace || typeof namespace !== "string") {
    throw new DataStoreError("Invalid namespace provided");
  }

  // Create the datastore directory if it doesn't exist
  await fs.mkdir(DATASTORE_DIR, { recursive: true });

  // Get file path
  const dataFilePath = path.join(DATASTORE_DIR, `${namespace}.json`);

  // Read data
  const oldData: Data = await fs
    .readFile(dataFilePath, "utf8")
    .then((fileContent) => {
      const jsonData = JSON.parse(fileContent);
      return jsonData;
    })
    .catch((error) => {
      if (error instanceof SyntaxError) {
        // Invalid JSON, return empty object
        return {};
      } else if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        // File doesn't exist, return empty object
        return {};
      } else {
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
    } catch (error) {
      throw new DataStoreError(`Failed to write to datastore file: ${namespace}.json`, error as Error);
    }
  }

  return newData;
}

async function getDataStoreNamespace<T>(namespace: string, callback: (data: Data) => Promise<T> | T): Promise<T> {
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
    accessDataStore(namespace, accessCallback).catch(reject);
  });
}

export class DataStore {
  constructor(private readonly namespace: string) {
    if (!namespace || typeof namespace !== "string") {
      throw new DataStoreError("Invalid namespace provided to DataStore constructor");
    }
  }

  get<T>(key: string): Promise<T> {
    return getDataStoreNamespace(this.namespace, (data) => {
      return data[key];
    });
  }

  async set<T>(key: string, value: T): Promise<void> {
    await accessDataStore(this.namespace, (data) => {
      data[key] = value;
      return data;
    });
  }
}
