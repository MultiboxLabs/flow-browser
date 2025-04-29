/**
 * Converts a CSS size string (e.g., "16px", "1.5em", "50vw") to its
 * equivalent value in pixels.
 *
 * NOTE: This function MUST be run in a browser environment.
 * NOTE: '%' conversion is not supported due to its contextual nature.
 * NOTE: 'em' conversion requires the contextElement for accuracy.
 * NOTE: Absolute units (in, cm, mm, pt, pc) assume 96 DPI.
 *
 * @param {string} cssSizeString The CSS size string to convert (e.g., "10px", "2rem").
 * @param {Element} [contextElement=document.documentElement] The DOM element
 *   to use as context for relative units like 'em'. Defaults to the
 *   root element (<html>), which makes 'em' behave like 'rem' if no
 *   element is provided.
 * @returns {number} The calculated size in pixels, or NaN if conversion fails
 *   or the unit is unsupported (like '%').
 */
/**
 * Attempts to parse a pixel value from a CSS size string (e.g., "150px").
 * @param sizeString The string to parse.
 * @returns The numeric pixel value or NaN if parsing fails.
 */
function parsePixelValue(sizeString: string | null): number {
  if (!sizeString || !sizeString.endsWith("px")) {
    // Returns NaN for null, undefined, empty string, or non-pixel values like 'auto'
    return NaN;
  }
  return parseFloat(sizeString);
}

/**
 * Converts a CSS size string (e.g., "16px", "1.5em", "50vw", "25%") to its
 * equivalent value in pixels.
 *
 * NOTE: This function MUST be run in a browser environment.
 * NOTE: 'em' conversion requires the contextElement for accuracy.
 * NOTE: Absolute units (in, cm, mm, pt, pc) assume 96 DPI.
 * NOTE: '%' conversion accuracy depends heavily on providing the correct
 *       `propertyName` and the context element being attached to the DOM
 *       with a resolvable parent dimension/font-size. If context is
 *       missing for '%', it defaults to 0 pixels with a warning.
 *
 * @param cssSizeString The CSS size string to convert (e.g., "10px", "2rem", "50%").
 * @param contextElement The DOM element to use as context for relative units
 *   like 'em' and for resolving '%'. Defaults to the root element (<html>).
 * @param propertyName Optional. The name of the CSS property this size applies to
 *   (e.g., 'width', 'height', 'font-size'). Crucial for calculating '%'.
 * @returns The calculated size in pixels. Returns 0 for ambiguous/unresolved '%'.
 */
