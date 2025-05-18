import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sometimes we cannot use `navigator.clipboard`, as this requires the webContents to be focused & active, which it might not be.
export async function copyTextToClipboardFallback(text: string) {
  flow.app.writeTextToClipboard(text);
  return true;
}

export async function copyTextToClipboard(text: string, hasToast = true) {
  let writeSuccess = await navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);

  if (!writeSuccess) {
    writeSuccess = await copyTextToClipboardFallback(text);
  }

  if (hasToast) {
    if (writeSuccess) {
      toast.success("Copied to clipboard!");
    } else {
      toast.error("Failed to copy to clipboard.");
    }
  }

  return writeSuccess;
}

/**
 * Generates a UUIDv4 string.
 * @returns A UUIDv4 string.
 */
export function generateUUID(): string {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );
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

/**
 * Crafts an active favicon URL.
 * @param tabId - The ID of the tab to craft the active favicon URL for.
 * @param faviconURL - The URL of the favicon to craft the active favicon URL for.
 * @returns The active favicon URL.
 */
export function craftActiveFaviconURL(tabId: number, faviconURL: string | null) {
  const faviconUrlObject = URL.parse(faviconURL ?? "");

  // If the favicon URL is a data URL, just render it.
  // No need to proxy it through the current tab's session.
  if (faviconUrlObject?.protocol.toLowerCase() === "data:") {
    return faviconURL;
  }

  const urlObj = new URL("flow-internal://active-favicon");

  // Tab ID is used to identify the tab and grab the favicon
  urlObj.searchParams.set("tabId", tabId.toString());

  // Favicon URL is only used to invalidate the cache when the favicon URL changes
  urlObj.searchParams.set("faviconURL", faviconURL ?? "");

  return urlObj.toString();
}
