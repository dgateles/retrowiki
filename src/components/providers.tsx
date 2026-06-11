"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmProvider } from "@/components/admin/confirm-dialog";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={300}>
        <ConfirmProvider>{children}</ConfirmProvider>
      </TooltipProvider>
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
