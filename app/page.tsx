"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { EXPIRY_OPTIONS, UploadZone } from "@/components/upload-zone";
import { CloudUpload, Github, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [expiryLabel, setExpiryLabel] = useState<string>(
    EXPIRY_OPTIONS[0].label,
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        <div className="bg-background-light dark:bg-background-dark absolute inset-0 transition-colors duration-500" />
        <div className="bg-grid-pattern absolute inset-0 opacity-[0.6] dark:opacity-[0.4]" />

        <div className="animate-pulse-slow absolute top-[-20%] left-[20%] h-125 w-125 rounded-full bg-cyan-400/20 mix-blend-multiply blur-[120px] dark:bg-cyan-500/10 dark:mix-blend-screen" />
        <div className="absolute right-[10%] bottom-[-10%] h-150 w-150 rounded-full bg-blue-400/20 mix-blend-multiply blur-[120px] dark:bg-blue-600/10 dark:mix-blend-screen" />
      </div>

      <header className="fixed top-0 right-0 left-0 z-50 transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <div className="glass-panel flex items-center gap-3 rounded-full px-5 py-2">
            <div className="rounded-lg bg-linear-to-br from-cyan-400 to-blue-600 p-1.5 text-white shadow-lg shadow-cyan-500/20">
              <CloudUpload className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
              File<span className="text-cyan-500">Drop</span>
            </span>
          </div>

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

      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-12 selection:bg-cyan-500/20">
        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-12 lg:flex-row lg:gap-20">
          <div className="animate-fade-in-up mt-8 flex-1 space-y-8 text-center md:mt-0 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-600 dark:text-cyan-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
              </span>
              Limitless Sharing
            </div>

            <h1 className="text-5xl leading-[1.1] font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl dark:text-white">
              Share files at <br />
              <span className="text-gradient">warp speed.</span>
            </h1>

            <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl lg:mx-0 dark:text-slate-400">
              Secure, serverless p2p file transfer. No account required. Files
              disappear automatically after download or expiry.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm font-medium text-slate-500 lg:justify-start dark:text-slate-400">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200/50 bg-white/50 px-4 py-2 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/50">
                <Shield className="h-4 w-4 text-cyan-500" />
                <span>End-to-end Encrypted</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200/50 bg-white/50 px-4 py-2 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/50">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Lightning Fast</span>
              </div>
            </div>
          </div>

          <div className="perspective-1000 w-full max-w-md flex-1 lg:max-w-full">
            <div className="group animate-fade-in-up relative [animation-delay:200ms]">
              <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-cyan-400 to-blue-600 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
              <div className="glass-panel relative overflow-hidden rounded-3xl p-2 sm:p-3">
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-[#161b22]">
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-[#1c222b]">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-400/80" />
                        <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                        <div className="h-3 w-3 rounded-full bg-green-400/80" />
                      </div>
                    </div>
                    <div className="font-mono text-xs text-slate-400">
                      upload_secure.box
                    </div>
                  </div>

                  <div className="p-2 sm:p-4">
                    <UploadZone onExpiryChange={setExpiryLabel} />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3 text-xs text-slate-500 sm:text-sm dark:border-slate-800 dark:bg-[#1c222b] dark:text-slate-400">
                    <span>Status: Ready</span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                      Expires in {expiryLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full py-8 text-center text-sm text-slate-400 dark:text-slate-600">
        <div className="mb-4 flex items-center justify-center gap-6">
          <Link href="#" className="transition-colors hover:text-cyan-500">
            Terms
          </Link>
          <Link href="#" className="transition-colors hover:text-cyan-500">
            Privacy
          </Link>
          <Link href="#" className="transition-colors hover:text-cyan-500">
            Security
          </Link>
        </div>
        <p className="flex items-center justify-center gap-1">
          © {new Date().getFullYear()} FileDrop. Crafted by
          <a
            href="https://github.com/BenedictUmeozor"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center gap-1 font-medium text-slate-600 transition-colors hover:text-cyan-500 dark:text-slate-400 dark:hover:text-cyan-400"
          >
            Benedict <Github className="h-3 w-3" />
          </a>
        </p>
      </footer>
    </>
  );
}
