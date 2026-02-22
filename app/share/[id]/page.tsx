import { BackgroundDecorations } from "@/components/background-decorations";
import { CopyButton } from "@/components/copy-button";
import { CountdownTimer } from "@/components/countdown-timer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { QRCode } from "@/components/qr-code";
import {
  AlertCircle,
  ArrowLeft,
  CloudUpload,
  File,
  Files,
  Lock,
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
  isPasswordProtected: boolean;
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
    const cookieHeader = headersList.get("cookie");

    const response = await fetch(`${protocol}://${host}/api/bundle/${id}`, {
      cache: "no-store",
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
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
                      ? "Files Ready to Share"
                      : "File Ready to Share"}
                  </h1>
                  <p className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Share2 className="h-4 w-4" />
                    Share this link or scan the QR code
                  </p>
                  {metadata.isPasswordProtected && (
                    <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400">
                      <Lock className="h-3 w-3" />
                      Password Protected
                    </div>
                  )}
                </div>

                <div className="p-6 md:p-8">
                  <div className="mb-8 flex flex-col gap-6 md:flex-row">
                    <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-slate-900/50">
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
                                expiresAt={new Date(
                                metadata.expiresAt,
                                ).toISOString()}
                            />
                        </div>
                      </div>

                      <div className="custom-scrollbar max-h-48 space-y-1 overflow-y-auto pr-1">
                        {metadata.files.map((file) => (
                          <div
                            key={file.fileId}
                            className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-gray-100 dark:hover:bg-slate-800/50"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <File className="h-4 w-4 shrink-0 text-gray-400" />
                              <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
                                {file.filename}
                              </span>
                            </div>
                            <span className="ml-3 shrink-0 text-xs text-gray-400">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex min-w-40 flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                       <QRCode url={shareUrl} size={120} />
                      <span className="mt-2 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                        Scan to download
                      </span>
                    </div>
                  </div>

                  <div className="mb-8 space-y-3">
                    <label className="ml-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Secure Share Link
                    </label>
                    <div className="flex gap-2">
                      <div className="group/input relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Share2 className="h-4 w-4 text-gray-400 transition-colors group-focus-within/input:text-primary" />
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          className="block w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pr-4 pl-10 font-mono text-sm text-gray-600 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none dark:border-gray-700 dark:bg-slate-900/50 dark:text-gray-300"
                        />
                      </div>
                      <CopyButton text={shareUrl} />
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
                  Share more files
                </Link>
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/30 dark:bg-slate-800">
              <div className="mb-6 inline-flex items-center justify-center rounded-full bg-red-50 p-4 text-red-500 ring-1 ring-red-100 dark:bg-red-900/20 dark:ring-red-900/10">
                <AlertCircle className="h-10 w-10" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                Files Not Found
              </h1>
              <p className="mx-auto mb-8 max-w-sm text-gray-500 dark:text-gray-400">
                These files may have expired or been deleted. Links are one-time
                use or time-limited for security.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white shadow-sm transition-transform hover:bg-gray-800 active:scale-95 dark:bg-white dark:text-gray-900"
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
