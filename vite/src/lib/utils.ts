import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { CircleHelpIcon, LucideIcon } from "lucide-react";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getLucideIcon(iconId: string): Promise<LucideIcon> {
  if (iconId in dynamicIconImports) {
    const IconImport = await dynamicIconImports[iconId as keyof typeof dynamicIconImports]();
    const IconComponent = IconImport.default;
    return IconComponent;
  }

  return CircleHelpIcon;
}

export async function copyTextToClipboard(text: string) {
  return await navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success("Copied to clipboard!");
      return true;
    })
    .catch(() => {
      toast.error("Failed to copy to clipboard.");
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
