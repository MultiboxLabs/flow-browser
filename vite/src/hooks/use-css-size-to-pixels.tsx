import { useState, useEffect, useMemo, RefObject } from "react";
// Assuming your function is exported from this path
import { cssSizeToPixels } from "@/lib/css";

// Helper to check if ResizeObserver is supported
const hasResizeObserver = typeof window !== "undefined" && typeof ResizeObserver !== "undefined";

/**
 * React hook to convert a CSS size string (e.g., "16px", "1.5em", "50vw", "25%")
 * to its equivalent value in pixels, updating automatically when relevant
 * inputs or browser states change.
 *
 * NOTE: This hook MUST be run in a browser environment.
 * NOTE: '%' conversion accuracy depends heavily on providing the correct
 *       `propertyName` and the context element being attached to the DOM
 *       with a resolvable parent dimension/font-size. If context is
 *       missing for '%', it defaults to 0 pixels with a warning.
 * NOTE: Uses ResizeObserver for better accuracy with '%' and 'em' units if available.
 *
 * @param cssSizeString The CSS size string to convert (e.g., "10px", "2rem", "50%").
 * @param contextRef Optional React ref object pointing to the DOM element to use
 *   as context for relative units ('em', '%'). If omitted or ref is null,
 *   document.documentElement is used as the context.
 * @param propertyName Optional. The name of the CSS property this size applies to
 *   (e.g., 'width', 'height', 'font-size'). Crucial for calculating '%'.
 * @returns The calculated size in pixels. Returns 0 for ambiguous/unresolved '%'.
 */
export function useCssSizeToPixels(
  cssSizeString: string,
  contextRef?: RefObject<Element | null>,
  propertyName?: string
): number {
  const [pixelValue, setPixelValue] = useState<number>(0);

  // Get the current element from the ref, or null if not available/provided
  const contextElement = contextRef?.current ?? null;

  // Memoize parent lookup to stabilize useEffect dependencies
  const parentElement = useMemo(() => contextElement?.parentElement ?? null, [contextElement]);

  useEffect(() => {
    // Element to pass to the core calculation function.
    // Fallback to documentElement if ref is null or not provided.
    const elementForCalc = contextElement ?? document.documentElement;

    // Function to perform the calculation and update state
    const calculate = () => {
      const result = cssSizeToPixels(cssSizeString, elementForCalc, propertyName);
      // Only update state if the value has actually changed
      setPixelValue((prev) => (prev !== result ? result : prev));
    };

    // Initial calculation when effect runs
    calculate();

    // --- Set up observers and listeners ---

    // 1. Window resize listener (always needed for vw/vh units)
    window.addEventListener("resize", calculate);

    // 2. ResizeObserver for the context element itself
    // Needed for 'em' (if font-size changes based on its own size)
    // and 'line-height: %'
    let contextObserver: ResizeObserver | null = null;
    if (hasResizeObserver && contextElement) {
      try {
        contextObserver = new ResizeObserver(calculate);
        contextObserver.observe(elementForCalc); // elementForCalc is contextElement here
      } catch (error) {
        console.error("Failed to observe context element:", error);
        contextObserver = null; // Ensure it's null if observe fails
      }
    }

    // 3. ResizeObserver for the parent element
    // Needed for width/height/margin/padding % units
    let parentObserver: ResizeObserver | null = null;
    const needsParentObservation = propertyName && cssSizeString.includes("%") && parentElement;

    if (hasResizeObserver && needsParentObservation) {
      try {
        parentObserver = new ResizeObserver(calculate);
        parentObserver.observe(parentElement); // parentElement is guaranteed non-null here
      } catch (error) {
        console.error("Failed to observe parent element:", error);
        parentObserver = null; // Ensure it's null if observe fails
      }
    }

    // --- Cleanup function ---
    return () => {
      window.removeEventListener("resize", calculate);
      try {
        contextObserver?.disconnect();
      } catch (error) {
        console.error("Error disconnecting context observer:", error);
      }
      try {
        parentObserver?.disconnect();
      } catch (error) {
        console.error("Error disconnecting parent observer:", error);
      }
    };

    // --- Effect Dependencies ---
    // Recalculate if the core inputs change, or if the referenced
    // elements themselves change (captured by contextElement and parentElement)
  }, [cssSizeString, propertyName, contextElement, parentElement]);

  return pixelValue;
}
