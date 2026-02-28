import { CopyButton } from "@/components/copy-button";
import { CountdownTimer } from "@/components/countdown-timer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { QRCode } from "@/components/qr-code";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
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
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center bg-background">
          <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
            <Card className="mx-auto w-full max-w-md shadow-sm dark:shadow-none">
              <CardHeader className="items-center text-center">
                <div className="bg-destructive/10 border-destructive/20 mb-2 flex h-10 w-10 items-center justify-center rounded-md border">
                  <AlertCircle className="text-destructive h-5 w-5" aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight leading-none">
                  Files Not Found
                </h1>
                <CardDescription>
                  This bundle may have expired or been deleted.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild size="lg">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-background">
        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto w-full max-w-3xl">
            <Card className="shadow-sm dark:shadow-none">
              <CardHeader className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-muted/50 mb-3 flex h-10 w-10 items-center justify-center rounded-md border">
                    <CheckCircle2 className="text-muted-foreground h-5 w-5" aria-hidden="true" />
                  </div>

                  <h1 className="text-2xl font-semibold tracking-tight leading-none sm:text-3xl">
                    {metadata.fileCount > 1
                      ? "Files Ready to Share"
                      : "File Ready to Share"}
                  </h1>
                  <CardDescription className="mt-2 max-w-xl text-sm md:text-base">
                    Share the link or scan the QR code to download.
                  </CardDescription>

                  {metadata.isPasswordProtected && (
                    <Badge variant="outline" className="mt-4 gap-1 font-normal">
                      <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                      End-to-end encrypted
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">Share link</span>
                    <CountdownTimer
                      expiresAt={new Date(metadata.expiresAt).toISOString()}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Input value={shareUrl} readOnly className="font-mono text-sm" aria-label="Share link" />
                    <CopyButton text={shareUrl} />
                  </div>

                  {metadata.isPasswordProtected && (
                    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      Password required for download
                    </p>
                  )}
                </div>

                <Separator />

                <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <Files className="text-muted-foreground h-4 w-4" aria-hidden="true" />
                      <span>
                        {metadata.fileCount} {metadata.fileCount > 1 ? "files" : "file"}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-muted-foreground">
                        {formatFileSize(metadata.totalSize)}
                      </span>
                    </div>

                    <div className="custom-scrollbar max-h-56 space-y-1 overflow-y-auto rounded-md border p-1.5">
                      {metadata.files.map((file) => (
                        <div
                          key={file.fileId}
                          className="hover:bg-muted/40 flex items-center justify-between rounded-md px-2.5 py-2 text-sm transition-colors"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="bg-muted/50 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border">
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

                  <div className="flex flex-col items-center gap-3 lg:border-l lg:pl-6">
                    <QRCode url={shareUrl} size={130} />
                    <span className="text-muted-foreground text-xs">
                      Scan to download
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t bg-muted/20 px-6 py-4">
                <Button variant="ghost" asChild className="w-full sm:w-auto">
                  <Link href="/">
                    <CloudUpload className="mr-2 h-4 w-4" />
                    Upload more files
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
