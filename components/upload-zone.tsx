"use client";

import { useUploadThing } from "@/lib/uploadthing-client";
import {
  CheckCircle2,
  CloudUpload,
  Eye,
  EyeOff,
  File as FileIcon,
  Loader2,
  Trash2,
  Upload,
  Shield,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
          const encryptionData = res[0].serverData.encryptionData;
          
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
          const firstError = (fieldErrors as Record<string, string[]>)[firstField]?.[0];
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
          const encryptedFile = new File(
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
    disabled: uploadState === "uploading" || uploadState === "success",
  });

  const renderContent = () => {
    switch (uploadState) {
      case "dragging":
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full border bg-primary/4 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              Drop files to upload
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Release to start the secure transfer
            </p>
          </div>
        );

      case "ready":
        const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
        const isNearLimit = totalSize / MAX_FILE_SIZE > 0.8;
        return (
          <Card className="w-full border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
                  </CardTitle>
                  <CardDescription className={cn(isNearLimit && "text-muted-foreground font-medium")}>
                    {formatFileSize(totalSize)} / 200MB
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetUpload();
                  }}
                  className="h-8 text-muted-foreground hover:text-destructive"
                >
                  Clear all
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="px-0 py-0 space-y-4">
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="group flex items-center justify-between rounded-lg border bg-card/50 p-3 text-sm transition-colors hover:bg-muted/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="rounded-md bg-muted p-2">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="truncate font-medium text-foreground">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove {file.name}</span>
                    </Button>
                  </div>
                ))}
              </div>

              {selectedFiles.length < MAX_FILE_COUNT && (
                 <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    open();
                  }}
                 >
                   <CloudUpload className="mr-2 h-4 w-4" /> Add more files
                 </Button>
              )}

              <Separator />

              <div className="grid gap-4 pt-2" onClick={(e) => e.stopPropagation()}>
                <div className="grid gap-2">
                  <Label htmlFor="expiry" className="text-sm font-medium">
                    Auto-delete after
                  </Label>
                  <Select
                    value={expiryDuration.toString()}
                    onValueChange={(val) => {
                      const newValue = Number(val);
                      setExpiryDuration(newValue);
                      const option = EXPIRY_OPTIONS.find((opt) => opt.value === newValue);
                      if (option && onExpiryChange) {
                        onExpiryChange(option.label);
                      }
                    }}
                  >
                    <SelectTrigger id="expiry" className="w-full">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPIRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="passphrase" className="text-sm font-medium">
                      Passphrase
                    </Label>
                    {cryptoAvailable && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal gap-1 text-primary bg-primary/10 hover:bg-primary/20 border-primary/20">
                        <ShieldCheck className="h-3 w-3" />
                         E2E Encrypted
                      </Badge>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="passphrase"
                      type={showPassphrase ? "text" : "password"}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder={
                        cryptoAvailable
                          ? "Enter passphrase for encryption"
                          : "Enter passphrase (optional)"
                      }
                      className="pr-10"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    >
                      {showPassphrase ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">Toggle password visibility</span>
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {cryptoAvailable && passphrase
                      ? "Files will be encrypted in your browser before upload"
                      : "Optional protection for your download link"}
                  </p>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="px-0 pt-2 pb-0">
               <Button 
                className="w-full" 
                size="lg"
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
               >
                 Upload Files
               </Button>
            </CardFooter>
          </Card>
        );

      case "uploading":
        return (
          <div className="mx-auto flex w-full max-w-xs flex-col items-center justify-center space-y-6 py-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <svg className="h-20 w-20 -rotate-90 transform text-muted/20" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--color-primary)" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * uploadProgress) / 100} className="transition-all duration-300 ease-out" />
              </svg>
            </div>
            
            <div className="w-full space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">Uploading to FileDrop...</h2>
              </div>
              <Progress value={uploadProgress} className="h-2 w-full" />
              <p className="text-sm font-medium text-muted-foreground tabular-nums">
                {Math.round(uploadProgress)}% complete
              </p>
            </div>
          </div>
        );

      case "encrypting":
        return (
          <div className="mx-auto flex w-full max-w-xs flex-col items-center justify-center space-y-6 py-8 text-center">
            <div className="mb-2 rounded-full border bg-primary/4 p-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            
            <div className="w-full space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <h2 className="text-lg font-semibold tracking-tight">Encrypting locally...</h2>
              </div>
              <Progress value={encryptionProgress} className="h-2 w-full [&>div]:bg-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Securing your files before upload
              </p>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-10 text-center">
            <div className="rounded-full border bg-primary/4 p-4">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">Upload complete</h2>
              <p className="text-muted-foreground text-sm font-medium">
                Redirecting to your secure share link...
              </p>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="flex w-full flex-col items-center justify-center space-y-6 py-6">
            <div className="rounded-full border bg-destructive/10 p-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-destructive">Upload Failed</h2>
              <Alert variant="destructive" className="mx-auto max-w-sm border-0 bg-transparent p-0 text-center">
                 <AlertDescription className="font-medium">
                   {errorMessage}
                 </AlertDescription>
              </Alert>
            </div>
            
            <Button 
              variant="outline" 
              onClick={(e) => {
                e.stopPropagation();
                resetUpload();
              }}
              className="transition-colors"
            >
              Try Again
            </Button>
          </div>
        );

      default:
        // Idle state
        return (
          <div className="flex flex-col items-center justify-center space-y-5 py-16 text-center">
            <div className="rounded-full border bg-muted/50 p-5">
              <CloudUpload className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Click to upload or drag & drop
              </h2>
              <p className="text-sm font-medium text-muted-foreground">
                Up to {MAX_FILE_COUNT} files, {formatFileSize(MAX_FILE_SIZE)} limit
              </p>
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              Select Files
            </Button>
          </div>
        );
    }
  };

  return (
    <Card
      {...getRootProps({
        className: cn(
           "relative flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
           uploadState === "idle" && "border-border/60 bg-card/50 hover:border-primary/50 hover:bg-primary/[0.02]",
           uploadState === "dragging" && "border-primary/50 bg-primary/[0.02]",
           uploadState === "success" && "cursor-default border-primary/40 bg-primary/[0.03]",
           uploadState === "error" && "cursor-default border-destructive/50 bg-destructive/5",
           (uploadState === "ready" || uploadState === "uploading" || uploadState === "encrypting") && "cursor-default border-border/60 bg-card"
        ),
      })}
    >
      <CardContent className="flex flex-col items-center justify-center w-full p-6 z-10">
         <input {...getInputProps()} />
         {renderContent()}
      </CardContent>
    </Card>
  );
}
