import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Space } from "~/flow/interfaces/sessions/spaces";
import type { Profile } from "~/flow/interfaces/sessions/profiles";
import { hexToOKLCHString } from "@/lib/colors";
import { hex_is_light } from "@/lib/utils";
import { WindowType } from "@/components/old-browser-ui/main";
import { createPortal } from "react-dom";

interface SpacesContextValue {
  spaces: Space[];
  currentSpace: Space | null;
  isCurrentSpaceLight: boolean;
  isCurrentSpaceInternal: boolean;
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
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentSpaceRef = useRef<Space | null>(null);

  // Derived set of internal profile IDs
  const internalProfileIds = useMemo(
    () => new Set(allProfiles.filter((p) => p.internal).map((p) => p.id)),
    [allProfiles]
  );

  // Expose only spaces whose profile is not internal to the UI
  const visibleSpaces = useMemo(
    () => allSpaces.filter((s) => !internalProfileIds.has(s.profileId)),
    [allSpaces, internalProfileIds]
  );

  // Whether the current space belongs to an internal profile (e.g. incognito)
  const isCurrentSpaceInternal = useMemo(
    () => (currentSpace ? internalProfileIds.has(currentSpace.profileId) : false),
    [currentSpace, internalProfileIds]
  );

  useEffect(() => {
    currentSpaceRef.current = currentSpace;
  }, [currentSpace]);

  const fetchSpaces = useCallback(async () => {
    if (!flow) return;
    try {
      const [spaces, profiles] = await Promise.all([flow.spaces.getSpaces(), flow.profiles.getProfiles()]);
      setAllSpaces(spaces);
      setAllProfiles(profiles);

      const localInternalIds = new Set(profiles.filter((p) => p.internal).map((p) => p.id));

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
          // If no last used space, default to first non-internal space
          const firstVisible = spaces.find((s) => !localInternalIds.has(s.profileId)) ?? spaces[0];
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

      // Do not allow switching away from an internal space (e.g. incognito)
      if (currentSpace && internalProfileIds.has(currentSpace.profileId)) return;

      if (!flow) return;
      // Look up in allSpaces (includes internal) so programmatic sets work
      const space = allSpaces.find((s) => s.id === spaceId);
      if (!space) return;

      // Do not allow manually switching to an internal space
      if (internalProfileIds.has(space.profileId)) return;

      if (space.id === currentSpace?.id) return;

      try {
        await flow.spaces.setUsingSpace(space.profileId, spaceId);
        setCurrentSpace(space);
      } catch (error) {
        console.error("Failed to set current space:", error);
      }
    },
    [allSpaces, currentSpace, internalProfileIds, windowType]
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
      // fetch fresh spaces and profiles to ensure we have the latest data.
      const [freshSpaces, freshProfiles] = await Promise.all([flow.spaces.getSpaces(), flow.profiles.getProfiles()]);
      setAllSpaces(freshSpaces);
      setAllProfiles(freshProfiles);

      const space = freshSpaces.find((s) => s.id === spaceId);
      if (space) {
        setCurrentSpace(space);
        await flow.spaces.setUsingSpace(space.profileId, spaceId);
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
        isCurrentSpaceInternal,
        revalidate,
        setCurrentSpace: handleSetCurrentSpace
      }}
    >
      {createPortal(stylesheet, document.head)}
      {children}
    </SpacesContext.Provider>
  );
};
