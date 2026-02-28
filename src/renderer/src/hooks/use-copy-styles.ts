import { useLayoutEffect } from "react";

/**
 * Copy all styles from the main document to a target document.
 * Handles both <style> tags (matched by content) and <link rel="stylesheet">
 * tags (matched by href). Also removes any target styles that don't exist in
 * the main document.
 *
 * Exported so it can be called eagerly (e.g. portal pool pre-warming) without
 * needing a React component.
 */
export function copyStylesToDocument(targetDoc: Document) {
  // Get current styles from main document and target
  const mainStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
  const targetStyles = targetDoc.querySelectorAll('style, link[rel="stylesheet"]');

  // Track which styles we've processed
  const processedTargetStyles = new Set<number>();

  // For each style in the main document
  mainStyles.forEach((mainStyle) => {
    // For style tags, check by content
    if (mainStyle.tagName.toLowerCase() === "style") {
      const mainContent = mainStyle.textContent || "";
      let found = false;

      // Look for matching style tag in target
      for (let i = 0; i < targetStyles.length; i++) {
        const targetStyle = targetStyles[i];
        if (
          !processedTargetStyles.has(i) &&
          targetStyle.tagName.toLowerCase() === "style" &&
          targetStyle.textContent === mainContent
        ) {
          // Mark as processed
          processedTargetStyles.add(i);
          found = true;
          break;
        }
      }

      // If not found, add it
      if (!found) {
        const clonedStyle = mainStyle.cloneNode(true) as HTMLElement;
        targetDoc.head.appendChild(clonedStyle);
      }
    }
    // For link tags, check by href attribute
    else if (mainStyle.tagName.toLowerCase() === "link") {
      const mainHref = mainStyle.getAttribute("href");
      const mainRel = mainStyle.getAttribute("rel");
      let found = false;

      // Only process stylesheet links
      if (mainRel === "stylesheet" && mainHref) {
        // Look for matching link in target
        for (let i = 0; i < targetStyles.length; i++) {
          const targetStyle = targetStyles[i];
          if (
            !processedTargetStyles.has(i) &&
            targetStyle.tagName.toLowerCase() === "link" &&
            targetStyle.getAttribute("href") === mainHref
          ) {
            // Update attributes if needed
            const mainMedia = mainStyle.getAttribute("media");
            const targetMedia = targetStyle.getAttribute("media");
            if (mainMedia !== targetMedia) {
              targetStyle.setAttribute("media", mainMedia || "");
            }

            const mainDisabled = mainStyle.getAttribute("disabled");
            const targetDisabled = targetStyle.getAttribute("disabled");
            if (mainDisabled !== targetDisabled) {
              if (mainDisabled) {
                targetStyle.setAttribute("disabled", mainDisabled);
              } else {
                targetStyle.removeAttribute("disabled");
              }
            }

            // Mark as processed
            processedTargetStyles.add(i);
            found = true;
            break;
          }
        }

        // If not found, add it
        if (!found) {
          const clonedStyle = mainStyle.cloneNode(true) as HTMLElement;
          targetDoc.head.appendChild(clonedStyle);
        }
      }
    }
  });

  // Remove any target styles that don't exist in the main document
  for (let i = 0; i < targetStyles.length; i++) {
    if (!processedTargetStyles.has(i)) {
      targetStyles[i].remove();
    }
  }
}

/**
 * Custom hook to copy styles from main document to a container window.
 * Uses useLayoutEffect so styles are synced before the browser paints,
 * catching any changes that occurred after pool pre-warming.
 */
export function useCopyStyles(containerWin: Window | null) {
  useLayoutEffect(() => {
    if (!containerWin) return;

    const containerDoc = containerWin.document;

    // Initial style copy
    copyStylesToDocument(containerDoc);

    // Set up a MutationObserver to watch for style changes in the main document
    const styleObserver = new MutationObserver(() => {
      if (containerWin && !containerWin.closed) {
        copyStylesToDocument(containerDoc);
      }
    });

    // Observe the document head for changes to styles
    styleObserver.observe(document.head, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "media", "disabled"],
      characterData: true // Observe text content changes in <style> tags
    });

    // Clean up observer when component unmounts
    return () => {
      styleObserver.disconnect();
    };
  }, [containerWin]);
}
