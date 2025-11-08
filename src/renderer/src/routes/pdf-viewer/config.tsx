import { ThemeProvider as ThemeProviderComponent } from "@/components/main/theme";
import { NuqsProvider } from "@/components/providers/nuqs-provider";
import { RouteConfigType } from "@/types/routes";
import { Fragment, ReactNode } from "react";

// Theme makes it go all weird...
const THEME_PROVIDER_ENABLED = true;

const ThemeProvider = THEME_PROVIDER_ENABLED ? ThemeProviderComponent : Fragment;

export const RouteConfig: RouteConfigType = {
  Providers: ({ children }: { children: ReactNode }) => {
    return (
      <ThemeProvider>
        <NuqsProvider>{children}</NuqsProvider>
      </ThemeProvider>
    );
  }
};
