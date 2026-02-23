import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { nanoid } from "nanoid";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";

// SECURITY: Strict schema validation for encryption data
const fileEncryptionDataSchema = z.object({
  fileId: z.string().regex(/^[A-Za-z0-9_-]{12}$/),
  wrappedDekB64: z.string().min(1).max(256),
  wrappedDekIvB64: z.string().min(1).max(64),
  encryptedMetadataB64: z.string().min(1).max(1024),
  encryptedMetadataIvB64: z.string().min(1).max(64),
  baseNonceB64: z.string().min(1).max(64),
  originalSize: z.number().int().min(0).max(256 * 1024 * 1024),
  ciphertextSize: z.number().int().min(0).max(256 * 1024 * 1024),
});

const encryptionDataSchema = z.object({
  isEncrypted: z.literal(true),
  encryptionSaltB64: z.string().min(1).max(64),
  encryptionIterations: z.number().int().min(10000).max(1000000),
  encryptionChunkSize: z.number().int().refine(val => val === 1048576, {
    message: "Chunk size must be 1MB (1048576 bytes)"
  }),
  unlockSaltB64: z.string().min(1).max(64),
  unlockProof: z.string().min(1).max(256),
  fileEncryptionData: z.array(fileEncryptionDataSchema).min(1).max(10),
});

// Add error formatter to surface Zod validation errors to the client
const f = createUploadthing({
  errorFormatter: (err) => {
    // Only return specific error messages for safe/known errors
    let message = "Upload processing failed";
    
    // Safe server errors that can be shown to users
    if (err.message.includes("Invalid expiry duration") ||
        err.message.includes("Expiry duration must be") ||
        err.message.includes("File too large") ||
        err.message.includes("Too many files")) {
      message = err.message;
    }
    
    return {
      message,
      zodError: err.cause instanceof z.ZodError ? err.cause.flatten() : null,
    };
  },
});
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const DEFAULT_EXPIRY_DURATION = 10 * 60 * 1000; // 10 minutes
const MAX_FILE_SIZE = "256MB";
const MAX_FILE_COUNT = 10;

// Allowed expiry durations (must match UI options)
const ALLOWED_EXPIRY_DURATIONS = [
  10 * 60 * 1000,  // 10 minutes
  30 * 60 * 1000,  // 30 minutes
  60 * 60 * 1000,  // 1 hour
];
const MAX_EXPIRY_DURATION = 60 * 60 * 1000; // 1 hour max

export const uploadRouter = {
  fileUploader: f({
    blob: {
      maxFileSize: MAX_FILE_SIZE,
      maxFileCount: MAX_FILE_COUNT,
    },
  })
    .input(
      z.object({
        expiryDuration: z.number().optional(),
        bundleId: z.string().optional(),
        // SECURITY FIX: Strict validation instead of z.any()
        encryptionData: z.union([
          encryptionDataSchema,
          z.undefined(),
        ]).optional(),
      }),
    )
    .middleware(async ({ input, files }) => {
      const bundleId = input?.bundleId || nanoid(12);
      const now = Date.now();
      
      // Validate and clamp expiryDuration to prevent unbounded expiry
      let expiryDuration = input?.expiryDuration || DEFAULT_EXPIRY_DURATION;
      
      // Reject invalid durations (security: prevent abuse)
      if (typeof expiryDuration !== 'number' || expiryDuration <= 0) {
        throw new Error('Invalid expiry duration');
      }
      
      // Clamp to maximum allowed duration
      if (expiryDuration > MAX_EXPIRY_DURATION) {
        expiryDuration = MAX_EXPIRY_DURATION;
      }
      
      // Validate against allowed durations (matches UI restrictions)
      if (!ALLOWED_EXPIRY_DURATIONS.includes(expiryDuration)) {
        throw new Error('Expiry duration must be 10min, 30min, or 1hr');
      }
      
      const expiresAt = now + expiryDuration;

      return {
        bundleId,
        createdAt: now,
        expiresAt,
        fileCount: files.length,
        encryptionData: input?.encryptionData,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Extract fileId from filename for encrypted files (format: {fileId}.enc)
      // For plaintext files, generate new fileId
      let fileId: string;
      let actualFilename: string;
      let isEncrypted = false;
      let encryptionMetadata: any = {};

      if (metadata.encryptionData?.isEncrypted && file.name.endsWith('.enc')) {
        // Encrypted file: extract fileId from filename
        fileId = file.name.replace('.enc', '');
        isEncrypted = true;
        
        // Find encryption metadata for this file
        const fileData = metadata.encryptionData.fileEncryptionData?.find(
          (f: any) => f.fileId === fileId
        );
        
        if (fileData) {
          encryptionMetadata = {
            isEncrypted: true,
            wrappedDekB64: fileData.wrappedDekB64,
            wrappedDekIvB64: fileData.wrappedDekIvB64,
            encryptedMetadataB64: fileData.encryptedMetadataB64,
            encryptedMetadataIvB64: fileData.encryptedMetadataIvB64,
            baseNonceB64: fileData.baseNonceB64,
            originalSize: fileData.originalSize,
          };
          actualFilename = `encrypted_file_${fileId}`; // Placeholder name
        } else {
          actualFilename = file.name;
        }
      } else {
        // Plaintext file
        fileId = nanoid(12);
        actualFilename = file.name;
      }

      await convex.mutation(api.files.saveFile, {
        fileId,
        bundleId: metadata.bundleId,
        filename: actualFilename,
        size: file.size,
        mimetype: file.type || "application/octet-stream",
        createdAt: metadata.createdAt,
        expiresAt: metadata.expiresAt,
        uploadThingKey: file.key,
        uploadThingUrl: file.ufsUrl,
        ...encryptionMetadata,
      });

      return {
        fileId,
        bundleId: metadata.bundleId,
        filename: actualFilename,
        size: file.size,
        expiresAt: metadata.expiresAt,
        encryptionData: metadata.encryptionData,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
