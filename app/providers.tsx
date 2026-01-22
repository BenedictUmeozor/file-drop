"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ConvexClientProvider } from "@/components/convex-provider";
import * as React from "react";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <ConvexClientProvider>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </ConvexClientProvider>
  );
}
