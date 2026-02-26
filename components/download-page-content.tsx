"use client";

import { useState, useCallback, useEffect } from "react";
import { BundleUnlockForm } from "@/components/bundle-unlock-form";
import { CountdownTimer } from "@/components/countdown-timer";
import { EncryptedBundleDownloader } from "@/components/encrypted-bundle-downloader";
import { EncryptedBundleFlow } from "@/components/encrypted-bundle-flow";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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

  const handleExpire = useCallback(() => setIsExpired(true), []);

  // Schedule expiry even when CountdownTimer is not rendered (e.g. locked bundles).
  // setTimeout fires asynchronously so setState is never called synchronously in the effect body.
  useEffect(() => {
    const delay = metadata.expiresAt - Date.now();
    const timer = setTimeout(() => setIsExpired(true), Math.max(0, delay));
    return () => clearTimeout(timer);
  }, [metadata.expiresAt]);

  return (
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
                onExpire={handleExpire}
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
        ) : metadata.isPasswordProtected && !metadata.isUnlocked ? (
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
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This bundle has expired. Downloads are no longer available.
                </AlertDescription>
              </Alert>
            )}
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
                        {isExpired ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled
                            className="text-muted-foreground shrink-0"
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">
                              Download {file.filename}
                            </span>
                          </Button>
                        ) : (
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
                        )}
                      </div>
                      {index < metadata.files.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="bg-muted/20 border-t p-4">
                {isExpired ? (
                  <Button size="lg" className="w-full" disabled>
                    <Download className="mr-2 h-5 w-5" />
                    Download{" "}
                    {metadata.fileCount > 1 ? "All Files" : "File"}
                  </Button>
                ) : (
                  <Button asChild size="lg" className="w-full">
                    <a href={`/api/bundle/${bundleId}/download`}>
                      <Download className="mr-2 h-5 w-5" />
                      Download{" "}
                      {metadata.fileCount > 1 ? "All Files" : "File"}
                    </a>
                  </Button>
                )}
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
