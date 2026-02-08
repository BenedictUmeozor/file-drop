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

      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-28 pb-12">
        <div className="animate-fade-in-up relative z-10 flex w-full max-w-2xl flex-col gap-6">
          {metadata ? (
            <>
              <div className="glass-panel group relative overflow-hidden rounded-3xl p-1">
                <div className="absolute -inset-1 rounded-3xl bg-linear-to-r from-cyan-400 to-blue-600 opacity-10 blur transition duration-1000 group-hover:opacity-20" />
                <div className="relative overflow-hidden rounded-[22px] border border-slate-100 bg-white dark:border-slate-800/50 dark:bg-[#161b22]">
                  <div className="border-b border-slate-100 bg-slate-50/30 px-8 py-8 text-center dark:border-slate-800 dark:bg-[#1c222b]/50">
                    <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-cyan-100 p-3 text-cyan-600 ring-1 ring-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400">
                      {metadata.fileCount > 1 ? (
                        <Files className="h-8 w-8" />
                      ) : (
                        <File className="h-8 w-8" />
                      )}
                    </div>
                    <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {metadata.fileCount > 1
                        ? "Your Files Are Ready"
                        : "Your File Is Ready"}
                    </h1>
                    <div className="mt-4 flex items-center justify-center gap-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600 dark:text-green-400">
                        <Shield className="h-3 w-3" /> Secure Transfer
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-600 dark:text-cyan-400">
                        <Zap className="h-3 w-3" /> High Speed
                      </span>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="mb-8 rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700/50 dark:bg-slate-800/50">
                      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-white p-1.5 text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-300">
                            <Files className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {metadata.fileCount} file
                              {metadata.fileCount > 1 ? "s" : ""}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatFileSize(metadata.totalSize)}
                            </span>
                          </div>
                        </div>
                        <CountdownTimer
                          expiresAt={new Date(metadata.expiresAt).toISOString()}
                        />
                      </div>

                      <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-1">
                        {metadata.files.map((file) => (
                          <div
                            key={file.fileId}
                            className="group/file flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-slate-700/50 dark:bg-slate-700/30"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <File className="h-4 w-4 shrink-0 text-cyan-500" />
                              <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                                {file.filename}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400 dark:bg-slate-800">
                                {formatFileSize(file.size)}
                              </span>
                              <a
                                href={`/api/download/${file.fileId}`}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-cyan-50 hover:text-cyan-500 dark:hover:bg-cyan-500/10"
                                title="Download Single File"
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
                      className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 px-6 py-4 text-center font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.01] hover:shadow-cyan-500/40 active:scale-95"
                    >
                      <Download className="h-5 w-5 transition-transform group-hover:-translate-y-1" />
                      <span>
                        Download {metadata.fileCount > 1 ? "All Files" : "File"}
                      </span>
                    </a>

                    <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2 text-xs text-slate-400 dark:border-amber-500/10 dark:bg-amber-500/5">
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span className="text-amber-600 dark:text-amber-400">
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
                  className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Send files securely
                </Link>
              </div>
            </>
          ) : isExpired ? (
            <div className="glass-panel mx-auto max-w-lg rounded-3xl border border-amber-100 p-8 text-center dark:border-amber-900/30">
              <div className="mb-6 inline-flex items-center justify-center rounded-full bg-amber-100 p-4 text-amber-500 ring-8 ring-amber-50 dark:bg-amber-500/10 dark:ring-amber-500/5">
                <Clock className="h-10 w-10" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                Transfer Expired
              </h1>
              <p className="mx-auto mb-8 max-w-sm text-slate-500 dark:text-slate-400">
                This transfer link has expired and the files have been
                permanently deleted from our servers for security.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-900"
              >
                <CloudUpload className="h-4 w-4" />
                Start New Transfer
              </Link>
            </div>
          ) : (
            <div className="glass-panel mx-auto max-w-lg rounded-3xl border border-red-100 p-8 text-center dark:border-red-900/30">
              <div className="mb-6 inline-flex items-center justify-center rounded-full bg-red-100 p-4 text-red-500 ring-8 ring-red-50 dark:bg-red-500/10 dark:ring-red-500/5">
                <AlertCircle className="h-10 w-10" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                Files Not Found
              </h1>
              <p className="mx-auto mb-8 max-w-sm text-slate-500 dark:text-slate-400">
                We couldn&apos;t find the files you&apos;re looking for. They
                may have been deleted or the link is incorrect.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-900"
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
