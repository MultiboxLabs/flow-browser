// Store Favicons in a SQLite database
// This is used to provide a cache before visiting a page
// Should be 32x32px

import path from "path";
import { knex, Knex } from "knex";
import { net } from "electron";
import { createHash } from "crypto";
import { FLOW_DATA_DIR } from "./paths";
import * as sharpIco from "sharp-ico";
import sharp from "sharp";
import { FLAGS } from "./flags";

const dbPath = path.join(FLOW_DATA_DIR, "favicons.db");

// Database configuration with optimizations for concurrency and performance
const db = knex({
  client: "better-sqlite3",
  useNullAsDefault: true,
  connection: {
    filename: dbPath,
    options: {
      //nativeBinding: PATHS.BETTER_SQLITE3_NATIVE_BINDING
    }
  },
  pool: {
    min: 1,
    max: 5,
    // Handle SQLITE_BUSY errors with a proper timeout
    acquireTimeoutMillis: 1000,
    createTimeoutMillis: 1000
  },
  // Prevent SQLITE_BUSY errors by waiting for locks to be released
  asyncStackTraces: false // Disable for performance in production
});

// Set SQLite pragmas for better performance and concurrency
async function configureDatabasePragmas() {
  try {
    // Use Write-Ahead Logging for better concurrency
    await db.raw("PRAGMA journal_mode = WAL");
    // Good balance between durability and performance
    await db.raw("PRAGMA synchronous = NORMAL");
    // Use 64MB of memory for DB cache (negative = KB)
    await db.raw("PRAGMA cache_size = -64000");
    // Wait up to 3 seconds for locks to be released
    await db.raw("PRAGMA busy_timeout = 3000");

    console.log("Configured SQLite pragmas for favicons database");
  } catch (err) {
    console.error("Error configuring SQLite pragmas:", err);
  }
}

// Maximum concurrent favicon processing operations
const MAX_CONCURRENT_OPERATIONS = 3;
let activeOperations = 0;
const operationQueue: (() => Promise<void>)[] = [];

// Process the operation queue
async function processQueue() {
  if (operationQueue.length === 0 || activeOperations >= MAX_CONCURRENT_OPERATIONS) {
    return;
  }

  activeOperations++;
  const operation = operationQueue.shift();

  try {
    await operation!();
  } catch (error) {
    console.error("Error in queued operation:", error);
  } finally {
    activeOperations--;
    // Process next operation in queue
    processQueue();
  }
}

// Initialize the database
async function initDatabase() {
  try {
    // Configure database pragmas
    await configureDatabasePragmas();

    // Run in a transaction to ensure consistency
    await db.transaction(async (trx) => {
      // Create favicons table if it doesn't exist
      const hasFaviconsTable = await trx.schema.hasTable("favicons");
      if (!hasFaviconsTable) {
        await trx.schema.createTable("favicons", (table) => {
          table.increments("id").primary();
          table.string("hash").notNullable().index(); // Add index for faster lookups
          table.timestamp("last_update");
          table.timestamp("last_requested");
          table.specificType("favicon", "blob").notNullable();
        });
        console.log("Created favicons table");
      }

      // Create favicon_urls table if it doesn't exist
      const hasFaviconUrlsTable = await trx.schema.hasTable("favicon_urls");
      if (!hasFaviconUrlsTable) {
        await trx.schema.createTable("favicon_urls", (table) => {
          table.increments("id").primary();
          table.string("url").notNullable().index(); // Add index for faster lookups
          table.integer("icon_id").references("id").inTable("favicons");
        });
        console.log("Created favicon_urls table");
      }
    });
  } catch (err) {
    console.error("Failed to initialize favicon database:", err);
  }
}

// Initialize the database
initDatabase();

/**
 * Converts an ICO file to a Sharp object ready for further processing
 * @param faviconData The ICO file data
 * @param url The URL for logging purposes
 * @returns A Sharp object or null if conversion failed
 */
async function processIconImage(faviconData: Buffer, url: string, isIco: boolean): Promise<sharp.Sharp> {
  try {
    // If it's an ICO file, extract the largest image
    if (isIco) {
      const pngData = sharpIco.decode(faviconData);
      if (pngData && pngData.length > 0) {
        // Find the largest image in the ICO file
        const largestImage = pngData.reduce((prev, curr) => {
          return prev.width * prev.height >= curr.width * curr.height ? prev : curr;
        });

        // Create a sharp object directly from the raw pixel data
        const sharpObj = sharp(largestImage.data, {
          raw: {
            width: largestImage.width,
            height: largestImage.height,
            channels: 4
          }
        });

        if (FLAGS.SHOW_DEBUG_PRINTS) {
          console.log(`Extracted ${largestImage.width}x${largestImage.height} image from ICO for ${url}`);
        }
        return sharpObj;
      }
    }

    // For non-ICO files or if ICO extraction failed, create a Sharp object from the original data
    return sharp(faviconData);
  } catch (err) {
    console.error("Error processing image:", err);
    // If processing fails, return a Sharp object with the original data
    return sharp(faviconData);
  }
}

/**
 * Fetches a favicon from a URL
 * @param faviconURL The URL to fetch the favicon from
 * @returns A Promise resolving to a Buffer containing the favicon data
 */
