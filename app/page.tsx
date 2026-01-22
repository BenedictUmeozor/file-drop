"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UploadZone, EXPIRY_OPTIONS } from "@/components/upload-zone";
import { CloudUpload, Info } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [expiryLabel, setExpiryLabel] = useState<string>(EXPIRY_OPTIONS[0].label);

  return (
    <>
      <header className="relative z-50 flex w-full items-center justify-between border-b border-transparent px-6 py-5 md:px-12">
        <div className="group flex cursor-pointer items-center gap-2">
          <div className="group-hover:border-primary/50 rounded-lg border border-slate-100 bg-white p-2 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-800">
            <CloudUpload className="text-primary h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            FileDrop
          </span>
        </div>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/how-it-works"
            className="hover:text-primary text-sm font-medium text-slate-500 transition-colors dark:text-slate-400"
          >
            How it works
          </Link>
          <div className="relative h-9 w-9">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="relative flex grow flex-col items-center justify-center overflow-hidden px-4 py-8">
        <div
          className="bg-primary/5 dark:bg-primary/10 pointer-events-none absolute top-1/4 -left-20 h-72 w-72 rounded-full mix-blend-multiply blur-[100px] dark:mix-blend-normal"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-blue-400/5 mix-blend-multiply blur-[100px] dark:bg-blue-500/10 dark:mix-blend-normal"
          aria-hidden="true"
        />

        <div className="relative z-10 flex w-full max-w-160 flex-col gap-10">
          {/* Page Heading */}
          <div className="animate-fade-in-up space-y-4 text-center">
            <h1 className="text-4xl leading-[1.1] font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl dark:text-white">
              Simple, temporary <br />
              <span className="text-primary relative inline-block">
                file sharing.
                <svg
                  className="text-primary/20 absolute -bottom-1 left-0 h-3 w-full"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 10"
                >
                  <path
                    d="M0 5 Q 50 10 100 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                  />
                </svg>
              </span>
            </h1>
            <p className="mx-auto max-w-md text-lg leading-relaxed text-slate-500 dark:text-slate-400">
              Share files instantly without an account.{" "}
              <br className="hidden sm:block" />
              Secure, fast, and disappearing in 10 minutes.
            </p>
          </div>

          {/* Upload Card */}
          <div className="shadow-soft transform rounded-2xl border border-slate-100 bg-white p-2 transition-all hover:shadow-lg dark:border-slate-700/50 dark:bg-[#2b3036] dark:shadow-none">
            {/* Inner Dashed Zone */}
            <UploadZone onExpiryChange={setExpiryLabel} />

            {/* Footer of Card */}
            <div className="flex flex-col items-center justify-center gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-6 py-4 text-center sm:flex-row sm:text-left dark:border-slate-700/50 dark:bg-[#323840]">
              <Info className="text-primary h-4 w-4" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                No account needed. Files expire in {expiryLabel.toLowerCase()}.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="relative z-50 w-full px-4 py-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="font-display text-xs text-slate-300 dark:text-slate-600">
            © {new Date().getFullYear()} FileDrop. Made by{" "}
            <a
              href="https://github.com/BenedictUmeozor"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors"
            >
              Benedict
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
