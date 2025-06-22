import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const TARGET_FREE_PORTALS = 10;

interface Portal {
  id: string;
  window: Window;
  using: boolean;
  _destroy: () => void;
}

interface PortalContextValue {
  portals: Portal[];
  usePortal: () => Portal | null;
  takePortal: () => Portal | null;
  removePortal: (portal: Portal) => void;
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

function createReusablePortal() {
  const portalId = generatePortalId();

  const windowName = `portal_${portalId}`;
  const containerWin = window.open("about:blank", windowName, `componentId=${portalId}`);

  if (!containerWin) {
    return null;
  }

  const portal: Portal = {
    id: portalId,
    window: containerWin,
    using: false,
    _destroy: () => {
      containerWin.close();
    }
  };
  return portal;
}

export function PortalsProvider({ children }: { children: React.ReactNode }) {
  const [portals, setPortals] = useState<Portal[]>([]);

  const portalsRef = useRef<Portal[]>([]);
  portalsRef.current = portals;

  const createPortal = useCallback(() => {
    const portal = createReusablePortal();
    console.log("createPortal", portal);
    if (portal) {
      setPortals((prev) => [...prev, portal]);
      return portal;
    }
    return null;
  }, []);

  /**
   * Get a free portal.
   */
  const getFreePortal = useCallback(() => {
    const portal = portalsRef.current.find((portal) => !portal.using);
    return portal;
  }, []);

  /**
   * Take a portal. If no portal is available, create a new one.
   */
  const takePortal = useCallback(() => {
    const portal = getFreePortal() || createPortal();
    if (portal) {
      setPortals((portals) => {
        for (const p of portals) {
          if (p.id === portal.id) {
            p.using = true;
          }
        }
        return portals;
      });
      return portal;
    }
    return createPortal();
  }, [createPortal, getFreePortal]);

  /**
   * Remove a portal. Use when the portal is no longer needed.
   */
  const removePortal = useCallback((portal: Portal) => {
    portal._destroy();
    setPortals((prev) => prev.filter((p) => p.id !== portal.id));
  }, []);

  const usePortalHook = useCallback(
    function usePortal() {
      const [portal, setPortal] = useState<Portal | null>(null);

      useEffect(() => {
        const portal = takePortal();
        setPortal(portal);

        return () => {
          if (portal) {
            removePortal(portal);
          }
        };
      }, []);

      return portal;
    },
    [removePortal, takePortal]
  );

  useEffect(() => {
    let ended = false;

    function checkPortals() {
      requestIdleCallback(() => {
        if (ended) {
          return;
        }

        const portals = portalsRef.current;

        const freePortals = portals.filter((portal) => !portal.using);
        if (freePortals.length < TARGET_FREE_PORTALS) {
          for (let i = 0; i < TARGET_FREE_PORTALS - freePortals.length; i++) {
            createPortal();
          }
        }

        // Check portals every second
        setTimeout(checkPortals, 1000);
      });
    }

    checkPortals();

    return () => {
      ended = true;

      for (const portal of portalsRef.current) {
        removePortal(portal);
      }
    };
  }, [createPortal, removePortal]);

  return (
    <PortalContext.Provider value={{ portals, takePortal, removePortal, usePortal: usePortalHook }}>
      {children}
    </PortalContext.Provider>
  );
}
