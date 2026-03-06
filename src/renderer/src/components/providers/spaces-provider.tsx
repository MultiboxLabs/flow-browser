import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Space } from "~/flow/interfaces/sessions/spaces";
import { hexToOKLCHString } from "@/lib/colors";
import { hex_is_light } from "@/lib/utils";
import { WindowType } from "@/components/old-browser-ui/main";
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
  const [allSpaces, setAllSpaces] = useState<Space[]>([]);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentSpaceRef = useRef<Space | null>(null);

  // Expose only non-hidden spaces to the UI (space switcher, carousel, etc.)
  const visibleSpaces = useMemo(() => allSpaces.filter((s) => !s.internal), [allSpaces]);

  useEffect(() => {
    currentSpaceRef.current = currentSpace;
  }, [currentSpace]);

  const fetchSpaces = useCallback(async () => {
    if (!flow) return;
    try {
      const spaces = await flow.spaces.getSpaces();
      setAllSpaces(spaces);

      if (!currentSpaceRef.current) {
        // Get and set window space if available
        const windowSpaceId = await flow.spaces.getUsingSpace();
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
          // If no last used space, default to first non-hidden space
          const firstVisible = spaces.find((s) => !s.internal) ?? spaces[0];
          setCurrentSpace(firstVisible);
          await flow.spaces.setUsingSpace(firstVisible.profileId, firstVisible.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch spaces:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revalidate = useCallback(async () => {
    setIsLoading(true);
    await fetchSpaces();
  }, [fetchSpaces]);

  const handleSetCurrentSpace = useCallback(
    async (spaceId: string) => {
      // Do not allow switching spaces in popup windows
      if (windowType === "popup" && currentSpace) return;

      // Do not allow switching away from a locked space (e.g. incognito)
      if (currentSpace?.internal) return;

      if (!flow) return;
      // Look up in allSpaces (includes hidden) so programmatic sets work
      const space = allSpaces.find((s) => s.id === spaceId);
      if (!space) return;

      // Do not allow manually switching to a hidden or locked space
      if (space.internal) return;

      if (space.id === currentSpace?.id) return;

      try {
        await flow.spaces.setUsingSpace(space.profileId, spaceId);
        setCurrentSpace(space);
      } catch (error) {
        console.error("Failed to set current space:", error);
      }
    },
    [allSpaces, currentSpace, windowType]
  );

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  useEffect(() => {
    if (!currentSpace) return;
    flow.browser.loadProfile(currentSpace.profileId);
  }, [currentSpace]);

  useEffect(() => {
    const unsub = flow.spaces.onSetWindowSpace(async (spaceId) => {
      // For programmatic space sets (e.g. initial incognito space assignment),
      // fetch fresh spaces to ensure we have the latest data (the space may
      // have been created after allSpaces was last populated).
      const freshSpaces = await flow.spaces.getSpaces();
      setAllSpaces(freshSpaces);

      const space = freshSpaces.find((s) => s.id === spaceId);
      if (space) {
        setCurrentSpace(space);
        flow.spaces.setUsingSpace(space.profileId, spaceId);
      }
    });
    return () => unsub();
  }, []);

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
        spaces: visibleSpaces,
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
