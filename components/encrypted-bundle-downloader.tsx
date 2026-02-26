"use client";

import { useState, useMemo } from "react";
import { AlertCircle, Download, Eye, EyeOff, File, Loader2, Lock, Shield } from "lucide-react";
import { EncryptedFileDownloadButton } from "./encrypted-file-download-button";
import { decryptFile, decryptMetadata, deriveKeysFromParams, type KeyDerivationParams } from "@/lib/crypto";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface FileMetadata {
  fileId: string;
  filename: string;
  size: number;
  mimetype: string;
  isEncrypted?: boolean;
  encryptedMetadataB64?: string;
  encryptedMetadataIvB64?: string;
  wrappedDekB64?: string;
  wrappedDekIvB64?: string;
  baseNonceB64?: string;
  originalSize?: number;
}

interface EncryptedBundleDownloaderProps {
  bundleId: string;
  files: FileMetadata[];
  encryptionSaltB64: string;
  encryptionIterations: number;
  encryptionChunkSize: number;
  initialPassphrase?: string;
  isExpired?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function sanitizeZipEntryName(filename: string): string {
  return (
    filename
      .replace(/\.\./g, "")
      .replace(/[\/\\]/g, "_")
      .trim() || "file"
  );
}

function makeUniqueFilename(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const lastDot = name.lastIndexOf(".");
  const base = lastDot >= 0 ? name.slice(0, lastDot) : name;
  const ext = lastDot >= 0 ? name.slice(lastDot) : "";
  let counter = 1;
  for (;;) {
    const candidate = `${base} (${counter})${ext}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
    counter++;
  }
}

export function EncryptedBundleDownloader({
  bundleId,
  files,
  encryptionSaltB64,
  encryptionIterations,
  encryptionChunkSize,
  initialPassphrase,
  isExpired,
}: EncryptedBundleDownloaderProps) {
  const [passphrase, setPassphrase] = useState(initialPassphrase ?? "");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(!!initialPassphrase);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const derivationParams = useMemo<KeyDerivationParams>(
    () => ({ saltB64: encryptionSaltB64, iterations: encryptionIterations, hash: "SHA-256" }),
    [encryptionSaltB64, encryptionIterations],
  );

  const hasEncryptedFiles = useMemo(
    () =>
      files.some(
        (f) =>
          f.isEncrypted &&
          f.wrappedDekB64 &&
          f.wrappedDekIvB64 &&
          f.encryptedMetadataB64 &&
          f.encryptedMetadataIvB64 &&
          f.baseNonceB64 &&
          f.originalSize != null,
      ),
    [files],
  );

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadAllProgress, setDownloadAllProgress] = useState(0);
  const [downloadAllStatus, setDownloadAllStatus] = useState<string | null>(null);
  const [downloadAllError, setDownloadAllError] = useState<string | null>(null);

  const handleDownloadAll = async () => {
    if (isDownloadingAll || isExpired) return;
    setIsDownloadingAll(true);
    setDownloadAllProgress(0);
    setDownloadAllStatus("Preparing download\u2026");
    setDownloadAllError(null);

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const usedNames = new Set<string>();

      const keys = await deriveKeysFromParams(passphrase, derivationParams);

      const encryptedFiles = files.filter(
        (f) =>
          f.isEncrypted &&
          f.wrappedDekB64 &&
          f.wrappedDekIvB64 &&
          f.encryptedMetadataB64 &&
          f.encryptedMetadataIvB64 &&
          f.baseNonceB64 &&
          f.originalSize != null,
      );

      for (let i = 0; i < encryptedFiles.length; i++) {
        const file = encryptedFiles[i];
        const fileNum = i + 1;

        setDownloadAllStatus(
          `Downloading file ${fileNum}/${encryptedFiles.length}: ${file.filename}`,
        );

        const response = await fetch(`/api/download/${file.fileId}`);
        if (!response.ok) {
          if (response.status === 401)
            throw new Error("Unlock expired. Please reload and unlock again.");
          if (response.status === 410)
            throw new Error("Bundle has expired.");
          throw new Error(`Failed to fetch file: ${file.filename}`);
        }
        const encryptedBytes = new Uint8Array(await response.arrayBuffer());

        const metadata = await decryptMetadata(
          file.encryptedMetadataB64!,
          file.encryptedMetadataIvB64!,
          keys.metadataKey,
        );

        setDownloadAllStatus(
          `Decrypting file ${fileNum}/${encryptedFiles.length}: ${metadata.filename}`,
        );

        const decryptedBytes = await decryptFile(
          encryptedBytes,
          file.wrappedDekB64!,
          file.wrappedDekIvB64!,
          file.baseNonceB64!,
          encryptionChunkSize,
          file.originalSize!,
          keys.kekWrapKey,
          (progress) => {
            const overall = ((i + progress) / encryptedFiles.length) * 100;
            setDownloadAllProgress(Math.round(overall));
          },
        );

        const safeName = makeUniqueFilename(
          sanitizeZipEntryName(metadata.filename),
          usedNames,
        );
        zip.file(safeName, decryptedBytes);
      }

      setDownloadAllStatus("Creating ZIP archive\u2026");
      setDownloadAllProgress(99);

      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `filedrop-${bundleId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadAllProgress(100);
      setDownloadAllStatus("Download complete!");
    } catch (err) {
      console.error("Download all error:", err);
      setDownloadAllError(
        err instanceof Error ? err.message : "Download failed. Please try again.",
      );
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.length < 8) return;

    // Fix 2: capture before any awaits so input changes during async work don't matter
    const capturedPassphrase = passphrase;
    setIsValidating(true);
    setValidationError(null);

    try {
      const testFile = files.find(
        (f) => f.isEncrypted && f.encryptedMetadataB64 && f.encryptedMetadataIvB64
      );
      // Fix 1: block unlock when no verifiable sample exists
      if (!testFile?.encryptedMetadataB64 || !testFile?.encryptedMetadataIvB64) {
        setValidationError("Unable to verify passphrase for this bundle.");
        return;
      }
      const keys = await deriveKeysFromParams(capturedPassphrase, derivationParams);
      await decryptMetadata(
        testFile.encryptedMetadataB64,
        testFile.encryptedMetadataIvB64,
        keys.metadataKey
      );
      // Fix 2: sync state to the passphrase we actually verified
      setPassphrase(capturedPassphrase);
      setIsUnlocked(true);
    } catch (err) {
      // Surface capability/config failures separately from wrong passphrase.
      // Use optional chaining on `name` to handle non-Error objects (e.g. DOMException).
      const errName = (err as { name?: unknown }).name;
      if (errName === "NotSupportedError" || errName === "InvalidAccessError") {
        setValidationError(
          "Could not verify passphrase (crypto unavailable). Please try a different browser."
        );
      } else {
        setValidationError("Incorrect passphrase. Please try again.");
      }
    } finally {
      setIsValidating(false);
    }
  };

  if (!isUnlocked) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>End-to-End Encrypted Files</CardTitle>
              <CardDescription>
                Enter passphrase to decrypt and download
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleUnlock}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="decrypt-passphrase">Decryption Passphrase</Label>
              <div className="relative">
                <Input
                  id="decrypt-passphrase"
                  type={showPassphrase ? "text" : "password"}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter passphrase"
                  className="pr-10"
                  autoComplete="off"
                  required
                  disabled={isValidating}
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isValidating}
                >
                  {showPassphrase ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
              <p className="font-medium mb-1 text-foreground">🔒 Your files are encrypted</p>
              <p>
                Files were encrypted in the sender&apos;s browser and will be decrypted
                locally in yours. The server never sees the passphrase or decryption
                keys.
              </p>
            </div>

            {validationError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{validationError}</AlertDescription>
              </Alert>
            )}

            {isExpired && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This bundle has expired and can no longer be unlocked or downloaded.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              disabled={passphrase.length < 8 || isValidating || !!isExpired}
              className="w-full"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Unlock Files
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-primary">
          <Shield className="h-4 w-4" />
          <span className="font-medium">Decryption unlocked</span>
        </div>
      </div>

      {isExpired && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This bundle has expired. Downloads are no longer available.
          </AlertDescription>
        </Alert>
      )}

      <Card className="w-full">
        <CardContent className="p-0">
          <div className="custom-scrollbar max-h-96 overflow-y-auto">
            {files.map((file, index) => (
              <div key={file.fileId}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <File className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">
                        {file.filename}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {file.originalSize ? formatFileSize(file.originalSize) : "Encrypted"}
                      </div>
                    </div>
                  </div>

                  {file.isEncrypted &&
                    file.wrappedDekB64 &&
                    file.wrappedDekIvB64 &&
                    file.encryptedMetadataB64 &&
                    file.encryptedMetadataIvB64 &&
                    file.baseNonceB64 &&
                    file.originalSize && (
                      <EncryptedFileDownloadButton
                        fileId={file.fileId}
                        wrappedDekB64={file.wrappedDekB64}
                        wrappedDekIvB64={file.wrappedDekIvB64}
                        encryptedMetadataB64={file.encryptedMetadataB64}
                        encryptedMetadataIvB64={file.encryptedMetadataIvB64}
                        baseNonceB64={file.baseNonceB64}
                        originalSize={file.originalSize}
                        ciphertextSize={file.size}
                        chunkSize={encryptionChunkSize}
                        passphrase={passphrase}
                        derivationParams={derivationParams}
                        isExpired={isExpired}
                      />
                    )}
                </div>
                {index < files.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>

          <CardFooter className="bg-muted/20 flex-col items-stretch gap-3 border-t p-4">
            {downloadAllError && (
              <Alert variant="destructive" className="w-full py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{downloadAllError}</AlertDescription>
              </Alert>
            )}

            {isDownloadingAll && (
              <div className="w-full space-y-2">
                <Progress value={downloadAllProgress} className="h-2" />
                {downloadAllStatus && (
                  <p className="truncate text-center text-xs text-muted-foreground">
                    {downloadAllStatus}
                  </p>
                )}
              </div>
            )}

            {hasEncryptedFiles ? (
              <Button
                size="lg"
                className="w-full"
                onClick={handleDownloadAll}
                disabled={!!isExpired || isDownloadingAll}
              >
                {isDownloadingAll ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Downloading&hellip;
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Download {files.length > 1 ? "All Files" : "File"}
                  </>
                )}
              </Button>
            ) : isExpired ? (
              <Button size="lg" className="w-full" disabled>
                <Download className="mr-2 h-5 w-5" />
                Download {files.length > 1 ? "All Files" : "File"}
              </Button>
            ) : (
              <Button asChild size="lg" className="w-full">
                <a href={`/api/bundle/${bundleId}/download`}>
                  <Download className="mr-2 h-5 w-5" />
                  Download {files.length > 1 ? "All Files" : "File"}
                </a>
              </Button>
            )}
          </CardFooter>
      </Card>
    </div>
  );
}
