"use client";

import { CloudUpload } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 transition-all duration-300">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="glass-panel group flex cursor-pointer items-center gap-3 rounded-full px-5 py-2 transition-transform hover:scale-105 active:scale-95"
        >
          <div className="rounded-lg bg-linear-to-br from-cyan-400 to-blue-600 p-1.5 text-white shadow-lg shadow-cyan-500/20 transition-shadow group-hover:shadow-cyan-500/40">
            <CloudUpload className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
            File<span className="text-cyan-500">Drop</span>
          </span>
        </Link>

        <nav className="glass-panel flex items-center gap-1 rounded-full p-1 px-2">
          <Link
            href="/how-it-works"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            How it works
          </Link>
          <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
