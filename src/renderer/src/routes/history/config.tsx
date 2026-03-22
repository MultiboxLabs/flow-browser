import { ThemeProvider } from "@/components/main/theme";
import { NuqsProvider } from "@/components/providers/nuqs-provider";
import { RouteConfigType } from "@/types/routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

function HistoryQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000
          }
        }
      })
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export const RouteConfig: RouteConfigType = {
  Providers: ({ children }: { children: ReactNode }) => {
    return (
      <HistoryQueryProvider>
        <ThemeProvider forceTheme="dark">
          <NuqsProvider>{children}</NuqsProvider>
        </ThemeProvider>
      </HistoryQueryProvider>
    );
  }
};
