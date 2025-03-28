import fs from "fs";
import fsPromises from "fs/promises";
import mimeTypes from "mime-types";

export async function isFileExists(filePath: string) {
  return await fsPromises
    .access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export function getContentType(filePath: string) {
  return mimeTypes.lookup(filePath) || "text/plain";
}

export function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
