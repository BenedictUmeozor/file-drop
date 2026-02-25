"use client";

import { useState, useMemo } from "react";
import { Eye, EyeOff, Shield, File, Lock, Loader2, AlertCircle } from "lucide-react";
import { EncryptedFileDownloadButton } from "./encrypted-file-download-button";
import { deriveKeysFromParams, decryptMetadata, type KeyDerivationParams } from "@/lib/crypto";
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

export function EncryptedBundleDownloader({
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
      </Card>
    </div>
  );
}
