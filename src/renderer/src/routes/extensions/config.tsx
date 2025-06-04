import { ThemeProvider } from "@/components/main/theme";
import { RouteConfigType } from "@/types/routes";
import { ReactNode } from "react";

export const RouteConfig: RouteConfigType = {
  Providers: ({ children }: { children: ReactNode }) => {
    return <ThemeProvider forceTheme="dark">{children}</ThemeProvider>;
  },
  Fallback: null
};
