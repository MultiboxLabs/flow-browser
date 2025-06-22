import { PlatformConsumer } from "@/components/main/platform";
import { usePortalsProvider } from "@/components/portal/provider";
import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { useCopyStyles } from "@/hooks/use-copy-styles";
import { mergeRefs } from "@/lib/merge-refs";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DEFAULT_Z_INDEX = 3;

interface PortalComponentProps extends React.ComponentProps<"div"> {
  visible?: boolean;
  zIndex?: number;
}

type PortalContextValue = {
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
};

type PortalRef = {
  id: string;
  window: Window;
};

const PortalContext = createContext<PortalContextValue>({
  x: null,
  y: null,
  width: null,
  height: null
});

export function usePortalContext() {
  const context = useContext(PortalContext);
  return context;
}

export function PortalComponent({
  visible = true,
  zIndex = DEFAULT_Z_INDEX,
  children,
  ref,
  ...args
}: PortalComponentProps) {
  const { getPortal, releasePortal } = usePortalsProvider();
  const [portal, setPortal] = useState<PortalRef | null>(null);

  const holderRef = useRef<HTMLDivElement>(null);
  const mergedRef = mergeRefs([ref, holderRef]);
  const lastPortalRef = useRef(portal);

  const boundsRect = useBoundingRect(holderRef);
  const bounds = useMemo(() => {
    return {
      x: Math.round(boundsRect?.x ?? 0),
      y: Math.round(boundsRect?.y ?? 0),
      width: Math.round(boundsRect?.width ?? 0),
      height: Math.round(boundsRect?.height ?? 0)
    };
  }, [boundsRect]);

  // Get portal on mount and release on unmount
  useEffect(() => {
    const newPortal = getPortal();
    if (newPortal) {
      setPortal(newPortal);
    } else {
      console.warn("Failed to get portal - popup might be blocked");
    }

    return () => {
      if (newPortal) {
        releasePortal(newPortal);
      }
    };
  }, [getPortal, releasePortal]);

  // Update portal reference
  useEffect(() => {
    lastPortalRef.current = portal;
  }, [portal]);

  // Copy styles from parent window to portal window
  useCopyStyles(portal?.window ?? null);

  // Set up portal window body styles
  useEffect(() => {
    if (!portal?.window || portal.window.closed) return;

    try {
      const containerBody = portal.window.document.body;
      containerBody.style.margin = "0";
      containerBody.style.padding = "0";
      containerBody.style.overflow = "hidden";
    } catch (error) {
      // Portal window might be closed or inaccessible during hot reload
      console.warn("Failed to set portal window styles:", error);
    }
  }, [portal]);

  const portalChildren = useMemo(() => {
    const contextValue: PortalContextValue = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    };

    return (
      <PortalContext.Provider key="portal-context" value={contextValue}>
        <PlatformConsumer>
          <div key="portal-children" className="w-screen h-screen">
            {children}
          </div>
        </PlatformConsumer>
      </PortalContext.Provider>
    );
  }, [children, bounds]);

  // Update visibility of the portal
  useEffect(() => {
    if (!portal?.window || portal.window.closed) return;

    try {
      flow.interface.setComponentWindowVisible(portal.id, visible);
    } catch (error) {
      console.warn("Failed to set portal visibility:", error);
    }
  }, [portal, visible]);

  // Update z-index of the portal
  useEffect(() => {
    if (!portal?.window || portal.window.closed) return;

    try {
      flow.interface.setComponentWindowZIndex(portal.id, zIndex);
    } catch (error) {
      console.warn("Failed to set portal z-index:", error);
    }
  }, [portal, zIndex]);

  // Update bounds of the portal
  useEffect(() => {
    if (!portal?.window || portal.window.closed) return;
    if (!bounds) return;

    try {
      flow.interface.setComponentWindowBounds(portal.id, {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height
      });
    } catch (error) {
      console.warn("Failed to set portal bounds:", error);
    }
  }, [portal, bounds]);

  // Hot reload cleanup
  useEffect(() => {
    if (import.meta.hot) {
      import.meta.hot.dispose(() => {
        // Don't destroy portal on hot reload, just clean up references
        lastPortalRef.current = null;
      });
    }
  }, []);

  return (
    <div {...args} ref={mergedRef}>
      {portal && portal.window && !portal.window.closed && createPortal(portalChildren, portal.window.document.body)}
    </div>
  );
}
