import { ThemeProvider } from "@/components/main/theme";
import { DownloadsProvider } from "@/components/downloads/manager/provider";
import { RouteConfigType } from "@/types/routes";
import { ReactNode } from "react";

export const RouteConfig: RouteConfigType = {
  Providers: ({ children }: { children: ReactNode }) => {
    return (
      <ThemeProvider forceTheme="dark">
        <DownloadsProvider>{children}</DownloadsProvider>
      </ThemeProvider>
    );
  }
};
