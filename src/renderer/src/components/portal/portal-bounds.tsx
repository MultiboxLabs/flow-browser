import { PlatformConsumer } from "@/components/main/platform";
import { usePortalsProvider } from "@/components/portal/provider";
import { useCopyStyles } from "@/hooks/use-copy-styles";
import { cn } from "@/lib/utils";
import { ViewLayer } from "~/layers";
import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface PortalBoundsComponentProps extends React.ComponentProps<"div"> {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  visible?: boolean;
  zIndex?: number;
  autoFocus?: boolean;
}

export function PortalBoundsComponent({
  bounds,
  visible = true,
  zIndex = ViewLayer.OVERLAY,
  autoFocus = false,
  className,
  children,
  ...args
}: PortalBoundsComponentProps) {
  const { usePortal } = usePortalsProvider();
  const portal = usePortal();
  const isVisible = visible && bounds !== null;
  const hasAutoFocusedRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useCopyStyles(portal?.window ?? null);

  useEffect(() => {
    if (!isVisible) {
      hasAutoFocusedRef.current = false;
    }
  }, [isVisible]);

  useLayoutEffect(() => {
    if (!portal?.window || portal.window.closed) return;

    try {
      flow.interface.setComponentWindowVisible(portal.id, isVisible);
    } catch (error) {
      console.warn("Failed to set portal visibility:", error);
    }
  }, [portal, isVisible]);

  useEffect(() => {
    if (!portal?.window || portal.window.closed) return;
    if (!isVisible || !autoFocus) return;
    if (hasAutoFocusedRef.current) return;

    hasAutoFocusedRef.current = true;
    try {
      flow.interface.focusComponentWindow(portal.id);
      portal.window.focus();
      portal.window.requestAnimationFrame(() => {
        wrapperRef.current?.focus();
      });
    } catch (error) {
      console.warn("Failed to focus portal:", error);
    }
  }, [portal, isVisible, autoFocus]);

  useLayoutEffect(() => {
    if (!portal?.window || portal.window.closed) return;

    try {
      flow.interface.setComponentWindowZIndex(portal.id, zIndex);
    } catch (error) {
      console.warn("Failed to set portal z-index:", error);
    }
  }, [portal, zIndex]);

  useLayoutEffect(() => {
    if (!portal?.window || portal.window.closed || !bounds) return;

    try {
      flow.interface.setComponentWindowBounds(portal.id, bounds);
    } catch (error) {
      console.warn("Failed to set portal bounds:", error);
    }
  }, [portal, bounds]);

  const wrapper =
    portal &&
    portal.window &&
    !portal.window.closed &&
    createPortal(
      <PlatformConsumer>
        <div {...args} ref={wrapperRef} tabIndex={-1} className={cn("w-screen h-screen outline-none", className)}>
          {children}
        </div>
      </PlatformConsumer>,
      portal.window.document.body,
      "portal-bounds-wrapper"
    );

  return wrapper ?? null;
}
