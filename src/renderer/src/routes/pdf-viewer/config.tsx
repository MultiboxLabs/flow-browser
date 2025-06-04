import { ThemeProvider as ThemeProviderComponent } from "@/components/main/theme";
import { Fragment, ReactNode } from "react";

// Theme makes it go all weird...
const THEME_PROVIDER_ENABLED = true;

export const RouteProviders = ({ children }: { children: ReactNode }) => {
  const ThemeProvider = THEME_PROVIDER_ENABLED ? ThemeProviderComponent : Fragment;

  return <ThemeProvider>{children}</ThemeProvider>;
};
