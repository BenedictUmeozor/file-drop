"use client";

import { CloudUpload } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold"
        >
          <div className="flex items-center justify-center rounded-md border bg-muted p-1.5 text-foreground">
            <CloudUpload className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            FileDrop
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/how-it-works"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            How it works
          </Link>
          <div className="bg-border h-4 w-px" aria-hidden="true" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
