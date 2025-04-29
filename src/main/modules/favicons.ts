// Store Favicons in a SQLite database
// This is used to provide a cache before visiting a page
// Should be 32x32px

import path from "path";
import { knex, Knex } from "knex";
import { net, Session } from "electron";
import { createHash } from "crypto";
import { FLOW_DATA_DIR } from "./paths";
import * as sharpIco from "sharp-ico";
import sharp from "sharp";
import { debugError, debugPrint } from "./output";
import { FLAGS } from "@/modules/flags";

const dbPath = path.join(FLOW_DATA_DIR, "favicons.db");

// Database configuration with optimizations for concurrency and performance
const db = knex({
  client: "better-sqlite3",
  useNullAsDefault: true,
  connection: {
    filename: dbPath
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

    debugPrint("FAVICONS", "Configured SQLite pragmas for favicons database");
  } catch (err) {
    debugError("FAVICONS", "Error configuring SQLite pragmas:", err);
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
    debugError("FAVICONS", "Error in queued operation:", error);
  } finally {
    activeOperations--;
    // Process next operation in queue
    processQueue();
  }
}

let databaseInitialized = false;
let resolveDatabaseInitialized: () => void = () => {
  databaseInitialized = true;
};
const whenDatabaseInitialized = new Promise<void>((resolve) => {
  if (databaseInitialized) {
    resolve();
  } else {
    resolveDatabaseInitialized = resolve;
  }
});

/**
 * Initialize the database
 */
async function initDatabase() {
  try {
    debugPrint("FAVICONS", "Starting database initialization...");

    // Configure database pragmas
    await configureDatabasePragmas();
    debugPrint("FAVICONS", "Database pragmas configured");

    // Ensure tables exist by creating them in sequence
    debugPrint("FAVICONS", "Checking favicons table...");
    const hasFaviconsTable = await db.schema.hasTable("favicons");
    debugPrint("FAVICONS", `Favicons table exists: ${hasFaviconsTable}`);

    if (!hasFaviconsTable) {
      debugPrint("FAVICONS", "Creating favicons table...");
      await db.schema.createTable("favicons", (table) => {
        table.increments("id").primary();
        table.string("hash").notNullable().index();
        table.timestamp("last_update");
        table.timestamp("last_requested");
        table.specificType("favicon", "blob").notNullable();
      });
      debugPrint("FAVICONS", "Created favicons table successfully");
    }

    debugPrint("FAVICONS", "Checking favicon_urls table...");
    const hasFaviconUrlsTable = await db.schema.hasTable("favicon_urls");
    debugPrint("FAVICONS", `Favicon_urls table exists: ${hasFaviconUrlsTable}`);

    if (!hasFaviconUrlsTable) {
      debugPrint("FAVICONS", "Creating favicon_urls table...");
      await db.schema.createTable("favicon_urls", (table) => {
        table.increments("id").primary();
        table.string("url").notNullable().index();
        table.integer("icon_id").references("id").inTable("favicons");
      });
      debugPrint("FAVICONS", "Created favicon_urls table successfully");
    }

    // Verify tables exist before proceeding
    debugPrint("FAVICONS", "Verifying tables exist...");
    const [faviconsExists, faviconUrlsExists] = await Promise.all([
      db.schema.hasTable("favicons"),
      db.schema.hasTable("favicon_urls")
    ]);

    debugPrint(
      "FAVICONS",
      `Final verification - Tables exist: favicons=${faviconsExists}, favicon_urls=${faviconUrlsExists}`
    );

    if (!faviconsExists || !faviconUrlsExists) {
      throw new Error("Failed to create required tables");
    }

    // Only cleanup and resolve if tables exist
    debugPrint("FAVICONS", "Running cleanup of old favicons...");
    await cleanupOldFavicons();
    debugPrint("FAVICONS", "Cleanup completed");

    resolveDatabaseInitialized();
    debugPrint("FAVICONS", "Database initialized successfully");
  } catch (err) {
    debugError("FAVICONS", "Failed to initialize favicon database:", err);
    throw err;
  }
}

// Initialize the database with retries
let retryCount = 0;
const maxRetries = 3;

async function initDatabaseWithRetry() {
  try {
    debugPrint("FAVICONS", `Starting database initialization attempt ${retryCount + 1}/${maxRetries + 1}`);
    await initDatabase();
  } catch {
    retryCount++;
    if (retryCount < maxRetries) {
      debugPrint("FAVICONS", `Retrying database initialization (attempt ${retryCount + 1}/${maxRetries + 1})...`);
      setTimeout(initDatabaseWithRetry, 1000 * retryCount); // Exponential backoff
    } else {
      debugError("FAVICONS", "Failed to initialize database after multiple attempts");
      // Resolve to prevent app from hanging, but in failed state
      resolveDatabaseInitialized();
    }
  }
}

// Start initialization
debugPrint("FAVICONS", "Starting database initialization process");
initDatabaseWithRetry();

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

        debugPrint("FAVICONS", `Extracted ${largestImage.width}x${largestImage.height} image from ICO for ${url}`);
        return sharpObj;
      }
    }

    // For non-ICO files or if ICO extraction failed, create a Sharp object from the original data
    return sharp(faviconData);
  } catch (err) {
    debugError("FAVICONS", "Error processing image:", err);
    // If processing fails, return a Sharp object with the original data
    return sharp(faviconData);
  }
}

