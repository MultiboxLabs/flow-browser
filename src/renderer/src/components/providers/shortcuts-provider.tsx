import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ShortcutAction } from "~/types/shortcuts";

interface ShortcutsContextValue {
  shortcuts: ShortcutAction[];
  isLoading: boolean;
  setShortcut: (actionId: string, shortcut: string) => Promise<boolean>;
  resetShortcut: (actionId: string) => Promise<boolean>;
  resetAllShortcuts: () => Promise<void>;
  formatShortcutForDisplay: (shortcut: string | null) => string;
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

export const useShortcuts = () => {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error("useShortcuts must be used within a ShortcutsProvider");
  }
  return context;
};

interface ShortcutsProviderProps {
  children: React.ReactNode;
}

export const ShortcutsProvider = ({ children }: ShortcutsProviderProps) => {
  const [shortcuts, setShortcuts] = useState<ShortcutAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Format shortcut for display
  const formatShortcutForDisplay = useCallback((shortcut: string | null): string => {
    if (!shortcut) return "None";
    return shortcut
      .replace(/\+/g, " + ")
      .replace("CommandOrControl", "⌘/Ctrl")
      .replace("ArrowUp", "↑")
      .replace("ArrowDown", "↓")
      .replace("ArrowLeft", "←")
      .replace("ArrowRight", "→");
  }, []);

  const fetchShortcuts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedShortcuts = await flow.shortcuts.getShortcuts();
      setShortcuts(fetchedShortcuts);
    } catch (error) {
      console.error("Failed to fetch shortcuts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShortcuts();

    // Add listener for shortcut updates
    const unsubscribe = flow.shortcuts.onShortcutsUpdated(() => {
      fetchShortcuts();
    });

    return () => unsubscribe();
  }, [fetchShortcuts]);

  const setShortcut = useCallback(
    async (actionId: string, shortcut: string): Promise<boolean> => {
      try {
        const success = await flow.shortcuts.setShortcut(actionId, shortcut);
        if (success) {
          fetchShortcuts(); // Refresh shortcut data
        }
        return success;
      } catch (error) {
        console.error("Error setting shortcut:", error);
        return false;
      }
    },
    [fetchShortcuts]
  );

  const resetShortcut = useCallback(
    async (actionId: string): Promise<boolean> => {
      try {
        const success = await flow.shortcuts.resetShortcut(actionId);
        if (success) {
          fetchShortcuts(); // Refresh shortcut data
        }
        return success;
      } catch (error) {
        console.error("Error resetting shortcut:", error);
        return false;
      }
    },
    [fetchShortcuts]
  );

  const resetAllShortcuts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const resetPromises = shortcuts.map((shortcut) => flow.shortcuts.resetShortcut(shortcut.id));
      await Promise.all(resetPromises);
      fetchShortcuts();
    } catch (error) {
      console.error("Failed to reset all shortcuts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [shortcuts, fetchShortcuts]);

  return (
    <ShortcutsContext.Provider
      value={{
        shortcuts,
        isLoading,
        setShortcut,
        resetShortcut,
        resetAllShortcuts,
        formatShortcutForDisplay
      }}
    >
      {children}
    </ShortcutsContext.Provider>
  );
};
