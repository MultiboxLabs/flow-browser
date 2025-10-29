import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";
import { useUnmount } from "react-use";

interface RouterContextProps {
  protocol: string;
  origin: string;
  hostname: string;
  pathname: string;
  href: string;
  search: string;
  hash: string;
}

const RouterContext = createContext<RouterContextProps | null>(null);

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
};

interface RouterProviderProps {
  children: ReactNode;
}

export function RouterProvider({ children }: RouterProviderProps) {
  const [routerState, setRouterState] = useState<RouterContextProps>({
    protocol: "",
    origin: "",
    hostname: "",
    pathname: "",
    href: "",
    search: "",
    hash: ""
  });

  const updateLocationState = useCallback(() => {
    const location = window.location;
    setRouterState({
      protocol: location.protocol,
      origin: location.origin,
      hostname: location.hostname,
      pathname: location.pathname,
      href: location.href,
      search: location.search,
      hash: location.hash
    });
  }, []);

  // Original history methods
  const originalPushState = useMemo(() => history.pushState, []);
  const originalReplaceState = useMemo(() => history.replaceState, []);

  useMemo(() => {
    // Initial location state
    updateLocationState();

    // Listen for location changes
    window.addEventListener("popstate", updateLocationState);

    // Override history methods
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      updateLocationState();
    };
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      updateLocationState();
    };
  }, [originalPushState, originalReplaceState, updateLocationState]);

  useUnmount(() => {
    // Remove event listener
    window.removeEventListener("popstate", updateLocationState);

    // Restore back to original history methods
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  });

  return <RouterContext.Provider value={routerState}>{children}</RouterContext.Provider>;
}