/**
 * Detect image type from buffer content instead of relying on URL extension
 * @param buffer The image buffer data
 * @returns Object containing image type information
 */
async function detectImageType(buffer: Buffer): Promise<{ isIco: boolean; isValid: boolean }> {
  // Simple mime type detection based on magic numbers
  if (buffer.length < 4) {
    return { isIco: false, isValid: false };
  }

  // Check for ICO header - should start with 00 00 01 00
  if (buffer[0] === 0 && buffer[1] === 0 && buffer[2] === 1 && buffer[3] === 0) {
    return { isIco: true, isValid: true };
  }

  // Check for PNG header - should start with 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { isIco: false, isValid: true };
  }

  // Check for JPEG header - should start with FF D8
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return { isIco: false, isValid: true };
  }

  // Check for GIF header - should start with GIF8
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { isIco: false, isValid: true };
  }

  // Check for SVG - should contain "<svg" somewhere in the first few bytes
  const svgCheck = buffer.slice(0, Math.min(buffer.length, 100)).toString().toLowerCase();
  if (svgCheck.includes("<svg")) {
    return { isIco: false, isValid: true };
  }

  // Unknown format but attempt to process anyway
  return { isIco: false, isValid: true };
}

/**
 * Fetches a favicon from a URL with timeout
 * @param faviconURL The URL to fetch the favicon from
 * @returns A Promise resolving to a Buffer containing the favicon data
 */
