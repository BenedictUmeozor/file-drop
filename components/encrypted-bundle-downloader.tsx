"use client";

import { useState } from "react";
import { Eye, EyeOff, Shield, File, Lock } from "lucide-react";
import { EncryptedFileDownloadButton } from "./encrypted-file-download-button";
import type { KeyDerivationParams } from "@/lib/crypto";

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
}: EncryptedBundleDownloaderProps) {
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

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
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-900/30 dark:bg-purple-900/10">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-500">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              End-to-End Encrypted Files
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter passphrase to decrypt and download
            </p>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label
              htmlFor="decrypt-passphrase"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Decryption Passphrase
            </label>
            <div className="relative">
              <input
                id="decrypt-passphrase"
                type={showPassphrase ? "text" : "password"}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter passphrase"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:placeholder-gray-500"
                autoComplete="off"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassphrase ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={passphrase.length < 8}
            className="w-full rounded-lg bg-purple-600 px-4 py-2.5 font-semibold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              Unlock Files
            </span>
          </button>
        </form>

        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400">
          <p className="font-medium mb-1">🔒 Your files are encrypted</p>
          <p>
            Files were encrypted in the sender&apos;s browser and will be decrypted
            locally in yours. The server never sees the passphrase or decryption
            keys.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 dark:border-purple-900/30 dark:bg-purple-900/10">
        <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-400">
          <Shield className="h-4 w-4" />
          <span className="font-medium">Decryption unlocked</span>
        </div>
      </div>

      <div className="custom-scrollbar max-h-96 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-slate-900/50">
        {files.map((file) => (
          <div
            key={file.fileId}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-slate-800"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <File className="h-5 w-5 shrink-0 text-purple-500" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {file.filename}
                  </div>
                  <div className="text-xs text-gray-500">
                    {file.originalSize ? formatFileSize(file.originalSize) : "Encrypted"}
                  </div>
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
        ))}
      </div>
    </div>
  );
}
