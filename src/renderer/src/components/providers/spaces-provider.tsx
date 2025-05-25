import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Space } from "~/flow/interfaces/sessions/spaces";
import { hexToOKLCHString } from "@/lib/colors";
import { hex_is_light } from "@/lib/utils";
import { WindowType } from "@/components/browser-ui/main";
import { createPortal } from "react-dom";

interface SpacesContextValue {
  spaces: Space[];
  currentSpace: Space | null;
  isCurrentSpaceLight: boolean;
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
  windowType: WindowType;
  children: React.ReactNode;
}

export const SpacesProvider = ({ windowType, children }: SpacesProviderProps) => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSpaces = useCallback(async () => {
    if (!flow) return;
    try {
      const spaces = await flow.spaces.getSpaces();
      setSpaces(spaces);

      if (!currentSpace) {
        // Get and set window space if available
        const windowSpaceId = await flow.spaces.getUsingSpace();
        console.log("Setting current space to window space", windowSpaceId);
        if (windowSpaceId) {
          const windowSpace = spaces.find((s) => s.id === windowSpaceId);
          if (windowSpace) {
            setCurrentSpace(windowSpace);
            return;
          }
        }

        // Get and set last used space if no window space
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
      // Do not allow switching spaces in popup windows
      if (windowType === "popup" && currentSpace) return;

      if (!flow) return;
      const space = spaces.find((s) => s.id === spaceId);
      if (!space) return;

      if (space.id === currentSpace?.id) return;

      try {
        await flow.spaces.setUsingSpace(space.profileId, spaceId);
        setCurrentSpace(space);
      } catch (error) {
        console.error("Failed to set current space:", error);
      }
    },
    [spaces, currentSpace, windowType]
  );

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  useEffect(() => {
    if (!currentSpace) return;
    flow.browser.loadProfile(currentSpace.profileId);
  }, [currentSpace]);

  useEffect(() => {
    const unsub = flow.spaces.onSetWindowSpace((spaceId) => {
      handleSetCurrentSpace(spaceId);
    });
    return () => unsub();
  }, [handleSetCurrentSpace]);

  const bgStart = hexToOKLCHString(currentSpace?.bgStartColor || "#000000");
  const bgEnd = hexToOKLCHString(currentSpace?.bgEndColor || "#000000");

  useEffect(() => {
    const unsub = flow.spaces.onSpacesChanged(() => {
      revalidate();
    });
    return () => unsub();
  }, [revalidate]);

  const isSpaceLight = hex_is_light(currentSpace?.bgStartColor || "#000000");

  // On current space change, hide omnibox
  const currentSpaceIdRef = useRef("");
  useEffect(() => {
    if (currentSpaceIdRef.current === currentSpace?.id) return;
    if (!currentSpace) return;
    currentSpaceIdRef.current = currentSpace.id;
    flow.omnibox.hide();
  }, [currentSpace]);

  // Stylesheet Portal
  const stylesheet = (
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
  );

  return (
    <SpacesContext.Provider
      value={{
        spaces,
        currentSpace,
        isLoading,
        isCurrentSpaceLight: isSpaceLight,
        revalidate,
        setCurrentSpace: handleSetCurrentSpace
      }}
    >
      {createPortal(stylesheet, document.head)}
      {children}
    </SpacesContext.Provider>
  );
};
