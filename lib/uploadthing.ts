import { createUploadthing, type FileRouter } from "uploadthing/next";
import { nanoid } from "nanoid";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const f = createUploadthing();
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const EXPIRY_DURATION = 60 * 60 * 1000;
const MAX_FILE_SIZE = "256MB";

export const uploadRouter = {
  fileUploader: f({
    blob: {
      maxFileSize: MAX_FILE_SIZE,
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const fileId = nanoid(12);
      const now = Date.now();
      return {
        fileId,
        createdAt: now,
        expiresAt: now + EXPIRY_DURATION,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await convex.mutation(api.files.saveFile, {
        fileId: metadata.fileId,
        filename: file.name,
        size: file.size,
        mimetype: file.type || "application/octet-stream",
        createdAt: metadata.createdAt,
        expiresAt: metadata.expiresAt,
        uploadThingKey: file.key,
        uploadThingUrl: file.ufsUrl,
      });

      return {
        fileId: metadata.fileId,
        filename: file.name,
        size: file.size,
        expiresAt: metadata.expiresAt,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
