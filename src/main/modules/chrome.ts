import { createHash } from "node:crypto";

const PLATFORM_API_KEYS = {
  windows: "AIzaSyA2KlwBX3mkFo30om9LUFYQhpqLoa_BNhE",
  linux: "AIzaSyBqJZh-7pA44blAaAkH6490hUFOwX0KCYM",
  macos: "AIzaSyDr2UxVnv_U85AbhhY8XSHSIavUW0DC-sY"
} as const;

type PlatformApiKey = (typeof PLATFORM_API_KEYS)[keyof typeof PLATFORM_API_KEYS];

/**
 * Generates Chrome's `x-browser-validation` header
 * @param userAgent - The user agent to generate the header for
 * @param apiKey - The API key to use. If not provided, it will be determined based on the user agent.
 * @returns The generated header
 */
export function generateChromeValidationHeader(userAgent: string, apiKey?: PlatformApiKey | string): string {
  if (apiKey == null) {
    const ua = userAgent.toLowerCase();

    if (ua.includes("windows")) {
      apiKey = PLATFORM_API_KEYS.windows;
    } else if (ua.includes("linux")) {
      apiKey = PLATFORM_API_KEYS.linux;
    } else if (ua.includes("macintosh") || ua.includes("mac os x")) {
      apiKey = PLATFORM_API_KEYS.macos;
    } else {
      throw new Error("Unknown OS in user agent. Supply apiKey manually.");
    }
  }

  const data = apiKey + userAgent;
  const digest = createHash("sha1").update(data, "utf8").digest("base64");
  return digest;
}
