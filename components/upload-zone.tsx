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
  FolderOpen,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (uploadState !== "uploading" && uploadState !== "success") {
        setUploadState("dragging");
      }
    },
    [uploadState],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (uploadState === "dragging") {
        setUploadState(selectedFiles.length > 0 ? "ready" : "idle");
      }
    },
    [uploadState, selectedFiles.length],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFiles(files);
      } else {
        setUploadState(selectedFiles.length > 0 ? "ready" : "idle");
      }
    },
    [handleFiles, selectedFiles.length],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(Array.from(files));
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFiles],
  );

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    setUploadState("idle");
    setSelectedFiles([]);
    setUploadProgress(0);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderContent = () => {
    switch (uploadState) {
      case "dragging":
        return (
          <>
            <div className="relative mb-6">
              <div className="bg-primary/30 absolute inset-0 scale-150 rounded-full blur-xl" />
              <Upload className="text-primary relative z-10 h-16 w-16 animate-bounce" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Drop it like it&apos;s hot!
            </h2>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
              Release to add your files (up to {MAX_FILE_COUNT})
            </p>
          </>
        );

      case "ready":
        const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
        const isNearLimit = totalSize / MAX_FILE_SIZE > 0.8;
        return (
          <div className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Files className="text-primary h-5 w-5" />
                <span className="font-medium text-slate-900 dark:text-white">
                  {selectedFiles.length} file
                  {selectedFiles.length > 1 ? "s" : ""} selected
                </span>
                <span
                  className={`text-sm ${isNearLimit ? "text-amber-500" : "text-slate-400"}`}
                >
                  ({formatFileSize(totalSize)} / 200MB)
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetUpload();
                }}
                className="text-sm text-slate-400 transition-colors hover:text-red-500"
              >
                Clear all
              </button>
            </div>

            <div className="mb-4 max-h-40 space-y-2 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <File className="text-primary h-4 w-4 shrink-0" />
                    <span className="truncate text-sm text-slate-700 dark:text-slate-300">
                      {file.name}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-2 p-1 text-slate-400 transition-colors hover:text-red-500"
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
                  handleBrowseClick();
                }}
                className="hover:border-primary hover:text-primary mb-4 w-full rounded-lg border-2 border-dashed border-slate-200 py-2 text-sm text-slate-400 transition-colors dark:border-slate-700"
              >
                + Add more files ({MAX_FILE_COUNT - selectedFiles.length}{" "}
                remaining)
              </button>
            )}

            <div
              className="mb-4 flex items-center justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Expires in:
              </span>
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
                className="hover:border-primary focus:border-primary focus:ring-primary/20 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors focus:ring-2 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
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
              className="bg-primary shadow-primary/25 hover:shadow-glow flex w-full items-center justify-center gap-2 rounded-lg px-8 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-[#13aba4] active:scale-95"
            >
              <CloudUpload className="h-5 w-5" />
              Upload {selectedFiles.length} File
              {selectedFiles.length > 1 ? "s" : ""}
            </button>
          </div>
        );

      case "uploading":
        return (
          <>
            <div className="relative mb-6">
              <Loader2 className="text-primary h-16 w-16 animate-spin" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Uploading... {uploadProgress}%
            </h2>
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Files className="h-4 w-4" />
              <span>
                {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                (
                {formatFileSize(
                  selectedFiles.reduce((sum, f) => sum + f.size, 0),
                )}
                )
              </span>
            </div>
            <div className="h-2 w-64 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="bg-primary h-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </>
        );

      case "success":
        return (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 scale-150 rounded-full bg-green-500/20 blur-xl" />
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
                <Check className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Upload Complete!
            </h2>
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
              Redirecting to share page...
            </p>
          </>
        );

      case "error":
        return (
          <>
            <div className="relative mb-6">
              <div className="absolute inset-0 scale-150 rounded-full bg-red-500/20 blur-xl" />
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-red-500">
                <X className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Upload Failed
            </h2>
            <p className="mb-6 max-w-sm text-sm font-medium text-red-500">
              {errorMessage}
            </p>
            <button
              onClick={resetUpload}
              className="bg-primary shadow-primary/25 hover:shadow-glow z-20 flex items-center gap-2 rounded-lg px-8 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-[#13aba4] active:scale-95"
            >
              Try Again
            </button>
          </>
        );

      default:
        return (
          <>
            <div className="relative mb-6">
              <div className="bg-primary/20 absolute inset-0 scale-0 rounded-full blur-xl transition-transform duration-500 group-hover:scale-150" />
              <CloudUpload className="text-primary relative z-10 h-16 w-16 transition-transform duration-300 group-hover:-translate-y-2" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Drag & drop files here
            </h2>
            <p className="mb-2 text-sm font-medium text-slate-400 dark:text-slate-500">
              Up to {MAX_FILE_COUNT} files, max 200MB total
            </p>

            <div
              className="mb-6 flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Expires in:
              </span>
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
                className="hover:border-primary focus:border-primary focus:ring-primary/20 z-20 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors focus:ring-2 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {EXPIRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleBrowseClick}
              className="bg-primary shadow-primary/25 hover:shadow-glow group/btn z-20 flex items-center gap-2 rounded-lg px-8 py-3.5 font-bold text-white shadow-lg transition-all hover:bg-[#13aba4] active:scale-95"
            >
              <FolderOpen className="h-5 w-5 group-hover/btn:animate-bounce" />
              Browse Files
            </button>
          </>
        );
    }
  };

  return (
    <div
      className={`drop-zone group relative flex min-h-96 w-full cursor-pointer flex-col items-center justify-center rounded-xl p-6 text-center transition-all ${
        uploadState === "dragging"
          ? "bg-primary/5 dark:bg-primary/10"
          : uploadState === "ready"
            ? "border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/50"
            : "bg-slate-50/50 dark:bg-transparent"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={uploadState === "idle" ? handleBrowseClick : undefined}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      {renderContent()}
    </div>
  );
}
