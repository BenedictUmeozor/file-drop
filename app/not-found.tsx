import { ThemeToggle } from "@/components/theme-toggle";
import { CloudUpload, FileQuestion, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <header className="relative z-50 flex w-full items-center justify-between border-b border-transparent px-6 py-5 md:px-12">
        <Link href="/" className="group flex cursor-pointer items-center gap-2">
          <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm transition-colors group-hover:border-primary/50 dark:border-slate-700 dark:bg-slate-800">
            <CloudUpload className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            FileDrop
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <div className="relative h-9 w-9">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="relative flex grow flex-col items-center justify-center overflow-hidden px-4 py-8">
        <div
          className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-primary/5 mix-blend-multiply blur-[100px] dark:bg-primary/10 dark:mix-blend-normal"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-blue-400/5 mix-blend-multiply blur-[100px] dark:bg-blue-500/10 dark:mix-blend-normal"
          aria-hidden="true"
        />

        <div className="relative z-10 flex w-full max-w-lg flex-col gap-6">
          <div className="animate-fade-in-up rounded-2xl border border-slate-100 bg-white p-8 shadow-soft dark:border-slate-700/50 dark:bg-[#2b3036] dark:shadow-none">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-500/10">
                <FileQuestion className="h-8 w-8 text-slate-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Page Not Found
              </h1>
              <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                Sorry, we couldn&apos;t find the page you&apos;re looking for.
                <br />
                It may have been moved or deleted.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-[#13aba4] hover:shadow-glow active:scale-95"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>

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
