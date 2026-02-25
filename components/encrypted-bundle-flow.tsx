"use client";

import { useState } from "react";
import { BundleUnlockForm } from "./bundle-unlock-form";
import { EncryptedBundleDownloader } from "./encrypted-bundle-downloader";

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

interface EncryptedBundleFlowProps {
  bundleId: string;
  files: FileMetadata[];
  unlockSaltB64?: string;
  encryptionSaltB64: string;
  encryptionIterations: number;
  encryptionChunkSize: number;
}

/**
 * Orchestrates the passphrase-protected, encrypted bundle download flow so
 * the user only enters their passphrase once.
 *
 * Stage 1 (capturedPassphrase === null):
 *   Renders BundleUnlockForm which posts an HMAC-derived unlock proof to the
 *   server (zero-knowledge — the raw passphrase never leaves the browser).
 *   On success (HTTP 204 + unlock cookie set), the callback receives the raw
 *   passphrase and we advance to stage 2 without a page refresh.
 *
 * Stage 2 (capturedPassphrase set):
 *   Renders EncryptedBundleDownloader with initialPassphrase already populated,
 *   skipping its local passphrase gate and going straight to the file list.
 *
 * Security: the passphrase is held only in React state (client memory). The
 * server receives only the derived unlock proof; it never sees the passphrase
 * or any key material used for decryption.
 */
export function EncryptedBundleFlow({
  bundleId,
  files,
  unlockSaltB64,
  encryptionSaltB64,
  encryptionIterations,
  encryptionChunkSize,
}: EncryptedBundleFlowProps) {
  const [capturedPassphrase, setCapturedPassphrase] = useState<string | null>(null);

  if (capturedPassphrase === null) {
    return (
      <BundleUnlockForm
        bundleId={bundleId}
        isEncrypted
        unlockSaltB64={unlockSaltB64}
        encryptionIterations={encryptionIterations}
        onUnlocked={setCapturedPassphrase}
      />
    );
  }

  return (
    <EncryptedBundleDownloader
      files={files}
      encryptionSaltB64={encryptionSaltB64}
      encryptionIterations={encryptionIterations}
      encryptionChunkSize={encryptionChunkSize}
      initialPassphrase={capturedPassphrase}
    />
  );
}
