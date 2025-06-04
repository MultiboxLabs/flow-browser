import { ThemeProvider } from "@/components/main/theme";
import { ReactNode } from "react";

export const RouteConfig = {
  Providers: ({ children }: { children: ReactNode }) => {
    return <ThemeProvider persist>{children}</ThemeProvider>;
  },
  Fallback: null
};
