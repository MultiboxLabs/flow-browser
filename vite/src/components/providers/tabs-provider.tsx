import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { WindowTabsData } from "~/types/tabs";

interface TabsContextValue {
  tabsData: WindowTabsData | null;
  isLoading: boolean;
  revalidate: () => Promise<void>;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("useTabs must be used within a TabsProvider");
  }
  return context;
};

interface TabsProviderProps {
  children: React.ReactNode;
}

export const TabsProvider = ({ children }: TabsProviderProps) => {
  const [tabsData, setTabsData] = useState<WindowTabsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTabs = useCallback(async () => {
    if (!flow) return;
    try {
      const data = await flow.tabs.getData();
      setTabsData(data);
    } catch (error) {
      console.error("Failed to fetch tabs data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revalidate = useCallback(async () => {
    setIsLoading(true);
    await fetchTabs();
  }, [fetchTabs]);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  useEffect(() => {
    if (!flow) return;
    const unsub = flow.tabs.onDataUpdated((data) => {
      setTabsData(data);
      // Potentially set isLoading to false here if needed,
      // depending on desired behavior for updates vs initial load.
      // setIsLoading(false);
    });
    return () => unsub();
  }, []); // Re-running this effect is not necessary as the callback handles updates

  return (
    <TabsContext.Provider
      value={{
        tabsData,
        isLoading,
        revalidate
      }}
    >
      {children}
    </TabsContext.Provider>
  );
};
