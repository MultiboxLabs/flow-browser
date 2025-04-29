import { useSpaces } from "@/components/providers/spaces-provider";
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
  dataKey?: string;
}

export const ExtensionsProvider = ({ dataKey = "extensions", children }: ExtensionsProviderProps) => {
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

  // Initial fetch
  useEffect(() => {
    fetchExtensions();
  }, [fetchExtensions]);

  // When dataKey changes, flush state and refetch
  useEffect(() => {
    setExtensions([]);
    fetchExtensions();
  }, [dataKey, fetchExtensions]);

  useEffect(() => {
    if (!flow) return;

    const unsubscribe = flow.extensions.onUpdated(async (profileId, data) => {
      const currentProfileId = await flow.profiles.getUsingProfile();
      if (currentProfileId === profileId) {
        setExtensions(data);
      }
    });

    return () => unsubscribe();
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

export function ExtensionsProviderWithSpaces({ children }: { children: React.ReactNode }) {
  const { currentSpace } = useSpaces();
  return <ExtensionsProvider dataKey={currentSpace?.id}>{children}</ExtensionsProvider>;
}
