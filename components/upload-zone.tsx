"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, File, X, Check, Loader2, CloudUpload, FolderOpen } from "lucide-react";

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function UploadZone() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds maximum limit of 200MB. Selected file is ${formatFileSize(file.size)}.`;
    }
    return null;
  };

  const uploadFile = useCallback(async (file: File) => {
    setUploadState("uploading");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });

      const response = await new Promise<{ id: string } | { error: string }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || "Upload failed"));
            } catch {
              reject(new Error("Upload failed"));
            }
          }
        };
        xhr.onerror = () => reject(new Error("Network error occurred"));
        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });

      if ("error" in response) {
        throw new Error(response.error);
      }

      setUploadState("success");
      setUploadProgress(100);
      
      // Redirect to share page after brief delay
      setTimeout(() => {
        router.push(`/share/${response.id}`);
      }, 500);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      setUploadState("error");
    }
  }, [router]);

  const handleFile = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setUploadState("error");
      return;
    }
    setSelectedFile(file);
    setErrorMessage("");
    uploadFile(file);
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadState === "idle" || uploadState === "error") {
      setUploadState("dragging");
    }
  }, [uploadState]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadState === "dragging") {
      setUploadState("idle");
    }
  }, [uploadState]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    } else {
      setUploadState("idle");
    }
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    setUploadState("idle");
    setSelectedFile(null);
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
              Release to upload your file
            </p>
          </>
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
            {selectedFile && (
              <div className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <File className="h-4 w-4" />
                <span className="max-w-xs truncate">{selectedFile.name}</span>
                <span className="text-slate-400 dark:text-slate-500">
                  ({formatFileSize(selectedFile.size)})
                </span>
              </div>
            )}
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
              <div className="bg-green-500/20 absolute inset-0 scale-150 rounded-full blur-xl" />
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

      default: // idle
        return (
          <>
            <div className="relative mb-6">
              <div className="bg-primary/20 absolute inset-0 scale-0 rounded-full blur-xl transition-transform duration-500 group-hover:scale-150" />
              <CloudUpload className="text-primary relative z-10 h-16 w-16 transition-transform duration-300 group-hover:-translate-y-2" />
            </div>
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Drag & drop files here
            </h2>
            <p className="mb-8 text-sm font-medium text-slate-400 dark:text-slate-500">
              Max file size 200MB
            </p>
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
      className={`drop-zone group relative flex h-96 w-full cursor-pointer flex-col items-center justify-center rounded-xl p-6 text-center transition-all ${
        uploadState === "dragging"
          ? "bg-primary/5 dark:bg-primary/10"
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
        className="hidden"
        onChange={handleFileSelect}
      />
      {renderContent()}
    </div>
  );
}
