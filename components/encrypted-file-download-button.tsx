"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, AlertCircle } from "lucide-react";
import {
  deriveKeysFromParams,
  decryptFile,
  decryptMetadata,
  type KeyDerivationParams,
} from "@/lib/crypto";

interface EncryptedFileDownloadButtonProps {
  fileId: string;
  wrappedDekB64: string;
  wrappedDekIvB64: string;
  encryptedMetadataB64: string;
  encryptedMetadataIvB64: string;
  baseNonceB64: string;
  originalSize: number;
  ciphertextSize: number;
  chunkSize: number;
  passphrase: string;
  derivationParams: KeyDerivationParams;
}

export function EncryptedFileDownloadButton({
  fileId,
  wrappedDekB64,
  wrappedDekIvB64,
  encryptedMetadataB64,
  encryptedMetadataIvB64,
  baseNonceB64,
  originalSize,
  chunkSize,
  passphrase,
  derivationParams,
}: EncryptedFileDownloadButtonProps) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionProgress, setDecryptionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [decryptedFilename, setDecryptedFilename] = useState<string | null>(null);

  // SECURITY FIX: Use useEffect instead of useState for async initialization
  useEffect(() => {
    let isMounted = true;
    
    async function decryptFilenameMetadata() {
      if (passphrase) {
        try {
          const keys = await deriveKeysFromParams(passphrase, derivationParams);
          const metadata = await decryptMetadata(
            encryptedMetadataB64,
            encryptedMetadataIvB64,
            keys.metadataKey
          );
          if (isMounted) {
            setDecryptedFilename(metadata.filename);
          }
        } catch (err) {
          console.error("Failed to decrypt metadata:", err);
        }
      }
    }
    
    decryptFilenameMetadata();
    
    return () => {
      isMounted = false;
    };
  }, [passphrase, encryptedMetadataB64, encryptedMetadataIvB64, derivationParams]);

  const handleDecryptAndDownload = async () => {
    setIsDecrypting(true);
    setDecryptionProgress(0);
    setError(null);

    try {
      // 1. Derive keys from passphrase
      const keys = await deriveKeysFromParams(passphrase, derivationParams);

      // 2. Fetch encrypted file
      const response = await fetch(`/api/download/${fileId}`);
      if (!response.ok) {
        throw new Error("Failed to download encrypted file");
      }
      const encryptedBytes = new Uint8Array(await response.arrayBuffer());

      // 3. Decrypt metadata to get original filename
      const metadata = await decryptMetadata(
        encryptedMetadataB64,
        encryptedMetadataIvB64,
        keys.metadataKey
      );

      // 4. Decrypt file data
      const decryptedBytes = await decryptFile(
        encryptedBytes,
        wrappedDekB64,
        wrappedDekIvB64,
        baseNonceB64,
        chunkSize,
        originalSize,
        keys.kekWrapKey,
        (progress) => {
          setDecryptionProgress(Math.round(progress * 100));
        }
      );

      // 5. Trigger browser download with original filename
      const blob = new Blob([decryptedBytes.buffer as ArrayBuffer], { type: metadata.mimetype });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = metadata.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDecryptionProgress(100);
    } catch (err) {
      console.error("Decryption error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Decryption failed. Check your passphrase."
      );
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <button
        onClick={handleDecryptAndDownload}
        disabled={isDecrypting || !passphrase}
        className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isDecrypting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Decrypting... {decryptionProgress}%
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            {decryptedFilename ? `Download ${decryptedFilename}` : "Decrypt & Download"}
          </>
        )}
      </button>
    </div>
  );
}
