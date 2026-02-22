"use client";

import { BackgroundDecorations } from "@/components/background-decorations";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { EXPIRY_OPTIONS, UploadZone } from "@/components/upload-zone";
import { Shield, Zap } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [expiryLabel, setExpiryLabel] = useState<string>(
    EXPIRY_OPTIONS[0].label,
  );

  return (
    <>
      <BackgroundDecorations />
      <Header />

      <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 pt-24 pb-12 dark:bg-slate-900">
        <div className="container mx-auto flex max-w-6xl flex-col items-center gap-16 lg:flex-row lg:items-start lg:justify-between">
          
          {/* Left Column: Hero Text */}
          <div className="animate-fade-in-up mt-8 max-w-xl flex-1 space-y-8 text-center lg:mt-0 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              Limitless Sharing
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
              Share files at <br />
              <span className="text-primary">warp speed.</span>
            </h1>

            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              Secure, serverless p2p file transfer. No account required. Files
              disappear automatically after download or expiry.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm font-medium text-gray-500 lg:justify-start dark:text-gray-400">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <Shield className="h-4 w-4 text-primary" />
                <span>End-to-end Encrypted</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Lightning Fast</span>
              </div>
            </div>
          </div>

          {/* Right Column: Upload Card */}
          <div className="w-full max-w-md flex-1 lg:max-w-lg">
            <div className="animate-fade-in-up overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-slate-800 dark:shadow-none [animation-delay:200ms]">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
                <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                  Upload Files
                </div>
                <div className="text-xs text-gray-500">
                  Secure Transfer
                </div>
              </div>

              <div className="p-6">
                <UploadZone onExpiryChange={setExpiryLabel} />
              </div>

              <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span>Status: Ready</span>
                  <span>Expires in: {expiryLabel}</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </main>

      <Footer variant="full" />
    </>
  );
}
