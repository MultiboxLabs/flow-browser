import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function copyTextToClipboard(text: string, hasToast = true) {
  return await navigator.clipboard
    .writeText(text)
    .then(() => {
      if (hasToast) {
        toast.success("Copied to clipboard!");
      }
      return true;
    })
    .catch(() => {
      if (hasToast) {
        toast.error("Failed to copy to clipboard.");
      }
      return false;
    });
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
