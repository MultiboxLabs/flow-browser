import { usePlatform } from "@/components/main/platform";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

interface SettingsWindowContextValue {
  isMac: boolean;
  isFocused: boolean;

  // Navigation
  navigationHistory: ReactNode[];
  navigationHistoryIndex: number;

  push(node: ReactNode): void;
  pop(): ReactNode | undefined;
  replace(node: ReactNode): void;
  goTo(index: number): void;
}

function useIsFocused() {
  const [isFocused, setIsFocused] = useState(() => (typeof document !== "undefined" ? document.hasFocus() : true));
  useEffect(() => {
    function handleFocus() {
      setIsFocused(true);
    }
    function handleBlur() {
      setIsFocused(false);
    }
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);
  return isFocused;
}

const SettingsWindowContext = createContext<SettingsWindowContextValue | null>(null);

export function useSettingsWindowContext() {
  const context = useContext(SettingsWindowContext);
  if (!context) {
    throw new Error("useSettingsWindowContext must be used within a SettingsWindowProvider");
  }
  return context;
}

interface SettingsWindowProviderProps {
  initialNode?: ReactNode;
  children: ReactNode;
}

export function SettingsWindowProvider({ initialNode, children }: SettingsWindowProviderProps) {
  const { platform } = usePlatform();
  const isMac = platform === "darwin";
  const isFocused = useIsFocused();

  const [navigationHistory, setNavigationHistory] = useState<ReactNode[]>(() =>
    initialNode !== undefined ? [initialNode] : []
  );
  const [navigationHistoryIndex, setNavigationHistoryIndex] = useState<number>(() =>
    initialNode !== undefined ? 0 : -1
  );

  // Keep refs in sync so callbacks remain stable.
  const historyRef = useRef(navigationHistory);
  const indexRef = useRef(navigationHistoryIndex);
  useEffect(() => {
    historyRef.current = navigationHistory;
  }, [navigationHistory]);
  useEffect(() => {
    indexRef.current = navigationHistoryIndex;
  }, [navigationHistoryIndex]);

  const push = useCallback((node: ReactNode) => {
    const currentIndex = indexRef.current;
    const truncated = historyRef.current.slice(0, currentIndex + 1);
    const next = [...truncated, node];
    historyRef.current = next;
    indexRef.current = next.length - 1;
    setNavigationHistory(next);
    setNavigationHistoryIndex(next.length - 1);
  }, []);

  const pop = useCallback((): ReactNode | undefined => {
    const currentIndex = indexRef.current;
    if (currentIndex < 0) return undefined;
    const current = historyRef.current;
    const removed = current[currentIndex];
    const next = current.slice(0, currentIndex);
    const nextIndex = currentIndex - 1;
    historyRef.current = next;
    indexRef.current = nextIndex;
    setNavigationHistory(next);
    setNavigationHistoryIndex(nextIndex);
    return removed;
  }, []);

  const replace = useCallback((node: ReactNode) => {
    const currentIndex = indexRef.current;
    const current = historyRef.current;
    if (currentIndex < 0) {
      const next = [node];
      historyRef.current = next;
      indexRef.current = 0;
      setNavigationHistory(next);
      setNavigationHistoryIndex(0);
      return;
    }
    const next = current.slice();
    next[currentIndex] = node;
    historyRef.current = next;
    setNavigationHistory(next);
  }, []);

  const goTo = useCallback((index: number) => {
    const current = historyRef.current;
    if (index < 0 || index >= current.length) {
      throw new RangeError(`goTo(${index}) is out of range for navigation history of length ${current.length}`);
    }
    indexRef.current = index;
    setNavigationHistoryIndex(index);
  }, []);

  const value = useMemo<SettingsWindowContextValue>(
    () => ({
      isMac,
      isFocused,
      navigationHistory,
      navigationHistoryIndex,
      push,
      pop,
      replace,
      goTo
    }),
    [isMac, isFocused, navigationHistory, navigationHistoryIndex, push, pop, replace, goTo]
  );

  return <SettingsWindowContext.Provider value={value}>{children}</SettingsWindowContext.Provider>;
}

export function useSettingsNavigationCurrent(): ReactNode | undefined {
  const { navigationHistory, navigationHistoryIndex } = useSettingsWindowContext();
  if (navigationHistoryIndex < 0) return undefined;
  return navigationHistory[navigationHistoryIndex];
}

export function useSettingsNavigationCanGoBack(): boolean {
  const { navigationHistoryIndex } = useSettingsWindowContext();
  return navigationHistoryIndex > 0;
}

export function useSettingsNavigationCanGoForward(): boolean {
  const { navigationHistory, navigationHistoryIndex } = useSettingsWindowContext();
  return navigationHistoryIndex < navigationHistory.length - 1;
}