export function cssSizeToPixels(
  cssSizeString: string,
  contextElement: Element = document.documentElement,
  propertyName?: string
): number {
  // Basic validation and environment check
  if (
    typeof cssSizeString !== "string" ||
    cssSizeString.length === 0 ||
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
    // Return 0 instead of NaN if input is invalid but a number is desired
    console.warn(`cssSizeToPixels: Invalid input "${cssSizeString}". Returning 0.`);
    return 0;
  }

  // Regular expression to extract the value and unit
  const match = cssSizeString.trim().match(/^([-+]?(?:\d+|\d*\.\d+))([a-z%]+)?$/i);

  if (!match) {
    console.warn(`cssSizeToPixels: Could not parse format "${cssSizeString}". Returning 0.`);
    return 0; // Invalid format
  }

  const value = parseFloat(match[1]);
  const unit = match[2] ? match[2].toLowerCase() : "px"; // Default to px if no unit

  if (isNaN(value)) {
    console.warn(`cssSizeToPixels: Could not parse value from "${cssSizeString}". Returning 0.`);
    return 0; // Could not parse the number
  }

  // --- Get Base Font Sizes ---
  let rootFontSize = 16; // Default fallback
  let contextFontSize = 16; // Default fallback
  let parentFontSize = 16; // Default fallback

  // Check if documentElement is available and get its style
  if (document.documentElement) {
    try {
      const rootStyle = getComputedStyle(document.documentElement);
      rootFontSize = parseFloat(rootStyle.fontSize);
      contextFontSize = rootFontSize; // Initial default for context
      parentFontSize = rootFontSize; // Initial default for parent
    } catch (e) {
      console.warn("cssSizeToPixels: Could not get computed style for documentElement.", e);
    }
  }

  // Get context element's font size if different from root and in DOM
  if (contextElement && contextElement !== document.documentElement) {
    if (document.body?.contains(contextElement)) {
      try {
        contextFontSize = parseFloat(getComputedStyle(contextElement).fontSize);
      } catch (e) {
        console.warn("cssSizeToPixels: Could not get computed style for contextElement. Using root font size.", e);
        contextFontSize = rootFontSize;
      }
    } else {
      console.warn(
        "cssSizeToPixels: contextElement is not in the main document. Font size calculations for 'em' or 'line-height: %' might be inaccurate."
      );
      // Keep contextFontSize as rootFontSize fallback
    }
  }

  // Get parent element's font size if possible (needed for font-size: %)
  const parentElement = contextElement?.parentElement;
  if (parentElement && document.body?.contains(parentElement)) {
    try {
      parentFontSize = parseFloat(getComputedStyle(parentElement).fontSize);
    } catch (e) {
      console.warn(
        "cssSizeToPixels: Could not get computed style for parentElement. Using root font size for '%' font-size calculation.",
        e
      );
      parentFontSize = rootFontSize;
    }
  } else if (propertyName === "font-size" && unit === "%") {
    console.warn(
      "cssSizeToPixels: Cannot calculate '%' font-size accurately without a parent element in the DOM. Using root font size."
    );
    // Keep parentFontSize as rootFontSize fallback
  }

  // --- Unit Conversion ---
  switch (unit) {
    case "px":
      return value;
    case "rem":
      return value * rootFontSize;
    case "em":
      return value * contextFontSize; // Relative to context element's font size
    case "vw":
      return (value / 100) * window.innerWidth;
    case "vh":
      return (value / 100) * window.innerHeight;
    case "vmin":
      return (value / 100) * Math.min(window.innerWidth, window.innerHeight);
    case "vmax":
      return (value / 100) * Math.max(window.innerWidth, window.innerHeight);
    // Absolute units (assuming 96 DPI)
    case "in":
      return value * 96;
    case "cm":
      return value * (96 / 2.54);
    case "mm":
      return value * (96 / 25.4);
    case "pt": // 1pt = 1/72 inch
      return value * (96 / 72);
    case "pc": // 1pc = 12pt
      return value * 12 * (96 / 72);

    case "%": {
      if (!propertyName) {
        console.warn(
          `cssSizeToPixels: '%' unit used without specifying 'propertyName'. Cannot determine context. Returning 0 for "${cssSizeString}".`
        );
        return 0;
      }

      // Properties relative to parent container's dimensions
      const widthProps = [
        "width",
        "min-width",
        "max-width",
        "margin-left",
        "margin-right",
        "padding-left",
        "padding-right",
        "left",
        "right",
        "text-indent"
      ];
      const heightProps = [
        "height",
        "min-height",
        "max-height",
        "margin-top",
        "margin-bottom",
        "padding-top",
        "padding-bottom",
        "top",
        "bottom"
      ];

      if (!parentElement || !document.body?.contains(parentElement)) {
        console.warn(
          `cssSizeToPixels: Cannot calculate '%' for property '${propertyName}' without a parent element in the DOM. Returning 0 for "${cssSizeString}".`
        );
        return 0;
      }

      try {
        const parentStyle = getComputedStyle(parentElement);

        if (widthProps.includes(propertyName)) {
          const parentWidth = parsePixelValue(parentStyle.width);
          if (!isNaN(parentWidth)) {
            return (value / 100) * parentWidth;
          } else {
            console.warn(
              `cssSizeToPixels: Parent width is not a pixel value ('${parentStyle.width}') for property '${propertyName}'. Cannot calculate '%'. Returning 0 for "${cssSizeString}".`
            );
            return 0;
          }
        }

        if (heightProps.includes(propertyName)) {
          const parentHeight = parsePixelValue(parentStyle.height);
          if (!isNaN(parentHeight)) {
            return (value / 100) * parentHeight;
          } else {
            console.warn(
              `cssSizeToPixels: Parent height is not a pixel value ('${parentStyle.height}') for property '${propertyName}'. Cannot calculate '%'. Returning 0 for "${cssSizeString}".`
            );
            return 0;
          }
        }

        if (propertyName === "font-size") {
          // % font-size is relative to parent's font size
          return (value / 100) * parentFontSize;
        }

        if (propertyName === "line-height") {
          // % line-height is relative to element's own font size
          return (value / 100) * contextFontSize;
        }

        // Add more property handlers here if needed...

        console.warn(
          `cssSizeToPixels: Unsupported propertyName '${propertyName}' for '%' calculation. Returning 0 for "${cssSizeString}".`
        );
        return 0;
      } catch (e) {
        console.warn(
          `cssSizeToPixels: Error getting computed style for parent element during '%' calculation for property '${propertyName}'. Returning 0 for "${cssSizeString}".`,
          e
        );
        return 0;
      }
    }

    default:
      console.warn(`cssSizeToPixels: Unknown or unsupported unit '${unit}' in "${cssSizeString}". Returning 0.`);
      return 0; // Unknown unit
  }
}
