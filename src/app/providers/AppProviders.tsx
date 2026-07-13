import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { queryClient } from "@/app/queryClient";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <TooltipProvider>
            {children}
            <Sonner />
          </TooltipProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
