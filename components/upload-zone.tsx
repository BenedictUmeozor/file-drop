"use client";

import { useUploadThing } from "@/lib/uploadthing-client";
import {
  Check,
  Clock,
  CloudUpload,
  Eye,
  EyeOff,
  File,
  Files,
  Loader2,
  Trash2,
  Upload,
  X,
  Shield,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  generateSalt,
  deriveKeysFromPassphrase,
  deriveUnlockProof,
  DEFAULT_PBKDF2_ITERATIONS,
  encryptFile,
  uint8ArrayToBase64Url,
  isWebCryptoAvailable,
  DEFAULT_CHUNK_SIZE,
} from "@/lib/crypto";

type UploadState =
  | "idle"
  | "dragging"
  | "ready"
  | "encrypting"
  | "uploading"
  | "success"
  | "error";

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const MAX_FILE_COUNT = 10;
const MIN_PASSPHRASE_LENGTH = 8;
const MAX_PASSPHRASE_LENGTH = 128;

export const EXPIRY_OPTIONS = [
  { label: "10 minutes", value: 10 * 60 * 1000 },
  { label: "30 minutes", value: 30 * 60 * 1000 },
  { label: "1 hour", value: 60 * 60 * 1000 },
] as const;

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

interface UploadZoneProps {
  onExpiryChange?: (label: string) => void;
}

