import { BackgroundDecorations } from "@/components/background-decorations";
import { CopyButton } from "@/components/copy-button";
import { CountdownTimer } from "@/components/countdown-timer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { QRCode } from "@/components/qr-code";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CloudUpload,
  FileIcon,
  Files,
  Lock,
  ShieldCheck,
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

  if (!metadata) {
    return (
      <>
        <BackgroundDecorations />
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex flex-1 flex-col items-center justify-center p-4">
            <div className="animate-fade-in-up w-full max-w-md text-center">
              <div className="bg-destructive/10 ring-destructive/20 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ring-1">
                <AlertCircle className="text-destructive h-7 w-7" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight">
                Files Not Found
              </h1>
              <p className="text-muted-foreground mt-2">
                This bundle may have expired or been deleted.
              </p>

              <Button asChild className="mt-8" size="lg">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <BackgroundDecorations />
      <div className="flex min-h-screen flex-col">
        <Header />

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl space-y-6">
            <div className="animate-fade-in flex flex-col items-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 shadow-lg ring-1 shadow-emerald-500/5 ring-emerald-500/20">
                <CheckCircle2 className="h-7 w-7 text-emerald-500 dark:text-emerald-400" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {metadata.fileCount > 1
                  ? "Files Ready to Share"
                  : "File Ready to Share"}
              </h1>

              <p className="text-muted-foreground mt-2 flex flex-wrap items-center justify-center gap-2 text-sm">
                Share the link or scan the QR code to download
                {metadata.isPasswordProtected && (
                  <Badge
                    variant="outline"
                    className="border-primary/20 bg-primary/5 text-primary gap-1 font-normal"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    E2E Encrypted
                  </Badge>
                )}
              </p>
            </div>

            <Card className="animate-fade-in-up border-border/60 bg-card/80 backdrop-blur-sm [animation-delay:100ms]">
              <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Share Link</span>
                    <CountdownTimer
                      expiresAt={new Date(metadata.expiresAt).toISOString()}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <CopyButton text={shareUrl} />
                  </div>
                  {metadata.isPasswordProtected && (
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <Lock className="h-3 w-3" />
                      Password required for download
                    </p>
                  )}
                </div>

                <Separator />

                <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Files className="text-muted-foreground h-4 w-4" />
                      <span>
                        {metadata.fileCount}{" "}
                        {metadata.fileCount > 1 ? "files" : "file"}
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-muted-foreground">
                        {formatFileSize(metadata.totalSize)}
                      </span>
                    </div>

                    <div className="custom-scrollbar max-h-48 space-y-1 overflow-y-auto pr-1">
                      {metadata.files.map((file) => (
                        <div
                          key={file.fileId}
                          className="group hover:bg-muted/50 flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="bg-muted/60 ring-border/60 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ring-1">
                              <FileIcon className="text-muted-foreground h-4 w-4" />
                            </div>
                            <span className="truncate">{file.filename}</span>
                          </div>
                          <span className="text-muted-foreground ml-4 shrink-0 text-xs">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 sm:border-l sm:pl-6">
                    <QRCode url={shareUrl} size={130} />
                    <span className="text-muted-foreground text-[11px]">
                      Scan to download
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/20 border-t px-6 py-4">
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/">
                    <CloudUpload className="mr-2 h-4 w-4" />
                    Upload more files
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
