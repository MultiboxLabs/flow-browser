import { ThemeProvider as ThemeProviderComponent } from "@/components/main/theme";
import { RouteConfigType } from "@/types/routes";
import { Fragment, ReactNode } from "react";

// Theme makes it go all weird...
const THEME_PROVIDER_ENABLED = true;

const ThemeProvider = THEME_PROVIDER_ENABLED ? ThemeProviderComponent : Fragment;

export const RouteConfig: RouteConfigType = {
  Providers: ({ children }: { children: ReactNode }) => {
    return <ThemeProvider>{children}</ThemeProvider>;
  },
  Fallback: null
};
