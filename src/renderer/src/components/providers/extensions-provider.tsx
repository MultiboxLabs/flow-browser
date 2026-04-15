import { useSpaces } from "@/components/providers/spaces-provider";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
  profileId?: string | null;
}

export const ExtensionsProvider = ({ dataKey = "extensions", profileId = null, children }: ExtensionsProviderProps) => {
  const [extensions, setExtensions] = useState<SharedExtensionData[]>([]);
  const currentProfileIdRef = useRef<string | null>(profileId);
  const fetchRequestIdRef = useRef(0);
  const hasExplicitProfileScope = typeof profileId === "string" && profileId.length > 0;

  useEffect(() => {
    currentProfileIdRef.current = profileId;
  }, [profileId]);

  const fetchExtensions = useCallback(
    async (targetProfileId?: string | null) => {
      if (!flow) {
        return;
      }

      if (hasExplicitProfileScope && !targetProfileId) {
        setExtensions([]);
        return;
      }

      const requestId = ++fetchRequestIdRef.current;

      try {
        const data = targetProfileId
          ? await flow.extensions.getAllInProfile(targetProfileId)
          : await flow.extensions.getAllInCurrentProfile();

        if (!hasExplicitProfileScope) {
          if (requestId === fetchRequestIdRef.current) {
            setExtensions(data);
          }
          return;
        }

        if (requestId === fetchRequestIdRef.current && currentProfileIdRef.current === targetProfileId) {
          setExtensions(data);
        }
      } catch (error) {
        console.error("Failed to fetch extensions data:", error);
      }
    },
    [hasExplicitProfileScope]
  );

  const revalidate = useCallback(async () => {
    await fetchExtensions(currentProfileIdRef.current);
  }, [fetchExtensions]);

  // Initial fetch
  useEffect(() => {
    fetchExtensions(profileId);
  }, [profileId, fetchExtensions]);

  // When the provider scope changes, flush state immediately to avoid showing
  // the previous profile's pin state while the next profile is loading.
  useEffect(() => {
    setExtensions([]);
  }, [dataKey]);

  useEffect(() => {
    if (!flow) return;

    const unsubscribe = flow.extensions.onUpdated((profileId, data) => {
      if (!hasExplicitProfileScope || currentProfileIdRef.current === profileId) {
        setExtensions(data);
      }
    });

    return () => unsubscribe();
  }, [hasExplicitProfileScope]);

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
  return (
    <ExtensionsProvider dataKey={currentSpace?.profileId} profileId={currentSpace?.profileId ?? null}>
      {children}
    </ExtensionsProvider>
  );
}
