import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

  const updateLocationState = () => {
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
  };

  useEffect(() => {
    // Initial location state
    updateLocationState();

    // Listen for location changes
    window.addEventListener("popstate", updateLocationState);

    // Listen for manual pushState/replaceState calls
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      updateLocationState();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      updateLocationState();
    };

    return () => {
      window.removeEventListener("popstate", updateLocationState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return <RouterContext.Provider value={routerState}>{children}</RouterContext.Provider>;
}
