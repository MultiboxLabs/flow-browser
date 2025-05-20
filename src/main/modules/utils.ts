import { randomUUID } from "crypto";
import fs from "fs";
import fsPromises from "fs/promises";
import mimeTypes from "mime-types";
import path from "path";

/**
 * Check if a file exists
 * @param filePath - The path to check
 * @returns True if the file exists, false otherwise
 */
export async function isFileExists(filePath: string) {
  return await fsPromises
    .access(filePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

/**
 * Get the content type of a file
 * @param filePath - The path to get the content type of
 * @returns The content type of the file
 */
export function getContentType(filePath: string) {
  return mimeTypes.lookup(filePath) || "text/plain";
}

/**
 * Wait for a number of milliseconds
 * @param ms - The number of milliseconds to wait
 * @returns A promise that resolves after the number of milliseconds
 */
export function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get the stats of a path
 * @param path - The path to get the stats of
 * @returns The stats of the path
 */
export async function getFsStat(path: string) {
  return await fsPromises.stat(path).catch(() => null);
}

/**
 * Get the actual size of a file or directory
 * @param filePath - The path to get the actual size of
 * @returns The actual size of the file or directory
 */
export async function getActualSize(filePath: string): Promise<number> {
  const stat = await getFsStat(filePath);
  if (!stat) return 0;

  if (stat.isFile()) {
    return stat.size;
  } else if (stat.isDirectory()) {
    const files = await fsPromises.readdir(filePath);
    let totalSize = 0;
    for (const file of files) {
      const fileSize = await getActualSize(path.join(filePath, file));
      totalSize += fileSize;
    }
    return totalSize;
  } else {
    return 0; // can't take size of a stream/symlink/socket/etc
  }
}

/**
 * Sleep for a number of milliseconds
 * @param ms - The number of milliseconds to sleep
 * @returns A promise that resolves after the number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a short random ID from a UUID
 * @returns A random ID
 */
export function generateID(): string {
  return randomUUID().split("-")[0];
}

/**
 * Clamp a value between a minimum and maximum
 * @param value - The value to clamp
 * @param min - The minimum value
 * @param max - The maximum value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
