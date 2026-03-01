"use client";

import { useState, useCallback, useEffect } from "react";
import { BundleUnlockForm } from "@/components/bundle-unlock-form";
import { CountdownTimer } from "@/components/countdown-timer";
import { EncryptedBundleDownloader } from "@/components/encrypted-bundle-downloader";
import { EncryptedBundleFlow } from "@/components/encrypted-bundle-flow";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Download,
  FileIcon,
  Files,
  Lock,
  ShieldCheck,
} from "lucide-react";

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

interface DownloadPageContentProps {
  metadata: BundleMetadata;
  bundleId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function DownloadPageContent({ metadata, bundleId }: DownloadPageContentProps) {
  const [isExpired, setIsExpired] = useState(
    () => Date.now() >= metadata.expiresAt,
  );
  const isLocked = metadata.isPasswordProtected && !metadata.isUnlocked;

  const handleExpire = useCallback(() => setIsExpired(true), []);

  // Schedule expiry even when CountdownTimer is not rendered (e.g. locked bundles).
  // setTimeout fires asynchronously so setState is never called synchronously in the effect body.
  useEffect(() => {
    const delay = metadata.expiresAt - Date.now();
    const timer = setTimeout(() => setIsExpired(true), Math.max(0, delay));
    return () => clearTimeout(timer);
  }, [metadata.expiresAt]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="shadow-sm dark:shadow-none">
        <CardHeader className="space-y-4">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border bg-muted/50">
              {isLocked ? (
                <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              ) : metadata.fileCount > 1 ? (
                <Files className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              ) : (
                <FileIcon
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </div>

            <h1 className="text-2xl font-semibold tracking-tight leading-none sm:text-3xl">
              {isLocked
                ? "Password Protected Bundle"
                : metadata.fileCount > 1
                  ? "Files Ready to Download"
                  : "File Ready to Download"}
            </h1>
            <CardDescription className="mt-2 max-w-xl text-sm md:text-base">
              {isLocked
                ? "Enter the passphrase to unlock this bundle."
                : `${metadata.fileCount} file${metadata.fileCount > 1 ? "s" : ""} · ${formatFileSize(metadata.totalSize)}`}
            </CardDescription>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="outline" className="gap-1 font-normal">
                {metadata.isEncrypted ? (
                  <>
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    End-to-end encrypted
                  </>
                ) : metadata.isPasswordProtected ? (
                  <>
                    <Lock className="h-3 w-3" aria-hidden="true" />
                    Password protected
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    Secure transfer
                  </>
                )}
              </Badge>

              {isExpired ? (
                <Badge variant="outline" className="font-normal">
                  Expired
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 font-normal">
                  <CountdownTimer
                    expiresAt={new Date(metadata.expiresAt).toISOString()}
                    onExpire={handleExpire}
                  />
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {metadata.isEncrypted &&
      metadata.encryptionSaltB64 &&
      metadata.encryptionIterations &&
      metadata.encryptionChunkSize ? (
        metadata.isPasswordProtected ? (
          <EncryptedBundleFlow
            bundleId={bundleId}
            files={metadata.files}
            unlockSaltB64={metadata.unlockSaltB64}
            encryptionSaltB64={metadata.encryptionSaltB64}
            encryptionIterations={metadata.encryptionIterations}
            encryptionChunkSize={metadata.encryptionChunkSize}
            serverUnlocked={metadata.isUnlocked}
            isExpired={isExpired}
          />
        ) : (
          <EncryptedBundleDownloader
            bundleId={bundleId}
            files={metadata.files}
            encryptionSaltB64={metadata.encryptionSaltB64}
            encryptionIterations={metadata.encryptionIterations}
            encryptionChunkSize={metadata.encryptionChunkSize}
            isExpired={isExpired}
          />
        )
      ) : isLocked ? (
        isExpired ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This bundle has expired and can no longer be unlocked or
              downloaded.
            </AlertDescription>
          </Alert>
        ) : (
          <BundleUnlockForm bundleId={bundleId} isEncrypted={false} />
        )
      ) : (
        <>
          {isExpired && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This bundle has expired. Downloads are no longer available.
              </AlertDescription>
            </Alert>
          )}

          <Card className="shadow-sm dark:shadow-none">
            <CardContent className="p-0">
              <div className="custom-scrollbar max-h-72 overflow-y-auto">
                {metadata.files.map((file, index) => (
                  <div key={file.fileId}>
                    <div className="hover:bg-muted/40 flex items-center justify-between gap-3 px-4 py-3.5 transition-colors">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-muted/50">
                          <FileIcon
                            className="h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {file.filename}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>

                      {isExpired ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled
                          className="shrink-0 text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-100"
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download {file.filename}</span>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="icon" asChild className="shrink-0">
                          <a href={`/api/download/${file.fileId}`}>
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download {file.filename}</span>
                          </a>
                        </Button>
                      )}
                    </div>
                    {index < metadata.files.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="border-t bg-muted/20 p-4">
              {isExpired ? (
                <Button
                  size="lg"
                  className="w-full bg-muted text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-100"
                  disabled
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download {metadata.fileCount > 1 ? "All Files" : "File"}
                </Button>
              ) : (
                <Button asChild size="lg" className="w-full">
                  <a href={`/api/bundle/${bundleId}/download`}>
                    <Download className="mr-2 h-5 w-5" />
                    Download {metadata.fileCount > 1 ? "All Files" : "File"}
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}
