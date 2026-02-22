"use client";

import { CloudUpload, AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ reset }: ErrorProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-900">
      <header className="flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
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
      </header>

      <main className="flex grow flex-col items-center justify-center p-4">
        <div className="flex w-full max-w-md flex-col text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Something Went Wrong
          </h1>
          <p className="mb-8 text-base text-gray-500 dark:text-gray-400">
            An unexpected error occurred. Please try again or go back to the
            home page.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          © {new Date().getFullYear()} FileDrop. Made by{" "}
          <a
            href="https://github.com/BenedictUmeozor"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-primary-light transition-colors"
          >
            Benedict
          </a>
        </p>
      </footer>
    </div>
  );
}
