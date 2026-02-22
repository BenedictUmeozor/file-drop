"use client";

import { CloudUpload } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <Link
          href="/"
          className="glass-panel group flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 transition-transform hover:scale-105 active:scale-95 sm:gap-3 sm:px-5 sm:py-2"
        >
          <div className="rounded-lg bg-linear-to-br from-cyan-400 to-blue-600 p-1 text-white shadow-lg shadow-cyan-500/20 transition-shadow group-hover:shadow-cyan-500/40 sm:p-1.5">
            <CloudUpload className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-800 sm:text-xl dark:text-white">
            File<span className="text-cyan-500">Drop</span>
          </span>
        </Link>

        <nav className="glass-panel flex items-center gap-0.5 rounded-full p-1 sm:gap-1 sm:px-2">
          <Link
            href="/how-it-works"
            className="rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap text-slate-600 transition-colors hover:bg-slate-100 sm:px-4 sm:py-2 sm:text-sm dark:text-slate-300 dark:hover:bg-slate-800"
          >
            How it works
          </Link>
          <div className="mx-0.5 h-4 w-px bg-slate-200 sm:mx-1 sm:h-6 dark:bg-slate-700" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
