import { BackgroundDecorations } from "@/components/background-decorations";
import { BundleUnlockForm } from "@/components/bundle-unlock-form";
import { CountdownTimer } from "@/components/countdown-timer";
import { EncryptedBundleDownloader } from "@/components/encrypted-bundle-downloader";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  Clock,
  Download,
  File,
  Files,
  Lock,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  // E2E encryption fields
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
  // E2E encryption fields
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

      <main className="max-w-2xl mx-auto px-4 py-16 min-h-screen flex flex-col justify-center">
        {metadata ? (
          <Card className="w-full bg-card border-border">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                {metadata.isPasswordProtected && !metadata.isUnlocked ? (
                  <Lock className="h-8 w-8 text-primary" />
                ) : metadata.fileCount > 1 ? (
                  <Files className="h-8 w-8 text-primary" />
                ) : (
                  <File className="h-8 w-8 text-primary" />
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {metadata.isPasswordProtected && !metadata.isUnlocked
                  ? "Password Protected"
                  : metadata.fileCount > 1
                    ? "Your Files Are Ready"
                    : "Your File Is Ready"}
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                {metadata.isPasswordProtected && !metadata.isUnlocked
                  ? "This bundle requires a password to unlock."
                  : `${metadata.fileCount} file${metadata.fileCount > 1 ? "s" : ""} • ${formatFileSize(metadata.totalSize)}`}
              </CardDescription>
              {(!metadata.isPasswordProtected || metadata.isUnlocked) && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Badge variant="secondary" className="bg-muted text-foreground">
                    <ShieldCheck className="mr-1 h-3 w-3 text-primary" />
                    Secure Transfer
                  </Badge>
                  <Badge variant="secondary" className="bg-muted text-foreground">
                    <Clock className="mr-1 h-3 w-3 text-primary" />
                    <CountdownTimer expiresAt={new Date(metadata.expiresAt).toISOString()} />
                  </Badge>
                </div>
              )}
            </CardHeader>

            <CardContent>
              {metadata.isPasswordProtected && !metadata.isUnlocked ? (
                <BundleUnlockForm
                  bundleId={id}
                  isEncrypted={metadata.isEncrypted}
                  unlockSaltB64={metadata.unlockSaltB64}
                  encryptionIterations={metadata.encryptionIterations}
                />
              ) : metadata.isEncrypted &&
                metadata.encryptionSaltB64 &&
                metadata.encryptionIterations &&
                metadata.encryptionChunkSize ? (
                <EncryptedBundleDownloader
                  files={metadata.files}
                  encryptionSaltB64={metadata.encryptionSaltB64}
                  encryptionIterations={metadata.encryptionIterations}
                  encryptionChunkSize={metadata.encryptionChunkSize}
                />
              ) : (
                <div className="space-y-6">
                  <div className="rounded-lg border border-border bg-background overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      {metadata.files.map((file, index) => (
                        <div key={file.fileId}>
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <File className="h-5 w-5 shrink-0 text-muted-foreground" />
                              <span className="truncate text-sm font-medium text-foreground">
                                {file.filename}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className="text-sm text-muted-foreground">
                                {formatFileSize(file.size)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="text-muted-foreground hover:text-primary"
                              >
                                <a href={`/api/download/${file.fileId}`}>
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">Download {file.filename}</span>
                                </a>
                              </Button>
                            </div>
                          </div>
                          {index < metadata.files.length - 1 && <Separator className="bg-border" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button asChild size="lg" className="w-full">
                    <a href={`/api/bundle/${id}/download`}>
                      <Download className="mr-2 h-5 w-5" />
                      Download {metadata.fileCount > 1 ? "All Files" : "File"}
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : isExpired ? (
          <Card className="w-full bg-card border-border text-center py-12">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Link expired</CardTitle>
              <CardDescription className="text-muted-foreground mt-2 max-w-sm mx-auto">
                This transfer link has expired and the files have been permanently deleted from our servers.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center mt-4">
              <Button asChild>
                <Link href="/">Start New Transfer</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="w-full bg-card border-border text-center py-12">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <XCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Bundle not found</CardTitle>
              <CardDescription className="text-muted-foreground mt-2 max-w-sm mx-auto">
                We couldn&apos;t find the files you&apos;re looking for. They may have been deleted or the link is incorrect.
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-center mt-4">
              <Button variant="outline" asChild>
                <Link href="/">Return Home</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>

      <Footer />
    </>
  );
}
