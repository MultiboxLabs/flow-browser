import { createContext, useContext, useEffect, useMemo, useRef } from "react";

const MAX_IDLE_PORTALS = 10;
const MIN_IDLE_PORTALS = 5;

interface Portal {
  id: string;
  window: Window;
  _destroy: () => void;
}

declare global {
  interface Window {
    portals: {
      available: Map<string, Portal>;
      used: Map<string, Portal>;
    };
  }
}

if (!window.portals) {
  window.portals = {
    available: new Map(),
    used: new Map()
  };
}

interface PortalContextValue {
  takePortal: typeof takePortal;
  takeAvailablePortal: typeof takeAvailablePortal;
  getAvailablePortals: typeof getAvailablePortals;
  releasePortal: typeof releasePortal;
  removePortal: typeof removePortal;
  usePortal: typeof usePortal;
}

const PortalContext = createContext<PortalContextValue | null>(null);

function generatePortalId() {
  return Math.random().toString(36).substring(2, 15);
}

export function usePortalsProvider() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error("usePortalsProvider must be used within a PortalsProvider");
  }
  return context;
}

function createPortal() {
  const portalId = generatePortalId();

  const windowName = `portal_${portalId}`;
  const containerWin = window.open("about:blank", windowName, `componentId=${portalId}`);

  if (!containerWin) {
    return null;
  }

  const docElementStyle = containerWin.document.documentElement.style;
  const bodyStyle = containerWin.document.body.style;
  docElementStyle.overflow = "hidden";
  bodyStyle.margin = "0";
  bodyStyle.padding = "0";
  bodyStyle.backgroundColor = "white";

  const portal: Portal = {
    id: portalId,
    window: containerWin,
    _destroy: () => {
      containerWin.close();
    }
  };

  window.portals.available.set(portalId, portal);
  return portal;
}

/// UTILITY FUNCTIONS ///
function takePortal(id: string) {
  const portal = window.portals.available.get(id);
  if (portal) {
    window.portals.used.set(id, portal);
    window.portals.available.delete(id);
    return portal;
  }
  return null;
}

function takeAvailablePortal() {
  const portal = window.portals.available.values().next().value;
  if (portal) {
    window.portals.used.set(portal.id, portal);
    window.portals.available.delete(portal.id);
    return portal;
  }
  return null;
}

function getAvailablePortals() {
  return window.portals.available;
}

function releasePortal(portal: Portal) {
  portal.window.document.documentElement.style.width = `0px`;
  portal.window.document.documentElement.style.height = `0px`;
  portal.window.document.body.style.width = `0px`;
  portal.window.document.body.style.height = `0px`;

  window.portals.used.delete(portal.id);
  window.portals.available.set(portal.id, portal);

  flow.interface.setComponentWindowVisible(portal.id, false);
}

function removePortal(portal: Portal) {
  window.portals.used.delete(portal.id);
  window.portals.available.delete(portal.id);

  portal._destroy();
}

function usePortal() {
  const portalRef = useRef<Portal | null>(null);
  const portal = useMemo(() => {
    const portal = takeAvailablePortal();
    if (!portal) {
      return null;
    }
    return portal;
  }, []);
  portalRef.current = portal;

  useEffect(() => {
    return () => {
      if (portalRef.current) {
        console.log("releasePortal", portalRef.current.id);
        releasePortal(portalRef.current);
      }
    };
  }, []);

  return portal;
}

/// PROVIDER ///
export function PortalsProvider({ children }: { children: React.ReactNode }) {
  useMemo(() => {
    const availablePortals = getAvailablePortals();
    while (availablePortals.size < MIN_IDLE_PORTALS) {
      const portal = createPortal();
      if (!portal) {
        // something went wrong, stop the loop
        break;
      }
    }
  }, []);

  const optimizePortalPool = useMemo(
    () =>
      function optimizePool() {
        setTimeout(() => {
          requestIdleCallback(() => {
            const availablePortals = window.portals.available;

            // Check all the portals are still alive
            for (const portal of availablePortals.values()) {
              if (portal.window.closed) {
                removePortal(portal);
              }
            }

            // Check if we need more portals
            if (availablePortals.size < MIN_IDLE_PORTALS) {
              createPortal();
              optimizePortalPool();
              return;
            }

            // If the count of available portals exceeds MAX_UNUSED_PORTALS, close the excess portals.
            while (availablePortals.size > MAX_IDLE_PORTALS) {
              const portal = availablePortals.values().next().value;
              if (portal) {
                removePortal(portal);
              }
            }
          });
        }, 100);
      },
    []
  );

  return (
    <PortalContext.Provider
      value={{
        takePortal,
        takeAvailablePortal,
        getAvailablePortals,
        releasePortal,
        removePortal,
        usePortal
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}
