"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute stale time by default
            refetchOnWindowFocus: false, // avoid too many requests to OpenF1
            retry: (failureCount, error) => {
              const message = error instanceof Error ? error.message : "";
              if (/OpenF1 Error \((400|401|403|404|429)\)/.test(message)) return false;
              return failureCount < 2;
            },
            retryDelay: attempt => Math.min(1000 * 2 ** attempt, 8000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
