import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { UpdateStatus } from "~/types/updates";

interface AppUpdatesContextType {
  updateStatus: UpdateStatus | null;
  isCheckingForUpdates: boolean;
  isDownloadingUpdate: boolean;
  isInstallingUpdate: boolean;
  isAutoUpdateSupported: boolean;
  checkForUpdates: () => Promise<boolean>;
  downloadUpdate: () => Promise<boolean>;
  installUpdate: () => Promise<boolean>;
}

interface AppUpdatesProviderProps {
  children: ReactNode;
}

const AppUpdatesContext = createContext<AppUpdatesContextType | null>(null);

export function AppUpdatesProvider({ children }: AppUpdatesProviderProps) {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);
  const [isAutoUpdateSupported, setIsAutoUpdateSupported] = useState(false);

  // Initialize update status
  useEffect(() => {
    const fetchUpdateStatus = async () => {
      try {
        const status = await flow.updates.getUpdateStatus();
        setUpdateStatus(status);
      } catch (error) {
        console.error("Failed to get update status:", error);
      }
    };

    const checkAutoUpdateSupport = async () => {
      try {
        const supported = await flow.updates.isAutoUpdateSupported();
        setIsAutoUpdateSupported(supported);
      } catch (error) {
        console.error("Failed to check auto update support:", error);
        setIsAutoUpdateSupported(false);
      }
    };

    fetchUpdateStatus();
    checkAutoUpdateSupport();
  }, []);

  // Listen for update status changes
  useEffect(() => {
    const handleUpdateStatusChanged = (status: UpdateStatus) => {
      setUpdateStatus(status);
    };

    const unsubscribe = flow.updates.onUpdateStatusChanged(handleUpdateStatusChanged);

    return () => {
      // Cleanup
      unsubscribe();
    };
  }, []);

  // setIsDownloadingUpdate
  const isDownloadingUpdate = useMemo(() => {
    return !!updateStatus?.downloadProgress;
  }, [updateStatus]);

  const checkForUpdates = useCallback(async () => {
    setIsCheckingForUpdates(true);
    try {
      const isUpdateAvailable = await flow.updates.checkForUpdates();
      setIsCheckingForUpdates(false);
      return isUpdateAvailable;
    } catch (error) {
      console.error("Failed to check for updates:", error);
      setIsCheckingForUpdates(false);
      return false;
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    try {
      const success = await flow.updates.downloadUpdate();
      return success;
    } catch (error) {
      console.error("Failed to download update:", error);
      return false;
    }
  }, []);

  const installUpdate = useCallback(async () => {
    setIsInstallingUpdate(true);
    try {
      const success = await flow.updates.installUpdate();
      setIsInstallingUpdate(false);
      return success;
    } catch (error) {
      console.error("Failed to install update:", error);
      setIsInstallingUpdate(false);
      return false;
    }
  }, []);

  const value = {
    updateStatus,
    isCheckingForUpdates,
    isDownloadingUpdate,
    isInstallingUpdate,
    isAutoUpdateSupported,
    checkForUpdates,
    downloadUpdate,
    installUpdate
  };

  return <AppUpdatesContext.Provider value={value}>{children}</AppUpdatesContext.Provider>;
}

export function useAppUpdates(): AppUpdatesContextType {
  const context = useContext(AppUpdatesContext);
  if (context === null) {
    throw new Error("useAppUpdates must be used within an AppUpdatesProvider");
  }
  return context;
}
