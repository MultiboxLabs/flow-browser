import { ThemeProvider } from "@/components/main/theme";
import { ReactNode } from "react";

export const RouteProviders = ({ children }: { children: ReactNode }) => {
  return <ThemeProvider persist>{children}</ThemeProvider>;
};