export function UploadZone({ onExpiryChange }: UploadZoneProps) {
  const router = useRouter();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [expiryDuration, setExpiryDuration] = useState<number>(
    EXPIRY_OPTIONS[0].value,
  );
  const [passphrase, setPassphrase] = useState<string>("");
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);

  // Check if E2E encryption is available
  const cryptoAvailable = typeof window !== "undefined" && isWebCryptoAvailable();

  const { startUpload } = useUploadThing("fileUploader", {
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
    onClientUploadComplete: async (res) => {
      if (res && res.length > 0) {
        const bundleId = res[0].serverData.bundleId;
        const totalSize = res.reduce((sum, r) => sum + r.serverData.size, 0);

        try {
          // Extract encryption metadata from serverData
          const encryptionData = res[0].serverData.encryptionData as any;
          
          // SECURITY: For encrypted bundles, do NOT send passphrase to server
          // The server will use the unlockProof from encryptionData instead
          const isEncrypted = encryptionData?.isEncrypted === true;
          
          // Call server endpoint to create bundle with optional password hash
          const response = await fetch("/api/bundle", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              bundleId,
              fileCount: res.length,
              totalSize,
              expiresAt: res[0].serverData.expiresAt,
              // SECURITY FIX: Only send passphrase for non-encrypted bundles
              passphrase: !isEncrypted && passphrase ? passphrase : undefined,
              encryptionData: encryptionData || undefined,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to create bundle");
          }

          setUploadState("success");
          setUploadProgress(100);

          setTimeout(() => {
            router.push(`/share/${bundleId}`);
          }, 500);
        } catch (err) {
          console.error("Bundle creation error:", err);
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "Files uploaded but failed to create share link. Please try again.",
          );
          setUploadState("error");
        }
      }
    },
    onUploadError: (error) => {
      // Enhanced error logging for diagnostics
      console.error("Upload error:", {
        code: error.code,
        message: error.message,
        data: error.data,
      });

      const errorMsg = error.message?.toLowerCase() || "";
      let userMessage = "Upload failed. Please try again.";

      // Check for Zod validation errors (highest priority)
      if (error.data?.zodError) {
        const fieldErrors = error.data.zodError.fieldErrors;
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          const firstField = Object.keys(fieldErrors)[0];
          const firstError = fieldErrors[firstField]?.[0];
          userMessage = `Validation error: ${firstError || "Invalid encryption data"}`;
        }
      } else if (errorMsg.includes("file size") || errorMsg.includes("too large")) {
        userMessage = "Total file size exceeds the 200MB limit.";
      } else if (
        errorMsg.includes("file count") ||
        errorMsg.includes("too many")
      ) {
        userMessage = "You can only upload up to 10 files at once.";
      } else if (
        errorMsg.includes("rate limit") ||
        errorMsg.includes("too many requests")
      ) {
        userMessage = "Too many uploads. Please wait a moment and try again.";
      } else if (
        errorMsg.includes("quota") ||
        errorMsg.includes("storage limit")
      ) {
        userMessage = "Storage limit reached. Please try again later.";
      } else if (
        errorMsg.includes("file type") ||
        errorMsg.includes("not allowed")
      ) {
        userMessage = "One or more file types are not supported.";
      } else if (
        errorMsg.includes("network") ||
        errorMsg.includes("connection")
      ) {
        userMessage =
          "Network error. Please check your connection and try again.";
      }
      // Note: Removed generic error.message fallback to avoid leaking server errors

      setErrorMessage(userMessage);
      setUploadState("error");
    },
    onUploadBegin: () => {
      setUploadState("uploading");
      setUploadProgress(0);
    },
  });

  const validateFiles = (files: File[]): string | null => {
    if (files.length > MAX_FILE_COUNT) {
      return `You can only upload up to ${MAX_FILE_COUNT} files at once.`;
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_FILE_SIZE) {
      return `Total file size exceeds 200MB. Current total: ${formatFileSize(totalSize)}.`;
    }

    return null;
  };

  const handleFiles = useCallback(
    (files: File[]) => {
      const existingNames = new Set(selectedFiles.map((f) => f.name));
      const newFiles = files.filter((f) => !existingNames.has(f.name));
      const combined = [...selectedFiles, ...newFiles].slice(0, MAX_FILE_COUNT);

      const error = validateFiles(combined);
      if (error) {
        setErrorMessage(error);
        setUploadState("error");
        return;
      }

      setSelectedFiles(combined);
      setErrorMessage("");
      setUploadState("ready");
    },
    [selectedFiles],
  );

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (newFiles.length === 0) {
        setUploadState("idle");
      }
      return newFiles;
    });
  };

  const startFilesUpload = async () => {
    if (selectedFiles.length === 0) return;

    const error = validateFiles(selectedFiles);
    if (error) {
      setErrorMessage(error);
      setUploadState("error");
      return;
    }

    const bundleId = nanoid(12);

    // **E2E ENCRYPTION**: Encrypt files before upload if passphrase provided and crypto available
    if (passphrase && cryptoAvailable) {
      // Declare variables outside try block for proper scoping
      let encryptedFiles: File[];
      let encryptionSaltB64: string;
      let unlockSaltB64: string;
      let unlockProof: string;
      let fileEncryptionData: Array<{
        fileId: string;
        wrappedDekB64: string;
        wrappedDekIvB64: string;
        encryptedMetadataB64: string;
        encryptedMetadataIvB64: string;
        baseNonceB64: string;
        originalSize: number;
        ciphertextSize: number;
      }>;

      try {
        setUploadState("encrypting");
        setEncryptionProgress(0);

        // 1. Generate encryption salt
        const encryptionSalt = generateSalt();
        encryptionSaltB64 = uint8ArrayToBase64Url(encryptionSalt);

        // 2. Derive keys from passphrase
        const { kekWrapKey, metadataKey } = await deriveKeysFromPassphrase(
          passphrase,
          encryptionSalt,
          DEFAULT_PBKDF2_ITERATIONS
        );

        // 3. Generate separate unlock salt for zero-knowledge verification
        const unlockSalt = generateSalt();
        unlockSaltB64 = uint8ArrayToBase64Url(unlockSalt);
        unlockProof = await deriveUnlockProof(
          passphrase,
          unlockSalt,
          DEFAULT_PBKDF2_ITERATIONS
        );

        // 4. Encrypt each file
        encryptedFiles = [];
        fileEncryptionData = [];

        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileId = nanoid(12);
          
          // Read file bytes
          const fileBytes = new Uint8Array(await file.arrayBuffer());
          
          // Encrypt file
          const result = await encryptFile(
            fileBytes,
            file.name,
            file.type || "application/octet-stream",
            kekWrapKey,
            metadataKey,
            (progress) => {
              // Overall encryption progress
              const fileProgress = (i + progress) / selectedFiles.length;
              setEncryptionProgress(Math.round(fileProgress * 100));
            }
          );

          // Create encrypted File object with random name (don't leak original filename)
          const encryptedFile = new (window as any).File(
            [result.ciphertext.buffer as ArrayBuffer],
            `${fileId}.enc`,
            { type: "application/octet-stream" }
          );

          encryptedFiles.push(encryptedFile);
          fileEncryptionData.push({
            fileId,
            wrappedDekB64: result.wrappedDek.wrappedDekB64,
            wrappedDekIvB64: result.wrappedDek.wrapIvB64,
            encryptedMetadataB64: result.encryptedMetadata.ciphertextB64,
            encryptedMetadataIvB64: result.encryptedMetadata.ivB64,
            baseNonceB64: result.baseNonceB64,
            originalSize: result.originalSize,
            ciphertextSize: result.ciphertext.length,
          });
        }

        setEncryptionProgress(100);
      } catch (err) {
        console.error("Encryption error:", err);
        setErrorMessage("Encryption failed. Please try again.");
        setUploadState("error");
        return;
      }

      // 5. Upload encrypted files (outside encryption try/catch to avoid mislabeling upload errors)
      try {
        setUploadState("uploading");
        await startUpload(encryptedFiles, {
          expiryDuration,
          bundleId,
          encryptionData: {
            isEncrypted: true,
            encryptionSaltB64,
            encryptionIterations: DEFAULT_PBKDF2_ITERATIONS,
            encryptionChunkSize: DEFAULT_CHUNK_SIZE,
            unlockSaltB64,
            unlockProof,
            fileEncryptionData,
          },
        });
      } catch (err) {
        console.error("Upload error:", err);
        // Let onUploadError be the single source of truth for error messages
        // setErrorMessage(
        //   err instanceof Error && err.message
        //     ? "Upload failed. Please try again."
        //     : "Upload failed. Please try again."
        // );
        setUploadState("error");
      }
    } else {
      // No encryption - upload plaintext files
      try {
        setUploadState("uploading");
        await startUpload(selectedFiles, { expiryDuration, bundleId });
      } catch (err) {
        console.error("Upload error:", err);
        // Let onUploadError be the single source of truth for error messages
        // setErrorMessage("Upload failed. Please try again.");
        setUploadState("error");
      }
    }
  };

  const resetUpload = () => {
    setUploadState("idle");
    setSelectedFiles([]);
    setUploadProgress(0);
    setEncryptionProgress(0);
    setErrorMessage("");
    setPassphrase("");
    setShowPassphrase(false);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFiles(acceptedFiles);
      }
    },
    [handleFiles],
  );

  const onDragEnter = useCallback(() => {
    if (uploadState !== "uploading" && uploadState !== "success") {
      setUploadState("dragging");
    }
  }, [uploadState]);

  const onDragLeave = useCallback(() => {
    if (uploadState === "dragging") {
      setUploadState(selectedFiles.length > 0 ? "ready" : "idle");
    }
  }, [uploadState, selectedFiles.length]);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    onDragEnter,
    onDragLeave,
    multiple: true,
    noClick: uploadState !== "idle",
    noKeyboard: true,
    disabled: uploadState === "uploading" || uploadState === "success",
  });

  const renderContent = () => {
    switch (uploadState) {
      case "dragging":
        return (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary animate-bounce" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Drop files here
            </h2>
          </div>
        );

      case "ready":
        const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
        const isNearLimit = totalSize / MAX_FILE_SIZE > 0.8;
        return (
          <div className="w-full">
            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Files className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}
                </span>
                <span
                  className={`text-sm ${isNearLimit ? "text-amber-500" : "text-gray-400"}`}
                >
                  ({formatFileSize(totalSize)} / 200MB)
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetUpload();
                }}
                className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                type="button"
              >
                Clear all
              </button>
            </div>

            <div className="mb-4 max-h-48 space-y-1 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="group flex items-center justify-between rounded-md p-2 hover:bg-gray-50 dark:hover:bg-slate-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <File className="h-4 w-4 text-gray-400" />
                    <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                      {file.name}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                    type="button"
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {selectedFiles.length < MAX_FILE_COUNT && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  open();
                }}
                className="mb-6 w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors dark:border-gray-600"
                type="button"
              >
                + Add more files
              </button>
            )}

            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div
                className="flex items-center justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-delete after:
                  </span>
                </div>
                <select
                  value={expiryDuration}
                  onChange={(e) => {
                    const newValue = Number(e.target.value);
                    setExpiryDuration(newValue);
                    const option = EXPIRY_OPTIONS.find(
                      (opt) => opt.value === newValue,
                    );
                    if (option && onExpiryChange) {
                      onExpiryChange(option.label);
                    }
                  }}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none dark:border-gray-600 dark:bg-slate-800 dark:text-gray-300"
                >
                  {EXPIRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <label
                  htmlFor="passphrase"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Passphrase (optional)
                  {cryptoAvailable && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <Shield className="h-3 w-3" />
                      E2E encrypted
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id="passphrase"
                    type={showPassphrase ? "text" : "password"}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder={
                      cryptoAvailable
                        ? "Enter passphrase for encryption + protection"
                        : "Enter passphrase for protection only"
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:placeholder-gray-500"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    tabIndex={-1}
                  >
                    {showPassphrase ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {cryptoAvailable && passphrase
                    ? "Files will be encrypted in your browser before upload"
                    : `Use a long passphrase; ${MIN_PASSPHRASE_LENGTH}+ characters recommended`}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  
                  // Validate passphrase if provided
                  if (passphrase.length > 0) {
                    if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
                      setErrorMessage(
                        `Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters`
                      );
                      setUploadState("error");
                      return;
                    }
                    if (passphrase.length > MAX_PASSPHRASE_LENGTH) {
                      setErrorMessage(
                        `Passphrase must be at most ${MAX_PASSPHRASE_LENGTH} characters`
                      );
                      setUploadState("error");
                      return;
                    }
                  }
                  
                  startFilesUpload();
                }}
                className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                Upload Files
              </button>
            </div>
          </div>
        );

      case "uploading":
        return (
          <div className="flex flex-col items-center justify-center py-8 w-full">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
              Uploading...
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              {uploadProgress}% complete
            </p>
            
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-700">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        );

      case "encrypting":
        return (
          <div className="flex flex-col items-center justify-center py-8 w-full">
            <div className="mb-4 rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
              <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400 animate-pulse" />
            </div>
            <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
              Encrypting files...
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              {encryptionProgress}% encrypted
            </p>
            
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-700">
              <div 
                className="h-full bg-purple-600 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${encryptionProgress}%` }}
              />
            </div>
            <p className="mt-4 text-xs text-gray-400">
              End-to-end encryption in progress
            </p>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Upload Complete!
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Redirecting to your share link...
            </p>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center justify-center py-6 w-full">
            <div className="mb-4 rounded-full bg-red-50 p-3 dark:bg-red-900/20">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Upload Failed
            </h2>
            <div className="mt-2 mb-6 rounded-md bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600 w-full text-center dark:bg-red-900/10 dark:border-red-900/20">
              {errorMessage}
            </div>
            <button
              onClick={resetUpload}
              className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900"
              type="button"
            >
              Try Again
            </button>
          </div>
        );

      default:
        // Idle state
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-gray-50 p-4 border border-gray-100 dark:bg-slate-800 dark:border-slate-700">
              <CloudUpload className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Click to upload or drag & drop
            </h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
              Up to {MAX_FILE_COUNT} files, {formatFileSize(MAX_FILE_SIZE)} limit
            </p>
            
            <button
               onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300"
              type="button"
            >
              Select Files
            </button>
          </div>
        );
    }
  };

  return (
    <div
      {...getRootProps({
        className: `relative flex min-h-[400px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all duration-200 outline-none
          ${
            uploadState === "dragging"
              ? "border-primary bg-primary/5"
              : uploadState === "success"
              ? "border-green-400"
              : uploadState === "error"
              ? "border-red-300"
              : uploadState === "uploading"
              ? "border-indigo-400"
              : uploadState === "ready"
              ? "border-gray-300"
              : "border-gray-300 hover:border-primary/50 hover:bg-gray-50/50 dark:border-gray-700 dark:hover:bg-slate-800/50"
          }
          ${uploadState === "ready" || uploadState === "uploading" || uploadState === "success" || uploadState === "error" ? "cursor-default bg-white dark:bg-slate-800" : ""}
        `,
      })}
    >
      <input {...getInputProps()} />
      {renderContent()}
    </div>
  );
}
