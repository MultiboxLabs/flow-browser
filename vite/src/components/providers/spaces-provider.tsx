import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Space } from "../../lib/flow/interfaces/sessions/spaces";
import { hexToOKLCHString } from "@/lib/colors";

interface SpacesContextValue {
  spaces: Space[];
  currentSpace: Space | null;
  isLoading: boolean;
  revalidate: () => Promise<void>;
  setCurrentSpace: (spaceId: string) => Promise<void>;
}

const SpacesContext = createContext<SpacesContextValue | null>(null);

export const useSpaces = () => {
  const context = useContext(SpacesContext);
  if (!context) {
    throw new Error("useSpaces must be used within a SpacesProvider");
  }
  return context;
};

interface SpacesProviderProps {
  children: React.ReactNode;
}

export const SpacesProvider = ({ children }: SpacesProviderProps) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSpaces = useCallback(async () => {
    if (!flow) return;
    try {
      const spaces = await flow.spaces.getSpaces();
      setSpaces(spaces);

      // Get and set last used space if no current space
      if (!currentSpace) {
        const lastUsedSpace = await flow.spaces.getLastUsedSpace();
        if (lastUsedSpace) {
          setCurrentSpace(lastUsedSpace);
        } else if (spaces.length > 0) {
          // If no last used space, default to first space
          setCurrentSpace(spaces[0]);
          await flow.spaces.setUsingSpace(spaces[0].profileId, spaces[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch spaces:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentSpace]);

  const revalidate = useCallback(async () => {
    setIsLoading(true);
    await fetchSpaces();
  }, [fetchSpaces]);

  const handleSetCurrentSpace = useCallback(
    async (spaceId: string) => {
      if (!flow) return;
      const space = spaces.find((s) => s.id === spaceId);
      if (!space) return;

      try {
        await flow.spaces.setUsingSpace(space.profileId, spaceId);
        setCurrentSpace(space);
      } catch (error) {
        console.error("Failed to set current space:", error);
      }
    },
    [spaces]
  );

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  useEffect(() => {
    if (!currentSpace) return;
    flow.browser.loadProfile(currentSpace.profileId);
  }, [currentSpace]);

  const bgStart = hexToOKLCHString(currentSpace?.bgStartColor || "#000000");
  const bgEnd = hexToOKLCHString(currentSpace?.bgEndColor || "#000000");

  useEffect(() => {
    const unsub = flow.spaces.onSpacesChanged(() => {
      revalidate();
    });
    return () => unsub();
  }, [revalidate]);

  return (
    <SpacesContext.Provider
      value={{
        spaces,
        currentSpace,
        isLoading,
        revalidate,
        setCurrentSpace: handleSetCurrentSpace
      }}
    >
      <style>
        {currentSpace
          ? `
          :root {
            --space-background-start: ${bgStart};
            --space-background-end: ${bgEnd};
          }
        `
          : ""}
      </style>
      {children}
    </SpacesContext.Provider>
  );
};
