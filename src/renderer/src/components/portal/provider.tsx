import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";
import { useUnmount } from "react-use";

// Simple debounce implementation
function debounce<T extends (...args: unknown[]) => unknown>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

// Extend window interface for view methods
declare global {
  interface Window {
    view?: {
      dispose: (id: string) => void;
      release: (id: string) => void;
    };
  }
}

type PortalRef = {
  id: string;
  window: Window;
};

type PortalsCacheContextType = {
  getPortal: () => PortalRef | null;
  releasePortal: (portal: PortalRef) => void;
};

const PortalsCacheContext = createContext<PortalsCacheContextType | null>(null);

const availablePortals = new Set<PortalRef>();
const usedPortals = new Set<PortalRef>();

const MIN_IDLE_PORTALS = 5;
const MAX_IDLE_PORTALS = 15;

function createPortal(): PortalRef | null {
  const id = window.crypto.randomUUID();
  const newWindow = window.open("about:blank", "", `componentId=${id}`);

  if (!newWindow) {
    console.warn("Failed to create portal window - popup might be blocked");
    return null;
  }

  try {
    newWindow.document.title = "__NEW__";
    newWindow.document.documentElement.style.overflow = "hidden";
  } catch (error) {
    console.warn("Failed to configure portal window:", error);
    newWindow.close();
    return null;
  }

  return {
    id,
    window: newWindow
  };
}

export const PortalsProvider = ({ children }: PropsWithChildren) => {
  useMemo(() => {
    for (let i = 0; i < MIN_IDLE_PORTALS; i++) {
      const portal = createPortal();
      if (portal) {
        availablePortals.add(portal);
      }
    }
  }, []);

  const optimizePortalPool = useMemo(
    () =>
      debounce(() => {
        requestIdleCallback(() => {
          // Check if we need more portals
          if (availablePortals.size < MIN_IDLE_PORTALS) {
            const portal = createPortal();
            if (portal) {
              availablePortals.add(portal);
            }
            optimizePortalPool();
            return;
          }

          // If the count of available portals exceeds MAX_IDLE_PORTALS, close the excess portals.
          while (availablePortals.size > MAX_IDLE_PORTALS) {
            const toRemove = availablePortals.values().next().value;
            if (toRemove) {
              if (window.view?.dispose) {
                window.view.dispose(toRemove.id);
              }
              toRemove.window.close();
              availablePortals.delete(toRemove);
              usedPortals.delete(toRemove);
            }
          }
        });
      }, 100),
    []
  );

  const getPortal = useCallback((): PortalRef | null => {
    let portal: PortalRef | undefined = availablePortals.values().next().value;

    // If not available, create new one
    if (!portal) {
      const newPortal = createPortal();
      if (!newPortal) {
        return null;
      }
      portal = newPortal;
    }

    availablePortals.delete(portal);
    usedPortals.add(portal);

    optimizePortalPool();

    return portal;
  }, [optimizePortalPool]);

  const releasePortal = useCallback(
    (portal: PortalRef) => {
      // Portal might not be available in usedPortals
      // it was disposed first before releasing
      portal.window.document.body.innerHTML = "";
      portal.window.document.head.innerHTML = "";
      portal.window.document.title = "__IDLE__";

      portal.window.document.documentElement.style.width = `0px`;
      portal.window.document.documentElement.style.height = `0px`;
      portal.window.document.body.style.width = `0px`;
      portal.window.document.body.style.height = `0px`;

      setTimeout(() => {
        if (usedPortals.delete(portal)) {
          // TODO: remove dom content first
          availablePortals.add(portal);
          if (window.view?.release) {
            window.view.release(portal.id);
          }

          optimizePortalPool();
        }
      }, 50);
    },
    [optimizePortalPool]
  );

  useUnmount(() => {
    const allPortals = [...availablePortals, ...usedPortals];

    allPortals.forEach((portal) => {
      if (window.view?.dispose) {
        window.view.dispose(portal.id);
      }
      portal.window.close();
      availablePortals.delete(portal);
      usedPortals.delete(portal);
    });
  });

  return (
    <PortalsCacheContext.Provider
      value={{
        getPortal,
        releasePortal
      }}
    >
      {children}
    </PortalsCacheContext.Provider>
  );
};

export function usePortalsProvider() {
  const context = useContext(PortalsCacheContext);
  if (!context) throw new Error("usePortalsProvider must be used inside PortalsProvider");
  return context;
}
