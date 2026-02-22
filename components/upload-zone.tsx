"use client";

import { api } from "@/convex/_generated/api";
import { useUploadThing } from "@/lib/uploadthing-client";
import { useMutation } from "convex/react";
import {
  Check,
  Clock,
  CloudUpload,
  File,
  Files,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

type UploadState =
  | "idle"
  | "dragging"
  | "ready"
  | "uploading"
  | "success"
  | "error";

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

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
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [expiryDuration, setExpiryDuration] = useState<number>(
    EXPIRY_OPTIONS[0].value,
  );

  const createBundle = useMutation(api.files.createBundle);

  const { startUpload } = useUploadThing("fileUploader", {
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
    onClientUploadComplete: async (res) => {
      if (res && res.length > 0) {
        const bundleId = res[0].serverData.bundleId;
        const totalSize = res.reduce((sum, r) => sum + r.serverData.size, 0);

        try {
          await createBundle({
            bundleId,
            fileCount: res.length,
            totalSize,
            createdAt: Date.now(),
            expiresAt: res[0].serverData.expiresAt,
          });

          setUploadState("success");
          setUploadProgress(100);

          setTimeout(() => {
            router.push(`/share/${bundleId}`);
          }, 500);
        } catch (err) {
          console.error("Bundle creation error:", err);
          setErrorMessage(
            "Files uploaded but failed to create share link. Please try again.",
          );
          setUploadState("error");
        }
      }
    },
    onUploadError: (error) => {
      console.error("Upload error:", error);

      const errorMsg = error.message?.toLowerCase() || "";
      let userMessage = "Upload failed. Please try again.";

      if (errorMsg.includes("file size") || errorMsg.includes("too large")) {
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
      } else if (error.message) {
        userMessage = error.message;
      }

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

    setUploadState("uploading");
    const bundleId = nanoid(12);
    await startUpload(selectedFiles, { expiryDuration, bundleId });
  };

  const resetUpload = () => {
    setUploadState("idle");
    setSelectedFiles([]);
    setUploadProgress(0);
    setErrorMessage("");
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

              <button
                onClick={(e) => {
                  e.stopPropagation();
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
