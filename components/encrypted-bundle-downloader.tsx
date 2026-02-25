"use client";

import { useState } from "react";
import { Eye, EyeOff, Shield, File, Lock } from "lucide-react";
import { EncryptedFileDownloadButton } from "./encrypted-file-download-button";
import type { KeyDerivationParams } from "@/lib/crypto";
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
import { Badge } from "@/components/ui/badge";

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
}: EncryptedBundleDownloaderProps) {
  const [passphrase, setPassphrase] = useState(initialPassphrase ?? "");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(!!initialPassphrase);

  const derivationParams: KeyDerivationParams = {
    saltB64: encryptionSaltB64,
    iterations: encryptionIterations,
    hash: "SHA-256",
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.length >= 8) {
      setIsUnlocked(true);
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              disabled={passphrase.length < 8}
              className="w-full"
            >
              <Lock className="mr-2 h-4 w-4" />
              Unlock Files
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
