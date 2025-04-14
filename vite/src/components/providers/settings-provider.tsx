import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { NewTabMode, SidebarCollapseMode } from "@/lib/flow/interfaces/windows/settings";

interface SettingsContextValue {
  sidebarCollapseMode: SidebarCollapseMode;
  newTabMode: NewTabMode;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [sidebarCollapseMode, setSidebarCollapseMode] = useState<SidebarCollapseMode>("icon");
  const [newTabMode, setNewTabMode] = useState<NewTabMode>("omnibox");

  const fetchSettings = useCallback(async () => {
    if (!flow) return;

    const sidebarCollapsePromise = flow.settings.getSidebarCollapseMode().then((mode) => {
      setSidebarCollapseMode(mode);
    });

    const newTabPromise = flow.newTab.getCurrentNewTabMode().then((mode) => {
      setNewTabMode(mode);
    });

    await Promise.all([sidebarCollapsePromise, newTabPromise]);
  }, []);

  const revalidate = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const unsub = flow.settings.onSettingsChanged(() => {
      revalidate();
    });
    return () => unsub();
  }, [revalidate]);

  return (
    <SettingsContext.Provider
      value={{
        sidebarCollapseMode,
        newTabMode
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
