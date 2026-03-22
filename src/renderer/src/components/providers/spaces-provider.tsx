import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Space } from "~/flow/interfaces/sessions/spaces";
import { hexToOKLCHString } from "@/lib/colors";
import { hex_is_light } from "@/lib/utils";
import type { BrowserUIType } from "@/components/browser-ui/types";
import { createPortal } from "react-dom";

interface SpacesContextValue {
  spaces: Space[];
  currentSpace: Space | null;
  isCurrentSpaceLight: boolean;
  isCurrentSpaceInternal: boolean;
  isProfileEphemeral: (profileId: string) => boolean;
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
  windowType: BrowserUIType;
  children: React.ReactNode;
}

export const SpacesProvider = ({ windowType, children }: SpacesProviderProps) => {
  const [allSpaces, setAllSpaces] = useState<Space[]>([]);
  const [areProfilesInternal, setAreProfilesInternal] = useState<Record<string, boolean>>({});
  const [areProfilesEphemeral, setAreProfilesEphemeral] = useState<Record<string, boolean>>({});
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentSpaceRef = useRef<Space | null>(null);

  // Expose only spaces whose profile is not internal to the UI
  const visibleSpaces = useMemo(
    () => allSpaces.filter((space) => !areProfilesInternal[space.profileId]),
    [allSpaces, areProfilesInternal]
  );

  // Whether the current space belongs to an internal profile (e.g. incognito)
  const isCurrentSpaceInternal = useMemo(
    () => (currentSpace ? Boolean(areProfilesInternal[currentSpace.profileId]) : false),
    [currentSpace, areProfilesInternal]
  );

  useEffect(() => {
    currentSpaceRef.current = currentSpace;
  }, [currentSpace]);

  const fetchSpaces = useCallback(async (preferredSpaceId?: string) => {
    if (!flow) return;
    try {
      const [spaces, profiles] = await Promise.all([flow.spaces.getSpaces(), flow.profiles.getProfiles()]);
      const nextAreProfilesInternal = Object.fromEntries(profiles.map((profile) => [profile.id, profile.internal]));
      const nextAreProfilesEphemeral = Object.fromEntries(profiles.map((profile) => [profile.id, profile.ephemeral]));
      setAllSpaces(spaces);
      setAreProfilesInternal(nextAreProfilesInternal);
      setAreProfilesEphemeral(nextAreProfilesEphemeral);

      if (preferredSpaceId) {
        const preferredSpace = spaces.find((space) => space.id === preferredSpaceId);
        if (preferredSpace) {
          setCurrentSpace(preferredSpace);
          return;
        }
      }

      const existingCurrentSpaceId = currentSpaceRef.current?.id;
      if (existingCurrentSpaceId) {
        const updatedCurrentSpace = spaces.find((space) => space.id === existingCurrentSpaceId);
        if (updatedCurrentSpace) {
          setCurrentSpace(updatedCurrentSpace);
          return;
        }
      }

      // Get and set window space if available
      const windowSpaceId = await flow.spaces.getUsingSpace();
      if (windowSpaceId) {
        const windowSpace = spaces.find((space) => space.id === windowSpaceId);
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
        const firstVisible = spaces.find((space) => !nextAreProfilesInternal[space.profileId]) ?? spaces[0];
        setCurrentSpace(firstVisible);
        await flow.spaces.setUsingSpace(firstVisible.profileId, firstVisible.id);
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

  const isProfileEphemeral = useCallback(
    (profileId: string) => {
      return Boolean(areProfilesEphemeral[profileId]);
    },
    [areProfilesEphemeral]
  );

  const handleSetCurrentSpace = useCallback(
    async (spaceId: string) => {
      if (windowType === "popup" && currentSpaceRef.current) return;
      if (!flow) return;
      const space = allSpaces.find((s) => s.id === spaceId);
      if (!space) return;
      if (space.id === currentSpaceRef.current?.id) return;

      try {
        await flow.spaces.setUsingSpace(space.profileId, spaceId);
        setCurrentSpace(space);
      } catch (error) {
        console.error("Failed to set current space:", error);
      }
    },
    [allSpaces, windowType]
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
      const space = allSpaces.find((entry) => entry.id === spaceId);
      if (space) {
        setCurrentSpace(space);
        return;
      }

      void fetchSpaces(spaceId);
    });
    return () => unsub();
  }, [allSpaces, fetchSpaces]);

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
        isProfileEphemeral,
        revalidate,
        setCurrentSpace: handleSetCurrentSpace
      }}
    >
      {createPortal(stylesheet, document.head)}
      {children}
    </SpacesContext.Provider>
  );
};
