import { ThemeProvider } from "@/components/main/theme";
import { NuqsProvider } from "@/components/providers/nuqs-provider";
import { RouteConfigType } from "@/types/routes";
import { ReactNode } from "react";

export const RouteConfig: RouteConfigType = {
  Providers: ({ children }: { children: ReactNode }) => {
    return (
      <ThemeProvider forceTheme="dark">
        <NuqsProvider>{children}</NuqsProvider>
      </ThemeProvider>
    );
  }
};
