"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { CloudUpload, Upload, Share2, Download, Clock, Zap, QrCode, Smartphone, Shield, HardDrive } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    number: 1,
    title: "Upload your file",
    description: "Drag and drop your file or click to browse. Supports all common formats up to 200MB.",
    icon: Upload,
  },
  {
    number: 2,
    title: "Share the link or QR code",
    description: "Get an instant shareable link and QR code. Send it via any messaging app or let others scan it.",
    icon: Share2,
  },
  {
    number: 3,
    title: "Recipient downloads",
    description: "Anyone with the link can download the file instantly. No account or app required.",
    icon: Download,
  },
  {
    number: 4,
    title: "File auto-expires",
    description: "Your file is automatically deleted after the expiry time for privacy and security.",
    icon: Clock,
  },
];

const features = [
  {
    title: "No account required",
    description: "Start sharing immediately without sign-ups or logins.",
    icon: Zap,
  },
  {
    title: "Instant QR code",
    description: "Perfect for sharing between your phone and computer.",
    icon: QrCode,
  },
  {
    title: "Works on any device",
    description: "Mobile, tablet, or desktop—just open in a browser.",
    icon: Smartphone,
  },
  {
    title: "Auto-expiration",
    description: "Files are deleted automatically for your privacy.",
    icon: Shield,
  },
  {
    title: "Up to 200MB",
    description: "Share documents, images, videos, and more.",
    icon: HardDrive,
  },
];

export default function HowItWorks() {
  return (
    <>
      <header className="relative z-50 flex w-full items-center justify-between border-b border-transparent px-6 py-5 md:px-12">
        <Link href="/" className="group flex cursor-pointer items-center gap-2">
          <div className="group-hover:border-primary/50 rounded-lg border border-slate-100 bg-white p-2 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-800">
            <CloudUpload className="text-primary h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            FileDrop
          </span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/how-it-works"
            className="text-primary text-sm font-medium transition-colors"
          >
            How it works
          </Link>
          <div className="relative h-9 w-9">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="relative flex grow flex-col items-center overflow-hidden px-4 py-12 md:py-16">
        {/* Background decorations */}
        <div
          className="bg-primary/5 dark:bg-primary/10 pointer-events-none absolute top-1/4 -left-20 h-72 w-72 rounded-full mix-blend-multiply blur-[100px] dark:mix-blend-normal"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-blue-400/5 mix-blend-multiply blur-[100px] dark:bg-blue-500/10 dark:mix-blend-normal"
          aria-hidden="true"
        />

        <div className="relative z-10 flex w-full max-w-4xl flex-col gap-16">
          {/* Page Heading */}
          <div className="animate-fade-in-up space-y-4 text-center">
            <h1 className="text-4xl leading-[1.1] font-bold tracking-tight text-slate-900 md:text-5xl dark:text-white">
              How it{" "}
              <span className="text-primary relative inline-block">
                works
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
              Share files in seconds. No sign-up, no hassle.
            </p>
          </div>

          {/* Steps Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="shadow-soft group transform rounded-2xl border border-slate-100 bg-white p-6 transition-all hover:shadow-lg dark:border-slate-700/50 dark:bg-[#2b3036] dark:shadow-none"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
                        Step {step.number}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Features Section */}
          <div className="space-y-8">
            <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-white">
              Why FileDrop?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-white/50 p-4 transition-all hover:border-slate-200 hover:bg-white dark:border-slate-700/50 dark:bg-slate-800/50 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                >
                  <div className="text-primary mt-0.5">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              Ready to share your first file?
            </p>
            <Link
              href="/"
              className="bg-primary hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-8 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
            >
              <Upload className="h-5 w-5" />
              Start sharing
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
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
