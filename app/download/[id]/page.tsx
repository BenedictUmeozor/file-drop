import { BackgroundDecorations } from "@/components/background-decorations";
import { CountdownTimer } from "@/components/countdown-timer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  CloudUpload,
  Download,
  File,
  Files,
  Shield,
  Zap,
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
      <BackgroundDecorations />
      <Header />

      <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 pt-28 pb-12 dark:bg-slate-900">
        <div className="animate-fade-in-up relative z-10 flex w-full max-w-2xl flex-col gap-6">
          {metadata ? (
            <>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-slate-800">
                <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-8 text-center dark:border-gray-700 dark:bg-slate-800/50">
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-primary/10 p-3 text-primary ring-1 ring-primary/20">
                    {metadata.fileCount > 1 ? (
                      <Files className="h-8 w-8" />
                    ) : (
                      <File className="h-8 w-8" />
                    )}
                  </div>
                  <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {metadata.fileCount > 1
                      ? "Your Files Are Ready"
                      : "Your File Is Ready"}
                  </h1>
                  <div className="mt-4 flex items-center justify-center gap-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm dark:border-gray-600 dark:bg-slate-700 dark:text-gray-300">
                      <Shield className="h-3 w-3 text-primary" /> Secure Transfer
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm dark:border-gray-600 dark:bg-slate-700 dark:text-gray-300">
                      <Zap className="h-3 w-3 text-primary" /> High Speed
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-slate-900/50">
                    <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-white p-1.5 text-gray-500 shadow-sm dark:bg-slate-800 dark:text-gray-400">
                          <Files className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {metadata.fileCount} file
                            {metadata.fileCount > 1 ? "s" : ""}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(metadata.totalSize)}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs">
                        <CountdownTimer
                          expiresAt={new Date(metadata.expiresAt).toISOString()}
                        />
                      </div>
                    </div>

                    <div className="custom-scrollbar max-h-48 space-y-1 overflow-y-auto pr-1">
                      {metadata.files.map((file) => (
                        <div
                          key={file.fileId}
                          className="group/file flex items-center justify-between rounded-md px-2 py-2 hover:bg-gray-100 dark:hover:bg-slate-800/50"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <File className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                              {file.filename}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="shrink-0 text-xs text-gray-400">
                              {formatFileSize(file.size)}
                            </span>
                            <a
                              href={`/api/download/${file.fileId}`}
                              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-primary hover:shadow-sm dark:hover:bg-slate-700"
                              title="Download Single File"
                              aria-label={`Download ${file.filename}`}
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <a
                      href={`/api/bundle/${id}/download`}
                      className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-center font-bold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-95"
                    >
                      <Download className="h-5 w-5 transition-transform group-hover:-translate-y-1" />
                      <span>
                        Download {metadata.fileCount > 1 ? "All Files" : "File"}
                      </span>
                    </a>

                    <div className="flex items-center justify-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400">
                      <Clock className="h-3 w-3 text-amber-600" />
                      <span>
                        Download now. Files are permanently deleted when the
                        timer hits zero.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary dark:text-gray-400 dark:hover:text-primary-light"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Send files securely
                </Link>
              </div>
            </>
          ) : isExpired ? (
            <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm dark:border-amber-900/30 dark:bg-slate-800">
              <div className="mb-6 inline-flex items-center justify-center rounded-full bg-amber-50 p-4 text-amber-500 ring-1 ring-amber-100 dark:bg-amber-900/20 dark:ring-amber-900/10">
                <Clock className="h-10 w-10" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Transfer Expired
              </h1>
              <p className="mx-auto mb-8 max-w-sm text-gray-500 dark:text-gray-400">
                This transfer link has expired and the files have been
                permanently deleted from our servers for security.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-8 py-3.5 font-bold text-white shadow-sm transition-transform hover:bg-gray-800 active:scale-95 dark:bg-white dark:text-gray-900"
              >
                <CloudUpload className="h-4 w-4" />
                Start New Transfer
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/30 dark:bg-slate-800">
              <div className="mb-6 inline-flex items-center justify-center rounded-full bg-red-50 p-4 text-red-500 ring-1 ring-red-100 dark:bg-red-900/20 dark:ring-red-900/10">
                <AlertCircle className="h-10 w-10" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Files Not Found
              </h1>
              <p className="mx-auto mb-8 max-w-sm text-gray-500 dark:text-gray-400">
                We couldn&apos;t find the files you&apos;re looking for. They
                may have been deleted or the link is incorrect.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-8 py-3.5 font-bold text-white shadow-sm transition-transform hover:bg-gray-800 active:scale-95 dark:bg-white dark:text-gray-900"
              >
                <CloudUpload className="h-4 w-4" />
                Share Your Own Files
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
