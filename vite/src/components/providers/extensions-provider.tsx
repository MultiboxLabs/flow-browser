import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { SharedExtensionData } from "~/types/extensions";

interface ExtensionsContextValue {
  extensions: SharedExtensionData[];
  revalidate: () => Promise<void>;
}

const ExtensionsContext = createContext<ExtensionsContextValue | null>(null);

export const useExtensions = () => {
  const context = useContext(ExtensionsContext);
  if (!context) {
    throw new Error("useExtensions must be used within an ExtensionsProvider");
  }
  return context;
};

interface ExtensionsProviderProps {
  children: React.ReactNode;
}

export const ExtensionsProvider = ({ children }: ExtensionsProviderProps) => {
  const [extensions, setExtensions] = useState<SharedExtensionData[]>([]);

  const fetchExtensions = useCallback(async () => {
    if (!flow) return;
    try {
      const data = await flow.extensions.getAllInCurrentProfile();
      setExtensions(data);
    } catch (error) {
      console.error("Failed to fetch extensions data:", error);
    }
  }, []);

  const revalidate = useCallback(async () => {
    await fetchExtensions();
  }, [fetchExtensions]);

  useEffect(() => {
    fetchExtensions();
  }, [fetchExtensions]);

  useEffect(() => {
    if (!flow) return;
    flow.extensions.onUpdated((data) => {
      setExtensions(data);
    });
    // Note: The onUpdated method doesn't return an unsubscribe function
    // based on the FlowExtensionsAPI interface
  }, []);

  return (
    <ExtensionsContext.Provider
      value={{
        extensions,
        revalidate
      }}
    >
      {children}
    </ExtensionsContext.Provider>
  );
};
