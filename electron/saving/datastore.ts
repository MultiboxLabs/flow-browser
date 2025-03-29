import { FLOW_DATA_DIR } from "@/modules/paths";
import fs from "fs/promises";
import path from "path";

const DATASTORE_DIR = path.join(FLOW_DATA_DIR, "datastore");

type Data = {
  [key: string]: any;
};

type AccessResult = Data | null;

function accessDataStore(
  namespace: string,
  callback: (oldData: Data) => Promise<AccessResult> | AccessResult
): Promise<AccessResult> {
  return new Promise(async (resolve, reject) => {
    // Create the datastore directory if it doesn't exist
    await fs.mkdir(DATASTORE_DIR, { recursive: true }).catch(() => {});

    // Get file path
    const filePath = path.join(DATASTORE_DIR, `${namespace}.json`);

    // Read data
    const oldData = await fs
      .readFile(filePath, "utf8")
      .then((data) => {
        return JSON.parse(data);
      })
      .catch(() => {
        return {};
      });

    // Update data
    const newData = await callback(oldData);

    // Write data to file
    if (newData !== null) {
      await fs.writeFile(filePath, JSON.stringify(newData, null, 2));
    }

    // Resolve with new data
    resolve(newData);
  });
}

function getDataStoreNamespace<T>(namespace: string, callback: (data: Data) => Promise<T> | T): Promise<T> {
  return new Promise((resolve) => {
    const accessCallback = async (data: Data) => {
      const result = await callback(data);
      resolve(result);
      return null;
    };
    accessDataStore(namespace, accessCallback);
  });
}

export class DataStore {
  constructor(private readonly namespace: string) {}

  async get<T>(key: string): Promise<T> {
    return getDataStoreNamespace(this.namespace, (data) => data[key]);
  }

  async set<T>(key: string, value: T): Promise<void> {
    await accessDataStore(this.namespace, (data) => {
      data[key] = value;
      return data;
    });
  }
}
