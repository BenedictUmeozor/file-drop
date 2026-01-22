import { ThemeToggle } from "@/components/theme-toggle";
import { CountdownTimer } from "@/components/countdown-timer";
import { CopyButton } from "@/components/copy-button";
import { QRCode } from "@/components/qr-code";
import { CloudUpload, File, Download, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface FileMetadata {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  createdAt: string;
  expiresAt: string;
  downloadUrl?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function getFileMetadata(id: string): Promise<FileMetadata | null> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";
    
    const response = await fetch(`${protocol}://${host}/api/files/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch file metadata:", error);
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
  const metadata = await getFileMetadata(id);
  const headersList = await headers();
  const baseUrl = getBaseUrl(headersList);
  const shareUrl = `${baseUrl}/download/${id}`;
  const downloadUrl = `/api/download/${id}`;

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
          <Link
            href="#"
            className="hidden text-sm font-medium text-slate-500 transition-colors hover:text-primary sm:block dark:text-slate-400"
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
          className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-primary/5 mix-blend-multiply blur-[100px] dark:bg-primary/10 dark:mix-blend-normal"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-blue-400/5 mix-blend-multiply blur-[100px] dark:bg-blue-500/10 dark:mix-blend-normal"
          aria-hidden="true"
        />

        <div className="relative z-10 flex w-full max-w-lg flex-col gap-6">
          {metadata ? (
            <>
              {/* Success Card */}
              <div className="animate-fade-in-up rounded-2xl border border-slate-100 bg-white p-8 shadow-soft dark:border-slate-700/50 dark:bg-[#2b3036] dark:shadow-none">
                {/* Header */}
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <File className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    File Ready to Share
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Share this link or scan the QR code
                  </p>
                </div>

                {/* File Info */}
                <div className="mb-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 dark:text-white">
                        {metadata.filename}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {formatFileSize(metadata.size)}
                      </p>
                    </div>
                    <CountdownTimer expiresAt={metadata.expiresAt} />
                  </div>
                </div>

                {/* QR Code */}
                <div className="mb-6 flex justify-center">
                  <QRCode url={shareUrl} size={180} />
                </div>

                {/* Share Link */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Share Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    />
                    <CopyButton text={shareUrl} />
                  </div>
                </div>

                {/* Download Button */}
                <a
                  href={downloadUrl}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-[#13aba4] hover:shadow-glow active:scale-95"
                >
                  <Download className="h-5 w-5" />
                  Download File
                </a>
              </div>

              {/* Share Another File Link */}
              <div className="text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-primary dark:text-slate-400"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Share another file
                </Link>
              </div>
            </>
          ) : (
            /* Error Card */
            <div className="animate-fade-in-up rounded-2xl border border-slate-100 bg-white p-8 shadow-soft dark:border-slate-700/50 dark:bg-[#2b3036] dark:shadow-none">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  File Not Found
                </h1>
                <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                  This file may have expired or doesn&apos;t exist.
                  <br />
                  Files are automatically deleted after 1 hour.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-[#13aba4] hover:shadow-glow active:scale-95"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Upload a New File
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="relative z-50 w-full px-4 py-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="font-display text-xs text-slate-300 dark:text-slate-600">
            © 2024 FileDrop Inc.
          </p>
        </div>
      </footer>
    </>
  );
}
