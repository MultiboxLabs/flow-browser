import { PlatformProvider } from "@/components/main/platform";
import { ThemeProvider } from "@/components/main/theme";
import { RouteConfigType } from "@/types/routes";
import { ReactNode } from "react";

export const RouteConfig: RouteConfigType = {
  Providers: ({ children }: { children: ReactNode }) => {
    return (
      <PlatformProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </PlatformProvider>
    );
  }
};
