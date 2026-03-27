import { ThemeProvider } from "@/components/main/theme";
import { RouteConfigType } from "@/types/routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

function DownloadsQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5_000
          }
        }
      })
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export const RouteConfig: RouteConfigType = {
  Providers: ({ children }: { children: ReactNode }) => {
    return (
      <DownloadsQueryProvider>
        <ThemeProvider forceTheme="dark">{children}</ThemeProvider>
      </DownloadsQueryProvider>
    );
  }
};
