import { useEffect, useState } from "react";

export type Platform = "platform-win32" | "platform-darwin" | "platform-linux" | "platform-unknown";

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [platform, setPlatform] = useState<Platform>("platform-unknown");
  useEffect(() => {
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
  }, []);

  return <div className={platform}>{children}</div>;
}
