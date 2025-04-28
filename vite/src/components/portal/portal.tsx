import { useCopyStyles } from "@/hooks/use-copy-styles";
import { useCssSizeToPixels } from "@/hooks/use-css-size-to-pixels";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DEFAULT_Z_INDEX = 3;

function generateComponentId() {
  return Math.random().toString(36).substring(2, 15);
}

type PortalComponentProps = {
  children: React.ReactNode;
  x: string | number;
  y: string | number;
  width: string | number;
  height: string | number;
  zIndex?: number;
  visible?: boolean;
  ref?: React.RefObject<HTMLElement | null>;
  anchorX?: "left" | "right";
  anchorY?: "top" | "bottom";
};
export function PortalComponent({
  children,
  x,
  y,
  width,
  height,
  zIndex,
  visible = true,
  anchorX = "left",
  anchorY = "top",
  ref
}: PortalComponentProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [componentId, setComponentId] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const containerWinRef = useRef<Window | null>(null);

  useEffect(() => {
    const newComponentId = generateComponentId();
    setComponentId(newComponentId);

    // Open the container window with a unique name based on componentId
    const windowName = `popup_${newComponentId}`;
    const containerWin = window.open("about:blank", windowName, `componentId=${newComponentId}`);
    containerWinRef.current = containerWin;

    if (containerWin) {
      // Get the document and body of the container window
      const containerDoc = containerWin.document;
      const containerBody = containerDoc.body;

      // Reset any default margins/paddings
      containerBody.style.margin = "0";
      containerBody.style.padding = "0";
      containerBody.style.overflow = "hidden";

      setContainer(containerBody);
    }

    return () => {
      if (containerWin && !containerWin.closed) {
        containerWin.close();
      }
    };
  }, []); // Remove x, y, width, height from dependencies as they shouldn't trigger window reopening

  if (ref) {
    ref.current = container;
  }

  // Use the hook for style copying
  useCopyStyles(containerWinRef.current);

  const widthString = typeof width === "string" ? width : `${width}px`;
  const heightString = typeof height === "string" ? height : `${height}px`;
  const widthInPixels = useCssSizeToPixels(widthString, parentRef, "width");
  const heightInPixels = useCssSizeToPixels(heightString, parentRef, "height");

  const xString = typeof x === "string" ? x : `${x}px`;
  const yString = typeof y === "string" ? y : `${y}px`;
  const xInPixels = useCssSizeToPixels(xString, parentRef, "left");
  const yInPixels = useCssSizeToPixels(yString, parentRef, "top");

  useEffect(() => {
    if (!componentId) return;

    // Calculate position based on anchor values
    let effectiveX = xInPixels;
    let effectiveY = yInPixels;

    // Adjust X position if anchor is "right"
    if (anchorX === "right") {
      effectiveX = xInPixels - widthInPixels;
    }

    // Adjust Y position if anchor is "bottom"
    if (anchorY === "bottom") {
      effectiveY = yInPixels - heightInPixels;
    }

    flow.interface.setComponentWindowBounds(componentId, {
      x: effectiveX,
      y: effectiveY,
      width: widthInPixels,
      height: heightInPixels
    });
  }, [componentId, xInPixels, yInPixels, widthInPixels, heightInPixels, anchorX, anchorY]);

  useEffect(() => {
    if (!componentId) return;

    const zIndexValue = zIndex ?? DEFAULT_Z_INDEX;
    flow.interface.setComponentWindowZIndex(componentId, zIndexValue);
  }, [componentId, zIndex]);

  useEffect(() => {
    if (!componentId) return;

    flow.interface.setComponentWindowVisible(componentId, visible);
  }, [componentId, visible]);

  return <div ref={parentRef}>{container && createPortal(children, container)}</div>;
}