async function fetchFavicon(faviconURL: string, session?: Session): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const request = net.request({
      url: faviconURL,
      session: session
    });

    const data: Buffer[] = [];

    // Set up timeout
    const timeoutId = setTimeout(() => {
      request.abort();
      reject(new Error(`Request timed out for ${faviconURL}`));
    }, 5000);

    request.on("response", (response) => {
      clearTimeout(timeoutId);

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
      clearTimeout(timeoutId);
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
 * Normalizes a URL by ensuring it has a trailing slash, removing www, and converting https to http
 * This normalization is only used for favicon caching and retrieval, not for actual requests.
 * Converting https to http is safe here since we're only using it as a cache key and not making
 * any actual network requests with the normalized URL.
 *
 * @param url The URL to normalize
 * @returns The normalized URL with a trailing slash
 */
export function normalizeURL(url: string): string {
  try {
    const parsedURL = new URL(url);

    // Remove www from hostname if present
    if (parsedURL.hostname.startsWith("www.")) {
      parsedURL.hostname = parsedURL.hostname.slice(4);
    }

    // Convert https to http for consistency in cache keys
    if (parsedURL.protocol === "https:") {
      parsedURL.protocol = "http:";
    }

    // Add trailing slash to pathname if it doesn't have one and isn't empty
    if (parsedURL.pathname && parsedURL.pathname !== "/" && !parsedURL.pathname.endsWith("/")) {
      parsedURL.pathname = `${parsedURL.pathname}/`;
    }

    // Remove query params from the URL
    parsedURL.search = "";

    // Remove hash from the URL
    parsedURL.hash = "";

    // Remove the path from the URL if the flag is enabled
    if (FLAGS.FAVICONS_REMOVE_PATH) {
      parsedURL.pathname = "";
    }

    return parsedURL.toString();
  } catch (error) {
    // If URL parsing fails, just return the original URL
    console.error(`Failed to normalize URL: ${url}`, error);
    return url;
  }
}

/**
 * Fetches and processes a favicon from the given URL
 * @param url The page URL
 * @param faviconURL The URL of the favicon
 */
export function cacheFavicon(url: string, faviconURL: string, session?: Session): void {
  // Normalize the URL
  const normalizedURL = normalizeURL(url);

  // Queue the operation to limit concurrency
  operationQueue.push(async () => {
    await whenDatabaseInitialized;

    try {
      // Fetch the favicon
      const faviconData = await fetchFavicon(faviconURL, session);

      // Check if we got valid data
      if (!faviconData || faviconData.length === 0) {
        debugPrint("FAVICONS", `Empty favicon data for ${normalizedURL}`);
        return;
      }

      // Detect image type from content
      const { isIco, isValid } = await detectImageType(faviconData);

      if (!isValid) {
        debugPrint("FAVICONS", `Invalid image data for ${normalizedURL}`);
        return;
      }

      // Process the image and get a Sharp object
      const sharpObj = await processIconImage(faviconData, normalizedURL, isIco);

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
        await storeFaviconInDb(trx, imageHash, resizedImageBuffer, normalizedURL);
      });

      debugPrint(
        "FAVICONS",
        `Cached ${isIco ? "ICO→PNG" : "original"} favicon for ${normalizedURL} with hash ${imageHash}`
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("ClientRequest only supports http: and https: protocols")) {
        // Ignore, this is expected.
        // It just means that it cannot cache the favicons of custom protocols.
        return;
      }
      debugError("FAVICONS", "Error caching favicon:", error);
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
  await whenDatabaseInitialized;
  // Normalize the URL
  const normalizedURL = normalizeURL(url);

  try {
    return await db.transaction(async (trx) => {
      // Look up the favicon in the database
      const result = await trx("favicon_urls")
        .join("favicons", "favicon_urls.icon_id", "favicons.id")
        .where("favicon_urls.url", normalizedURL)
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
    debugError("FAVICONS", "Error getting favicon:", error);
    return null;
  }
}

/**
 * Checks if a favicon exists for a given URL
 * @param url The URL to check
 * @returns True if a favicon exists, false otherwise
 */
export async function hasFavicon(url: string): Promise<boolean> {
  await whenDatabaseInitialized;
  // Normalize the URL
  const normalizedURL = normalizeURL(url);

  try {
    const count = await db("favicon_urls").where("url", normalizedURL).count("* as count").first();
    return (count && Number(count.count) > 0) ?? false;
  } catch (error) {
    debugError("FAVICONS", "Error checking favicon:", error);
    return false;
  }
}

/**
 * Gets a data URL for a favicon
 * @param url The URL to get the favicon for
 * @returns A data URL containing the favicon, or null if not found
 */
export async function getFaviconDataUrl(url: string): Promise<string | null> {
  await whenDatabaseInitialized;
  // Normalize the URL
  const normalizedURL = normalizeURL(url);

  try {
    const favicon = await getFavicon(normalizedURL);
    if (!favicon) {
      return null;
    }

    // Convert the favicon to a data URL
    return `data:image/png;base64,${favicon.toString("base64")}`;
  } catch (error) {
    debugError("FAVICONS", "Error getting favicon data URL:", error);
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
    debugPrint("FAVICONS", "Starting cleanup process...");

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAge);
    debugPrint("FAVICONS", `Cleanup cutoff date: ${cutoffDate.toISOString()}`);

    // Get favicon IDs that haven't been requested since the cutoff date
    debugPrint("FAVICONS", "Finding old favicons...");
    const oldFaviconIds = await db("favicons").where("last_requested", "<", cutoffDate).pluck("id");

    debugPrint("FAVICONS", `Found ${oldFaviconIds.length} old favicons to remove`);

    if (oldFaviconIds.length === 0) {
      debugPrint("FAVICONS", "No old favicons to clean up");
      return 0;
    }

    // Remove favicon URL mappings for old favicons
    debugPrint("FAVICONS", "Removing old favicon URL mappings...");
    const deletedUrlMappings = await db("favicon_urls").whereIn("icon_id", oldFaviconIds).delete();
    debugPrint("FAVICONS", `Removed ${deletedUrlMappings} URL mappings`);

    // Remove old favicons
    debugPrint("FAVICONS", "Removing old favicons...");
    const deletedCount = await db("favicons").whereIn("id", oldFaviconIds).delete();

    debugPrint("FAVICONS", `Successfully removed ${deletedCount} old favicons`);
    return deletedCount;
  } catch (error) {
    debugError("FAVICONS", "Error during favicon cleanup:", error);
    // Don't throw the error, just return 0 to allow initialization to continue
    return 0;
  }
}
