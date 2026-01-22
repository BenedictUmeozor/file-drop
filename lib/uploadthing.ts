import { createUploadthing, type FileRouter } from "uploadthing/next";
import { nanoid } from "nanoid";
import { saveFileMetadata, type FileMetadata } from "@/lib/file-metadata";

const f = createUploadthing();

const EXPIRY_DURATION = 60 * 60 * 1000; // 60 minutes (1 hour) in milliseconds
const MAX_FILE_SIZE = "256MB";

// FileRouter for the app
export const uploadRouter = {
  // File uploader endpoint - accepts any file type up to 200MB
  fileUploader: f({
    blob: {
      maxFileSize: MAX_FILE_SIZE,
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      // Generate a unique ID for this upload
      const fileId = nanoid(12);
      const now = Date.now();
      
      // Return metadata that will be accessible in onUploadComplete
      return {
        fileId,
        createdAt: now,
        expiresAt: now + EXPIRY_DURATION,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This runs on the server after upload is complete
      console.log("Upload complete for fileId:", metadata.fileId);
      console.log("File URL:", file.ufsUrl);

      // Create file metadata
      const fileMetadata: FileMetadata = {
        id: metadata.fileId,
        filename: file.name,
        size: file.size,
        mimetype: file.type || "application/octet-stream",
        createdAt: metadata.createdAt,
        expiresAt: metadata.expiresAt,
        uploadThingKey: file.key,
        uploadThingUrl: file.ufsUrl,
      };

      // Save metadata to our store
      saveFileMetadata(fileMetadata);

      // Return the file ID to the client
      return {
        fileId: metadata.fileId,
        filename: file.name,
        size: file.size,
        expiresAt: metadata.expiresAt,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
