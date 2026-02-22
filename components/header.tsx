"use client";

import { CloudUpload } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-white border-b border-gray-200 dark:bg-slate-900 dark:border-slate-800 transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <div className="rounded-lg bg-primary p-1.5 text-white shadow-sm transition-transform group-hover:scale-105">
            <CloudUpload className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            File<span className="text-primary">Drop</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/how-it-works"
            className="hidden sm:block text-sm font-medium text-gray-600 transition-colors hover:text-primary dark:text-gray-300 dark:hover:text-primary-light"
          >
            How it works
          </Link>
          <div className="h-4 w-px bg-gray-200 dark:bg-slate-700" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
