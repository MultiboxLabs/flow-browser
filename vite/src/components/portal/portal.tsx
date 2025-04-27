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
  x: number;
  y: number;
  width: string;
  height: string;
  zIndex?: number;
  ref?: React.RefObject<HTMLElement | null>;
};
export function PortalComponent({ children, x, y, width, height, zIndex, ref }: PortalComponentProps) {
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

  const widthInPixels = useCssSizeToPixels(width, parentRef, "width");
  const heightInPixels = useCssSizeToPixels(height, parentRef, "height");

  useEffect(() => {
    if (!componentId) return;

    flow.interface.setComponentWindowBounds(componentId, {
      x,
      y,
      width: widthInPixels,
      height: heightInPixels
    });
  }, [componentId, x, y, width, height, widthInPixels, heightInPixels]);

  useEffect(() => {
    if (!componentId) return;

    const zIndexValue = zIndex ?? DEFAULT_Z_INDEX;
    flow.interface.setComponentWindowZIndex(componentId, zIndexValue);
  }, [componentId, zIndex]);

  return <div ref={parentRef}>{container && createPortal(children, container)}</div>;
}
