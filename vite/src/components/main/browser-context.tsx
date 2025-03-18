/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useRef, useCallback, ReactNode, useContext } from "react";
import { parseAddressBarInput, transformUrl } from "@/lib/url";

type Tab = chrome.tabs.Tab;

type BrowserContextType = {
  tabs: Tab[];
  activeTabId: number;
  activeTab: Tab | null;
  addressUrl: string;
  dynamicTitle: string | null;
  currentWindow: chrome.windows.Window | null;
  handleTabClick: (tabId: number) => void;
  handleTabClose: (tabId: number, event: React.MouseEvent) => void;
  handleCreateTab: () => void;
  handleAddressUrlSubmit: () => void;
  setAddressUrl: (url: string) => void;
  handleGoBack: () => void;
  handleGoForward: () => void;
  handleReload: () => void;
  handleMinimize: () => void;
  handleMaximize: () => void;
  handleClose: () => void;
};

const BrowserContext = createContext<BrowserContextType | null>(null);

export const BrowserProvider = ({ children }: { children: ReactNode }) => {
  // Setup Refs
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [addressUrl, setAddressUrl] = useState<string>("");
  const [dynamicTitle, setDynamicTitle] = useState<string | null>(null);

  // Address URL
  const addressUrl_urlRef = useRef<string | undefined>(undefined);
  const addressUrl_tabIdRef = useRef<number | undefined>(activeTabId);
  useEffect(() => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (activeTab?.url) {
      const urlChanged = activeTab.url !== addressUrl_urlRef.current;
      const tabIdChanged = activeTab.id !== addressUrl_tabIdRef.current;

      if (urlChanged || tabIdChanged) {
        addressUrl_urlRef.current = activeTab.url;
        addressUrl_tabIdRef.current = activeTab.id;

        const transformedUrl = transformUrl(activeTab.url);
        if (!transformedUrl) {
          setAddressUrl(activeTab.url);
        } else {
          if (transformedUrl && transformedUrl !== "flow://new") {
            setAddressUrl(transformedUrl);
          } else {
            setAddressUrl("");
          }
        }
      }
    } else {
      addressUrl_urlRef.current = undefined;
      addressUrl_tabIdRef.current = undefined;

      setAddressUrl("");
    }
  }, [activeTabId, tabs]);

  // Get current window
  const [currentWindow, setCurrentWindow] = useState<chrome.windows.Window | null>(null);
  const currentWindowRef = useRef<chrome.windows.Window | null>(null);
  useEffect(() => {
    chrome.windows.getCurrent().then((window) => {
      setCurrentWindow(window);
      currentWindowRef.current = window;
    });
  }, []);

  // Get all tabs at initial load
  useEffect(() => {
    chrome.tabs.query({}, (tabsFound) => {
      setTabs(tabsFound);

      // Find the active tab in the current window and set it as active
      const activeTab = tabsFound.find((tab) => tab.active && tab.windowId === currentWindow?.id);
      if (activeTab && activeTab.id) {
        setActiveTabId(activeTab.id);
      }
    });
  }, [currentWindow?.id]);

  // Simple Effect Hooks
  useEffect(() => {
    // Set active tab id if no active tab is found
    if (tabs.length === 0) {
      setActiveTabId(-1);
    } else if (activeTabId === -1 && tabs.length > 0) {
      const firstTabInWindow = tabs.find((tab) => tab.windowId === currentWindow?.id && tab.id);
      if (firstTabInWindow?.id) {
        setActiveTabId(firstTabInWindow.id);
      }
    }

    // Set dynamic title
    let newDynamicTitle = null;
    tabs.forEach((tab) => {
      if (tab.title && tab.id === activeTabId) {
        newDynamicTitle = tab.title;
      }
    });
    setDynamicTitle(newDynamicTitle);
  }, [tabs, activeTabId, currentWindow?.id]);

  // Fetch active tab
  useEffect(() => {
    if (activeTabId === -1) {
      setActiveTab(null);
    } else {
      const activeTab = tabs.find((tab) => tab.id === activeTabId);
      if (activeTab) {
        setActiveTab(activeTab);
      }
    }
  }, [activeTabId, tabs]);

  // Tab event listeners
  // Use refs to always have access to the latest state and callbacks
  const tabsRef = useRef(tabs);
  const activeTabIdRef = useRef(activeTabId);
  const addressUrlRef = useRef(addressUrl);

  // Update refs when state changes
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  useEffect(() => {
    activeTabIdRef.current = activeTabId;
  }, [activeTabId]);

  useEffect(() => {
    addressUrlRef.current = addressUrl;
  }, [addressUrl]);

  // Stable event handlers that use the refs
  const stableHandleTabCreated = useCallback((tab: chrome.tabs.Tab) => {
    const currentWindow = currentWindowRef.current;

    if (tab.windowId !== currentWindow?.id) return;
    if (!tab.id) return;

    setTabs((prevTabs) => {
      const filteredTabs = prevTabs
        .map((t) => {
          if (t.id === tab.id) {
            return null;
          }
          return t;
        })
        .filter((t): t is Tab => t !== null);
      return [...filteredTabs, tab];
    });

    console.log("Tab Created!", tab.id, tab);
  }, []);

  const stableHandleTabUpdated = useCallback(
    (tabId: number, _changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      setTabs((prevTabs) =>
        prevTabs.map((t) => {
          if (t.id === tabId) {
            return tab;
          }
          return t;
        })
      );
    },
    []
  );

  const stableHandleTabRemoved = useCallback((tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => {
    setTabs((prevTabs) => prevTabs.filter((t) => t.id !== tabId));
    console.log("Tab Removed!", tabId, removeInfo);
  }, []);

  const stableHandleTabActivated = useCallback((activeInfo: chrome.tabs.TabActiveInfo) => {
    const currentWindow = currentWindowRef.current;

    if (activeInfo.windowId === currentWindow?.id) {
      setActiveTabId(activeInfo.tabId);
    }

    setTabs((prevTabs) => {
      if (activeInfo.windowId !== currentWindow?.id) {
        // The active tab is in another window, ignore.
        return prevTabs;
      }

      return prevTabs.map((tab) => {
        // Ignore tabs that are not in the current window
        if (tab.windowId !== currentWindow?.id) return tab;

        // Update the active tab if it is in the current window
        return {
          ...tab,
          active: tab.id === activeInfo.tabId
        };
      });
    });

    console.log("Tab Activated!", activeInfo.tabId, activeInfo.windowId);
  }, []);

  // Setup listeners only once
  useEffect(() => {
    if (!chrome.tabs) return;

    chrome.tabs.onCreated.addListener(stableHandleTabCreated);
    chrome.tabs.onUpdated.addListener(stableHandleTabUpdated);
    chrome.tabs.onRemoved.addListener(stableHandleTabRemoved);
    chrome.tabs.onActivated.addListener(stableHandleTabActivated);

    return () => {
      chrome.tabs.onCreated.removeListener(stableHandleTabCreated);
      chrome.tabs.onUpdated.removeListener(stableHandleTabUpdated);
      chrome.tabs.onRemoved.removeListener(stableHandleTabRemoved);
      chrome.tabs.onActivated.removeListener(stableHandleTabActivated);
    };
  }, [stableHandleTabCreated, stableHandleTabUpdated, stableHandleTabRemoved, stableHandleTabActivated]);

  // Event Handlers
  const handleTabClick = useCallback(
    (tabId: number) => {
      tabs.forEach((tab) => {
        if (tab.id === tabId) {
          chrome.tabs.update(tabId, { active: true });
        } else {
          chrome.tabs.update(tabId, { active: false });
        }
      });
    },
    [tabs]
  );

  const handleTabClose = useCallback((tabId: number, event: React.MouseEvent) => {
    // Prevent the click event from bubbling up to the tab
    event.stopPropagation();
    chrome.tabs.remove(tabId);
  }, []);

  const handleCreateTab = useCallback(() => {
    chrome.tabs.create({});
  }, []);

  const handleAddressUrlSubmit = useCallback(() => {
    const parsedUrl = parseAddressBarInput(addressUrl);
    if (parsedUrl && activeTabId && activeTabId > 0) {
      chrome.tabs.update(activeTabId, { url: parsedUrl });
    } else if (parsedUrl) {
      // If no active tab or invalid tab ID, create a new tab with the URL
      chrome.tabs.create({ url: parsedUrl });
    }
  }, [addressUrl, activeTabId]);

  const handleGoBack = useCallback(() => {
    chrome.tabs.goBack();
  }, []);

  const handleGoForward = useCallback(() => {
    chrome.tabs.goForward();
  }, []);

  const handleReload = useCallback(() => {
    chrome.tabs.reload();
  }, []);

  const handleMinimize = useCallback(() => {
    if (!currentWindow?.id) return;

    chrome.windows.update(currentWindow.id, { state: "minimized" });
  }, [currentWindow]);

  const handleMaximize = useCallback(() => {
    if (!currentWindow?.id) return;

    chrome.windows.update(currentWindow.id, { state: "maximized" });
  }, [currentWindow]);

  const handleClose = useCallback(() => {
    if (!currentWindow?.id) return;

    chrome.windows.remove(currentWindow.id);
  }, [currentWindow]);

  const value = {
    tabs,
    activeTabId,
    activeTab,
    addressUrl,
    dynamicTitle,
    currentWindow,
    handleTabClick,
    handleTabClose,
    handleCreateTab,
    handleAddressUrlSubmit,
    setAddressUrl,
    handleGoBack,
    handleGoForward,
    handleReload,
    handleMinimize,
    handleMaximize,
    handleClose
  };

  return <BrowserContext.Provider value={value}>{children}</BrowserContext.Provider>;
};

export const useBrowser = () => {
  const context = useContext(BrowserContext);

  if (!context) {
    throw new Error("useBrowser must be used within a BrowserProvider");
  }

  return context;
};
