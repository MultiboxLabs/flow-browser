import { useEffect, useState } from "react";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface FaviconColors {
  topLeft: RGB | null;
  topRight: RGB | null;
  bottomLeft: RGB | null;
  bottomRight: RGB | null;
}

const LOGGING_ENABLED = false;

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return { h, s, l };
}

/**
 * Check if a color is vibrant enough to use
 */
function isVibrantColor(r: number, g: number, b: number): boolean {
  // Skip transparent-like or very light colors
  if (r > 240 && g > 240 && b > 240) return false;

  // Skip very dark colors
  if (r < 15 && g < 15 && b < 15) return false;

  // Check saturation
  const { s } = rgbToHsl(r, g, b);
  return s >= 0.2;
}

/**
 * Get the dominant vibrant color from a region of pixels
 */
function getDominantColorFromRegion(
  pixels: Uint8ClampedArray,
  imageWidth: number,
  startX: number,
  startY: number,
  regionSize: number
): RGB | null {
  const colorCounts = new Map<string, { color: RGB; count: number }>();

  for (let y = startY; y < startY + regionSize; y++) {
    for (let x = startX; x < startX + regionSize; x++) {
      const i = (y * imageWidth + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      // Skip transparent pixels
      if (a < 128) continue;

      // Skip non-vibrant colors
      if (!isVibrantColor(r, g, b)) continue;

      // Quantize to group similar colors
      const qr = Math.round(r / 32) * 32;
      const qg = Math.round(g / 32) * 32;
      const qb = Math.round(b / 32) * 32;
      const key = `${qr},${qg},${qb}`;

      const existing = colorCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        colorCounts.set(key, { color: { r, g, b }, count: 1 });
      }
    }
  }

  // Find the most common color in this region
  let bestColor: RGB | null = null;
  let maxCount = 0;

  for (const { color, count } of colorCounts.values()) {
    if (count > maxCount) {
      maxCount = count;
      bestColor = color;
    }
  }

  return bestColor;
}

/**
 * Extracts colors from the four corners and center of an image.
 */
function extractFaviconColors(imageUrl: string): Promise<FaviconColors | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(null);
          return;
        }

        const size = 32;
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;

        // Sample regions - each corner and center
        // Region size is about 1/3 of the image
        const regionSize = Math.floor(size / 3);

        const colors: FaviconColors = {
          topLeft: getDominantColorFromRegion(pixels, size, 0, 0, regionSize),
          topRight: getDominantColorFromRegion(pixels, size, size - regionSize, 0, regionSize),
          bottomLeft: getDominantColorFromRegion(pixels, size, 0, size - regionSize, regionSize),
          bottomRight: getDominantColorFromRegion(pixels, size, size - regionSize, size - regionSize, regionSize)
        };

        if (LOGGING_ENABLED) {
          console.log(`[useFaviconColors] Extracted colors from ${imageUrl}:`);
          console.log(
            `  topLeft: ${colors.topLeft ? `rgb(${colors.topLeft.r}, ${colors.topLeft.g}, ${colors.topLeft.b})` : "none"}`
          );
          console.log(
            `  topRight: ${colors.topRight ? `rgb(${colors.topRight.r}, ${colors.topRight.g}, ${colors.topRight.b})` : "none"}`
          );
          console.log(
            `  bottomLeft: ${colors.bottomLeft ? `rgb(${colors.bottomLeft.r}, ${colors.bottomLeft.g}, ${colors.bottomLeft.b})` : "none"}`
          );
          console.log(
            `  bottomRight: ${colors.bottomRight ? `rgb(${colors.bottomRight.r}, ${colors.bottomRight.g}, ${colors.bottomRight.b})` : "none"}`
          );
        }

        // Check if we got at least one color
        const hasAnyColor = colors.topLeft || colors.topRight || colors.bottomLeft || colors.bottomRight;
        resolve(hasAnyColor ? colors : null);
      } catch (e) {
        console.error("[useFaviconColors] Error:", e);
        resolve(null);
      }
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = imageUrl;
  });
}

// Simple in-memory cache
const colorCache = new Map<string, FaviconColors | null>();

/**
 * Hook to extract colors from favicon corners and center for creating position-matched gradients.
 */
export function useFaviconColors(faviconUrl: string | null | undefined): FaviconColors | null {
  const [colors, setColors] = useState<FaviconColors | null>(() => {
    if (!faviconUrl) return null;
    return colorCache.get(faviconUrl) ?? null;
  });

  useEffect(() => {
    if (!faviconUrl) {
      setColors(null);
      return;
    }

    // Check cache first
    const cached = colorCache.get(faviconUrl);
    if (cached !== undefined) {
      setColors(cached);
      return;
    }

    // Extract colors
    extractFaviconColors(faviconUrl).then((extractedColors) => {
      colorCache.set(faviconUrl, extractedColors);
      setColors(extractedColors);
    });
  }, [faviconUrl]);

  return colors;
}
