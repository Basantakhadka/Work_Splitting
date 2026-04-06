"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { ReduxProvider } from "@/providers/ReduxProvider";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ReduxProvider>
          <QueryClientProvider client={queryClient}>
            <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
              {children}
            </div>
          </QueryClientProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
