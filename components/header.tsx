"use client"

import { CloudUpload } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl supports-backdrop-filter:bg-background/50 shadow-sm">
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-primary/20 to-transparent" />
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-semibold transition-opacity hover:opacity-90"
        >
          <div className="flex items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/80 p-1.5 text-primary-foreground shadow-sm ring-1 ring-primary/20">
            <CloudUpload className="h-4 w-4" />
          </div>
          <span className="tracking-tight text-lg font-bold bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/70">
            FileDrop
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/how-it-works"
            className="group relative hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            How it works
            <span className="absolute inset-x-0 -bottom-1 h-0.5 origin-left scale-x-0 bg-foreground transition-transform duration-200 ease-out group-hover:scale-x-100" />
          </Link>
          <div className="h-4 w-px bg-border" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

