import { BackgroundDecorations } from "@/components/background-decorations";
import { CopyButton } from "@/components/copy-button";
import { CountdownTimer } from "@/components/countdown-timer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { QRCode } from "@/components/qr-code";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  CloudUpload,
  Download,
  File,
  Files,
  Share2,
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function getBundleMetadata(id: string): Promise<BundleMetadata | null> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";

    const response = await fetch(`${protocol}://${host}/api/bundle/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch bundle metadata:", error);
    return null;
  }
}

function getBaseUrl(headersList: Awaited<ReturnType<typeof headers>>): string {
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

export default async function SharePage({ params }: PageProps) {
  const { id } = await params;
  const metadata = await getBundleMetadata(id);
  const headersList = await headers();
  const baseUrl = getBaseUrl(headersList);
  const shareUrl = `${baseUrl}/download/${id}`;

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
                        ? "Files Ready to Share"
                        : "File Ready to Share"}
                    </h1>
                    <p className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                      <Share2 className="h-4 w-4" />
                      Share this link or scan the QR code
                    </p>
                  </div>

                  <div className="p-8">
                    <div className="mb-8 flex flex-col gap-6 sm:flex-row">
                      <div className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700/50 dark:bg-slate-800/50">
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
                            expiresAt={new Date(
                              metadata.expiresAt,
                            ).toISOString()}
                          />
                        </div>

                        <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-1">
                          {metadata.files.map((file) => (
                            <div
                              key={file.fileId}
                              className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 dark:border-slate-700/50 dark:bg-slate-700/30"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <File className="h-4 w-4 shrink-0 text-cyan-500" />
                                <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {file.filename}
                                </span>
                              </div>
                              <span className="ml-3 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400 dark:bg-slate-800">
                                {formatFileSize(file.size)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex min-w-40 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-800/50">
                        <div className="mb-2 rounded-xl border border-slate-100 bg-white p-2">
                          <QRCode url={shareUrl} size={120} />
                        </div>
                        <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                          Scan to download
                        </span>
                      </div>
                    </div>

                    <div className="mb-8 space-y-3">
                      <label className="ml-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Secure Share Link
                      </label>
                      <div className="flex gap-2">
                        <div className="group/input relative flex-1">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Share2 className="h-4 w-4 text-slate-400 transition-colors group-focus-within/input:text-cyan-500" />
                          </div>
                          <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 font-mono text-sm text-slate-600 transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300"
                          />
                        </div>
                        <CopyButton text={shareUrl} />
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

                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>Files auto-delete in 10 minutes</span>
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
                  Share more files
                </Link>
              </div>
            </>
          ) : (
            <div className="glass-panel mx-auto max-w-lg rounded-3xl border border-red-100 p-8 text-center dark:border-red-900/30">
              <div className="mb-6 inline-flex items-center justify-center rounded-full bg-red-100 p-4 text-red-500 ring-8 ring-red-50 dark:bg-red-500/10 dark:ring-red-500/5">
                <AlertCircle className="h-10 w-10" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                Files Not Found
              </h1>
              <p className="mx-auto mb-8 max-w-sm text-slate-500 dark:text-slate-400">
                These files may have expired or been deleted. Links are one-time
                use or time-limited for security.
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
