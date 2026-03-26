import { SettingsProvider } from "@/components/providers/settings-provider";
import { SpacesProvider } from "@/components/providers/spaces-provider";
import { ThemeProvider } from "@/components/main/theme";
import { RouteConfigType } from "@/types/routes";
import { ReactNode } from "react";

export const RouteConfig: RouteConfigType = {
  Providers: ({ children }: { children: ReactNode }) => {
    return (
      <ThemeProvider>
        <SettingsProvider>
          <SpacesProvider windowType="popup">{children}</SpacesProvider>
        </SettingsProvider>
      </ThemeProvider>
    );
  }
};
