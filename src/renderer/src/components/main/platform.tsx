import { useEffect, useState } from "react";

export type Platform = "platform-win32" | "platform-darwin" | "platform-linux" | "platform-unknown";

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [platform, setPlatform] = useState<Platform>("platform-unknown");
  useEffect(() => {
    // Wrapped in try-catch so it still works when `flow` is not available
    // Because of electron preload scripts not running in iframes
    // https://www.google.com/search?q=electron+preload+not+working+in+iframe
    try {
      const foundPlatform = flow.app.getPlatform();

      if (foundPlatform === "win32") {
        setPlatform("platform-win32");
      } else if (foundPlatform === "darwin") {
        setPlatform("platform-darwin");
      } else if (foundPlatform === "linux") {
        setPlatform("platform-linux");
      } else {
        setPlatform("platform-unknown");
      }
    } catch {
      setPlatform("platform-unknown");
    }
  }, []);

  return <div className={platform}>{children}</div>;
}
