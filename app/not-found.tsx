import { CloudUpload, FileQuestion, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
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
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-800">
            <FileQuestion className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="mb-8 text-base text-gray-500 dark:text-gray-400">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It
            may have been moved or deleted.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-bold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </Link>
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
