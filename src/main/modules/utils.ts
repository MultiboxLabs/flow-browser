import { randomUUID } from "crypto";
import fsPromises from "fs/promises";
import mimeTypes from "mime-types";
import path from "path";

/**
 * Check if a file exists
 * @param filePath - The path to check
 * @returns True if the file exists, false otherwise
 */
export async function doesFileExist(filePath: string) {
  return await fsPromises
    .access(filePath, fsPromises.constants.F_OK)
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

/**
 * Get the current timestamp
 * @returns The current timestamp
 */
export function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * Get all immediate subdirectories of a parent path
 * @param parentPath - The parent directory to scan
 * @returns Array of directory names
 */
export async function getAllDirectories(parentPath: string): Promise<string[]> {
  try {
    const entries = await fsPromises.readdir(parentPath, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((dir) => dir.name);
  } catch {
    return [];
  }
}

/**
 * Turns a buffer into an array buffer.
 * @param buffer - The Buffer Object
 * @returns The converted ArrayBuffer.
 */
export function bufferToArrayBuffer(buffer: Buffer) {
  return new Uint8Array(buffer).buffer;
}

/**
 * Checks if a hex color is light.
 * @param color - The hex color to check.
 * @returns True if the color is light, false otherwise.
 */
export function hex_is_light(color: string) {
  const hex = color.replace("#", "");
  const c_r = parseInt(hex.substring(0, 0 + 2), 16);
  const c_g = parseInt(hex.substring(2, 2 + 2), 16);
  const c_b = parseInt(hex.substring(4, 4 + 2), 16);
  const brightness = (c_r * 299 + c_g * 587 + c_b * 114) / 1000;
  return brightness > 155;
}
