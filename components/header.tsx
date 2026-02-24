"use client";

import { CloudUpload } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="border-border/60 bg-background/70 supports-backdrop-filter:bg-background/50 sticky top-0 z-50 border-b shadow-sm backdrop-blur-xl">
      <div className="via-primary/20 absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent to-transparent" />
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-semibold transition-opacity hover:opacity-90"
        >
          <div className="from-primary to-primary/80 text-primary-foreground ring-primary/20 flex items-center justify-center rounded-lg bg-linear-to-br p-1.5 shadow-sm ring-1">
            <CloudUpload className="h-4 w-4" />
          </div>
          <span className="from-foreground to-foreground/70 bg-linear-to-r bg-clip-text text-lg font-bold tracking-tight text-transparent">
            FileDrop
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/how-it-works"
            className="group text-muted-foreground hover:text-foreground relative hidden text-sm font-medium transition-colors sm:block"
          >
            How it works
            <span className="bg-foreground absolute inset-x-0 -bottom-1 h-0.5 origin-left scale-x-0 transition-transform duration-200 ease-out group-hover:scale-x-100" />
          </Link>
          <div className="bg-border h-4 w-px" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