async function fetchFavicon(faviconURL: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const request = net.request(faviconURL);
    let data: Buffer[] = [];

    request.on("response", (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch favicon: ${response.statusCode}`));
        return;
      }

      response.on("data", (chunk) => {
        data.push(Buffer.from(chunk));
      });

      response.on("end", () => {
        resolve(Buffer.concat(data));
      });

      response.on("error", (error) => {
        reject(error);
      });
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.end();
  });
}

/**
 * Stores a favicon in the database or updates an existing one
 * @param trx The transaction object
 * @param imageHash The hash of the favicon content
 * @param resizedImageBuffer The favicon image data
 * @param url The URL the favicon belongs to
 * @returns The ID of the favicon in the database
 */
async function storeFaviconInDb(
  trx: Knex.Transaction,
  imageHash: string,
  resizedImageBuffer: Buffer,
  url: string
): Promise<number> {
  const now = new Date();

  // Check if favicon already exists
  const existingFavicon = await trx("favicons").where("hash", imageHash).first();
  let iconId: number;

  if (existingFavicon) {
    // Favicon exists, update timestamp
    iconId = existingFavicon.id;
    await trx("favicons").where("id", iconId).update({
      last_update: now
    });
  } else {
    // Insert new favicon
    [iconId] = await trx("favicons").insert({
      hash: imageHash,
      favicon: resizedImageBuffer,
      last_update: now,
      last_requested: now
    });
  }

  // Check if URL mapping exists
  const existingUrl = await trx("favicon_urls").where("url", url).first();

  if (existingUrl) {
    // Update existing mapping
    await trx("favicon_urls").where("url", url).update({
      icon_id: iconId
    });
  } else {
    // Create new mapping
    await trx("favicon_urls").insert({
      url,
      icon_id: iconId
    });
  }

  return iconId;
}

/**
 * Fetches and processes a favicon from the given URL
 * @param url The page URL
 * @param faviconURL The URL of the favicon
 */
export function cacheFavicon(url: string, faviconURL: string): void {
  // Queue the operation to limit concurrency
  operationQueue.push(async () => {
    try {
      // Fetch the favicon
      const faviconData = await fetchFavicon(faviconURL);

      // Determine if this is an ICO file
      const faviconURLObject = new URL(faviconURL);
      const isIco = faviconURLObject.pathname.endsWith(".ico");

      // Process the image and get a Sharp object
      const sharpObj = await processIconImage(faviconData, url, isIco);

      // Resize the image and convert to PNG in a single operation
      const resizedImageBuffer = await sharpObj
        .resize(32, 32, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png()
        .toBuffer();

      // Generate content hash
      const imageHash = createHash("md5").update(resizedImageBuffer).digest("hex");

      // Store in database within a transaction to prevent SQLITE_BUSY errors
      await db.transaction(async (trx) => {
        await storeFaviconInDb(trx, imageHash, resizedImageBuffer, url);
      });

      if (FLAGS.SHOW_DEBUG_PRINTS) {
        console.log(`Cached ${isIco ? "ICO→PNG" : "original"} favicon for ${url} with hash ${imageHash}`);
      }
    } catch (error) {
      console.error("Error caching favicon:", error);
    }
  });

  // Start processing the queue
  processQueue();
}

/**
 * Retrieves a favicon for a given URL
 * @param url The URL to get the favicon for
 * @returns The favicon data as a Buffer, or null if not found
 */
export async function getFavicon(url: string): Promise<Buffer | null> {
  try {
    return await db.transaction(async (trx) => {
      // Look up the favicon in the database
      const result = await trx("favicon_urls")
        .join("favicons", "favicon_urls.icon_id", "favicons.id")
        .where("favicon_urls.url", url)
        .select("favicons.favicon", "favicons.id")
        .first();

      if (result && result.favicon) {
        // Update last_requested time
        await trx("favicons").where("id", result.id).update({
          last_requested: new Date()
        });

        return result.favicon;
      }

      return null;
    });
  } catch (error) {
    console.error("Error getting favicon:", error);
    return null;
  }
}

/**
 * Checks if a favicon exists for a given URL
 * @param url The URL to check
 * @returns True if a favicon exists, false otherwise
 */
export async function hasFavicon(url: string): Promise<boolean> {
  try {
    const count = await db("favicon_urls").where("url", url).count("* as count").first();
    return count && Number(count.count) > 0;
  } catch (error) {
    console.error("Error checking favicon:", error);
    return false;
  }
}

/**
 * Gets a data URL for a favicon
 * @param url The URL to get the favicon for
 * @returns A data URL containing the favicon, or null if not found
 */
export async function getFaviconDataUrl(url: string): Promise<string | null> {
  try {
    const favicon = await getFavicon(url);
    if (!favicon) {
      return null;
    }

    // Convert the favicon to a data URL
    return `data:image/png;base64,${favicon.toString("base64")}`;
  } catch (error) {
    console.error("Error getting favicon data URL:", error);
    return null;
  }
}

/**
 * Cleans up old favicons from the database
 * @param maxAge Maximum age in days before a favicon is considered old
 * @returns The number of favicons removed
 */
export async function cleanupOldFavicons(maxAge: number = 90): Promise<number> {
  try {
    return await db.transaction(async (trx) => {
      // Calculate the cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAge);

      // Get favicon IDs that haven't been requested since the cutoff date
      const oldFaviconIds = await trx("favicons").where("last_requested", "<", cutoffDate).pluck("id");

      if (oldFaviconIds.length === 0) {
        return 0;
      }

      // Remove favicon URL mappings for old favicons
      await trx("favicon_urls").whereIn("icon_id", oldFaviconIds).delete();

      // Remove old favicons
      const deletedCount = await trx("favicons").whereIn("id", oldFaviconIds).delete();

      console.log(`Removed ${deletedCount} old favicons`);
      return deletedCount;
    });
  } catch (error) {
    console.error("Error cleaning up old favicons:", error);
    return 0;
  }
}
