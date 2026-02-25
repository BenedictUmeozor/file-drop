import { BackgroundDecorations } from "@/components/background-decorations";
import { BundleUnlockForm } from "@/components/bundle-unlock-form";
import { CountdownTimer } from "@/components/countdown-timer";
import { EncryptedBundleDownloader } from "@/components/encrypted-bundle-downloader";
import { EncryptedBundleFlow } from "@/components/encrypted-bundle-flow";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Clock,
  CloudUpload,
  Download,
  FileIcon,
  Files,
  Lock,
  ShieldCheck,
  XCircle,
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
  uploadThingUrl?: string;
  downloadUrl?: string;
  isEncrypted?: boolean;
  encryptedMetadataB64?: string;
  encryptedMetadataIvB64?: string;
  wrappedDekB64?: string;
  wrappedDekIvB64?: string;
  baseNonceB64?: string;
  originalSize?: number;
}

interface BundleMetadata {
  bundleId: string;
  fileCount: number;
  totalSize: number;
  createdAt: number;
  expiresAt: number;
  isPasswordProtected: boolean;
  isUnlocked: boolean;
  files: FileMetadata[];
  isEncrypted?: boolean;
  encryptionSaltB64?: string;
  encryptionIterations?: number;
  encryptionChunkSize?: number;
  unlockSaltB64?: string;
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
    const cookieHeader = headersList.get("cookie");

    const response = await fetch(`${protocol}://${host}/api/bundle/${id}`, {
      cache: "no-store",
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
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

      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-16">
        {metadata ? (
          <div className="space-y-6">
            <div className="animate-fade-in flex flex-col items-center text-center">
              <div className="bg-primary/10 ring-primary/20 shadow-primary/5 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ring-1">
                {metadata.isPasswordProtected && !metadata.isUnlocked ? (
                  <Lock className="text-primary h-7 w-7" />
                ) : metadata.fileCount > 1 ? (
                  <Files className="text-primary h-7 w-7" />
                ) : (
                  <FileIcon className="text-primary h-7 w-7" />
                )}
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {metadata.isPasswordProtected && !metadata.isUnlocked
                  ? "Password Protected"
                  : metadata.fileCount > 1
                    ? "Your Files Are Ready"
                    : "Your File Is Ready"}
              </h1>

              <p className="text-muted-foreground mt-2 text-sm">
                {metadata.isPasswordProtected && !metadata.isUnlocked
                  ? "This bundle requires a password to unlock."
                  : `${metadata.fileCount} file${metadata.fileCount > 1 ? "s" : ""} · ${formatFileSize(metadata.totalSize)}`}
              </p>

              {(!metadata.isPasswordProtected || metadata.isUnlocked) && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-primary/20 bg-primary/5 text-primary gap-1 font-normal"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Secure Transfer
                  </Badge>
                  <Badge variant="outline" className="gap-1 font-normal">
                    <CountdownTimer
                      expiresAt={new Date(metadata.expiresAt).toISOString()}
                    />
                  </Badge>
                </div>
              )}
            </div>

            <div className="animate-fade-in-up [animation-delay:100ms]">
              {metadata.isEncrypted &&
              metadata.encryptionSaltB64 &&
              metadata.encryptionIterations &&
              metadata.encryptionChunkSize ? (
                metadata.isPasswordProtected ? (
                  // Encrypted + password-protected: single-entry flow, both locked and
                  // revisit (serverUnlocked=true). router.refresh() in the unlock handler
                  // updates the server chrome while capturedPassphrase state persists.
                  <EncryptedBundleFlow
                    bundleId={id}
                    files={metadata.files}
                    unlockSaltB64={metadata.unlockSaltB64}
                    encryptionSaltB64={metadata.encryptionSaltB64}
                    encryptionIterations={metadata.encryptionIterations}
                    encryptionChunkSize={metadata.encryptionChunkSize}
                    serverUnlocked={metadata.isUnlocked}
                  />
                ) : (
                  // Encrypted but not password-protected: go straight to downloader
                  <EncryptedBundleDownloader
                    files={metadata.files}
                    encryptionSaltB64={metadata.encryptionSaltB64}
                    encryptionIterations={metadata.encryptionIterations}
                    encryptionChunkSize={metadata.encryptionChunkSize}
                  />
                )
              ) : metadata.isPasswordProtected && !metadata.isUnlocked ? (
                // Non-encrypted + locked: plain server-side unlock
                <BundleUnlockForm
                  bundleId={id}
                  isEncrypted={false}
                />
              ) : (
                <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <div className="custom-scrollbar max-h-72 overflow-y-auto">
                      {metadata.files.map((file, index) => (
                        <div key={file.fileId}>
                          <div className="group hover:bg-muted/40 flex items-center justify-between p-4 transition-colors">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="bg-muted/60 ring-border/60 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1">
                                <FileIcon className="text-muted-foreground h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="block truncate text-sm font-medium">
                                  {file.filename}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {formatFileSize(file.size)}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="text-muted-foreground hover:text-primary shrink-0 transition-colors"
                            >
                              <a href={`/api/download/${file.fileId}`}>
                                <Download className="h-4 w-4" />
                                <span className="sr-only">
                                  Download {file.filename}
                                </span>
                              </a>
                            </Button>
                          </div>
                          {index < metadata.files.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="bg-muted/20 border-t p-4">
                    <Button asChild size="lg" className="w-full">
                      <a href={`/api/bundle/${id}/download`}>
                        <Download className="mr-2 h-5 w-5" />
                        Download {metadata.fileCount > 1 ? "All Files" : "File"}
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        ) : isExpired ? (
          <div className="animate-fade-in-up flex flex-col items-center text-center">
            <div className="bg-muted ring-border/60 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ring-1">
              <Clock className="text-muted-foreground h-7 w-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">Link Expired</h1>
            <p className="text-muted-foreground mt-2 max-w-sm">
              This transfer link has expired and the files have been permanently
              deleted from our servers.
            </p>

            <Button asChild className="mt-8" size="lg">
              <Link href="/">
                <CloudUpload className="mr-2 h-4 w-4" />
                Start New Transfer
              </Link>
            </Button>
          </div>
        ) : (
          <div className="animate-fade-in-up flex flex-col items-center text-center">
            <div className="bg-destructive/10 ring-destructive/20 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ring-1">
              <XCircle className="text-destructive h-7 w-7" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              Bundle Not Found
            </h1>
            <p className="text-muted-foreground mt-2 max-w-sm">
              We couldn&apos;t find the files you&apos;re looking for. They may
              have been deleted or the link is incorrect.
            </p>

            <Button variant="outline" asChild className="mt-8" size="lg">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return Home
              </Link>
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
