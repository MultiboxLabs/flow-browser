import { useEffect, useState } from "react";

const getAppInfo = flow.app.getAppInfo;

export function useAppInfo() {
  const [appInfo, setAppInfo] = useState<Awaited<ReturnType<typeof getAppInfo>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getAppInfo()
      .then((info) => {
        setAppInfo(info);
      })
      .catch((error) => {
        console.error("Failed to fetch app info:", error);
        setAppInfo(null); // Ensure UI doesn't show stale/incorrect data
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { appInfo, isLoading };
}
