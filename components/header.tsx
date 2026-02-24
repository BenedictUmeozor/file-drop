"use client"

import { CloudUpload } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold"
        >
          <div className="flex items-center justify-center rounded-md bg-primary p-1 text-primary-foreground">
            <CloudUpload className="h-4 w-4" />
          </div>
          <span className="tracking-tight text-lg font-bold">
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
          <div className="h-4 w-px bg-border" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

