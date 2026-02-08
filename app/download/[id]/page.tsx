import { CountdownTimer } from "@/components/countdown-timer";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  CloudUpload,
  Download,
  File,
  Files,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface FileMetadata {
  fileId: string;
  filename: string;
  size: number;
  mimetype: string;
  createdAt: number;
  expiresAt: number;
  uploadThingUrl: string;
}

interface BundleMetadata {
  bundleId: string;
  fileCount: number;
  totalSize: number;
  createdAt: number;
  expiresAt: number;
  files: FileMetadata[];
}

interface BundleError {
  error: string;
  status: number;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function getBundleMetadata(
  id: string,
): Promise<{ data: BundleMetadata | null; error: BundleError | null }> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";

    const response = await fetch(`${protocol}://${host}/api/bundle/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      return {
        data: null,
        error: { error: errorData.error, status: response.status },
      };
    }

    return { data: await response.json(), error: null };
  } catch (error) {
    console.error("Failed to fetch bundle metadata:", error);
    return {
      data: null,
      error: { error: "Failed to fetch files", status: 500 },
    };
  }
}

export default async function DownloadPage({ params }: PageProps) {
  const { id } = await params;
  const { data: metadata, error } = await getBundleMetadata(id);
  const isExpired = error?.status === 410;

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

        <div className="relative z-10 flex w-full max-w-lg flex-col gap-6">
          {metadata ? (
            <>
              <div className="animate-fade-in-up shadow-soft rounded-2xl border border-slate-100 bg-white p-8 dark:border-slate-700/50 dark:bg-[#2b3036] dark:shadow-none">
                <div className="mb-6 text-center">
                  <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                    {metadata.fileCount > 1 ? (
                      <Files className="text-primary h-8 w-8" />
                    ) : (
                      <File className="text-primary h-8 w-8" />
                    )}
                  </div>
                  <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {metadata.fileCount > 1
                      ? "Your Files are Ready"
                      : "Your File is Ready"}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {metadata.fileCount > 1
                      ? "Download all files or select individually"
                      : "Click the button below to download"}
                  </p>
                </div>

                <div className="mb-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Files className="text-primary h-4 w-4" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {metadata.fileCount} file
                        {metadata.fileCount > 1 ? "s" : ""}
                      </span>
                      <span className="text-sm text-slate-400">
                        ({formatFileSize(metadata.totalSize)})
                      </span>
                    </div>
                    <CountdownTimer
                      expiresAt={new Date(metadata.expiresAt).toISOString()}
                    />
                  </div>

                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {metadata.files.map((file) => (
                      <div
                        key={file.fileId}
                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2 dark:bg-slate-700/50"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <File className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate text-sm text-slate-700 dark:text-slate-300">
                            {file.filename}
                          </span>
                        </div>
                        <div className="ml-2 flex items-center gap-2">
                          <span className="shrink-0 text-xs text-slate-400">
                            {formatFileSize(file.size)}
                          </span>
                          <a
                            href={`/api/download/${file.fileId}`}
                            className="text-primary hover:bg-primary/10 rounded-lg p-1.5 transition-colors"
                            title={`Download ${file.filename}`}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <a
                  href={`/api/bundle/${id}/download`}
                  className="bg-primary shadow-primary/25 hover:shadow-glow flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#13aba4] active:scale-95"
                >
                  <Download className="h-6 w-6" />
                  Download {metadata.fileCount > 1 ? "All Files" : "File"}
                </a>

                <div className="mt-6 flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {metadata.fileCount > 1
                      ? "These files will be automatically deleted after the timer expires. Download them before they're gone!"
                      : "This file will be automatically deleted after the timer expires. Download it before it's gone!"}
                  </p>
                </div>
              </div>

              <div className="text-center">
                <Link
                  href="/"
                  className="hover:text-primary inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors dark:text-slate-400"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Share your own files
                </Link>
              </div>
            </>
          ) : isExpired ? (
            <div className="animate-fade-in-up shadow-soft rounded-2xl border border-slate-100 bg-white p-8 dark:border-slate-700/50 dark:bg-[#2b3036] dark:shadow-none">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                  <Clock className="h-8 w-8 text-amber-500" />
                </div>
                <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  These Files Have Expired
                </h1>
                <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                  Sorry, these files are no longer available.
                  <br />
                  Files are automatically deleted after they expire.
                </p>
                <Link
                  href="/"
                  className="bg-primary shadow-primary/25 hover:shadow-glow inline-flex items-center gap-2 rounded-lg px-6 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-[#13aba4] active:scale-95"
                >
                  <CloudUpload className="h-4 w-4" />
                  Share Your Own Files
                </Link>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in-up shadow-soft rounded-2xl border border-slate-100 bg-white p-8 dark:border-slate-700/50 dark:bg-[#2b3036] dark:shadow-none">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Files Not Found
                </h1>
                <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                  These files may have expired or don&apos;t exist.
                  <br />
                  Files are automatically deleted after they expire.
                </p>
                <Link
                  href="/"
                  className="bg-primary shadow-primary/25 hover:shadow-glow inline-flex items-center gap-2 rounded-lg px-6 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-[#13aba4] active:scale-95"
                >
                  <CloudUpload className="h-4 w-4" />
                  Share Your Own Files
                </Link>
              </div>
            </div>
          )}
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
              className="hover:text-primary underline transition-colors"
            >
              Benedict
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
