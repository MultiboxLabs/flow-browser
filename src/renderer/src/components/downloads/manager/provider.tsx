import type { DownloadRecord, DownloadState } from "~/types/downloads";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

interface DownloadsContextValue {
  downloads: DownloadRecord[];
  fileExistence: Record<string, boolean>;
  isLoading: boolean;
  isError: boolean;
  refresh: () => void;
}

const DownloadsContext = createContext<DownloadsContextValue | null>(null);

function isActive(state: DownloadState): boolean {
  return state === "progressing" || state === "paused";
}

export function DownloadsProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [fileExistence, setFileExistence] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const mountedRef = useRef(true);

  const fetchDownloads = useCallback(async () => {
    try {
      const all = await flow.downloads.list();
      if (!mountedRef.current) return;
      setDownloads(all);
      setIsError(false);

      // Check file existence for non-active downloads
      const idsToCheck = all.filter((dl) => !isActive(dl.state) && dl.savePath).map((dl) => dl.id);
      if (idsToCheck.length > 0) {
        const existence = await flow.downloads.checkFilesExist(idsToCheck);
        if (mountedRef.current) setFileExistence(existence);
      }
    } catch {
      if (mountedRef.current) setIsError(true);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    void fetchDownloads();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchDownloads]);

  // Listen for changes from backend
  useEffect(() => {
    const unsubscribe = flow.downloads.onChanged(() => {
      void fetchDownloads();
    });
    return unsubscribe;
  }, [fetchDownloads]);

  const value: DownloadsContextValue = {
    downloads,
    fileExistence,
    isLoading,
    isError,
    refresh: fetchDownloads
  };

  return <DownloadsContext.Provider value={value}>{children}</DownloadsContext.Provider>;
}

export function useDownloads(): DownloadsContextValue {
  const ctx = useContext(DownloadsContext);
  if (!ctx) throw new Error("useDownloads must be used within a DownloadsProvider");
  return ctx;
}
