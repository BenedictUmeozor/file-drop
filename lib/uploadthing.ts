import { createUploadthing, type FileRouter } from "uploadthing/next";
import { nanoid } from "nanoid";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { z } from "zod";

const f = createUploadthing();
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const DEFAULT_EXPIRY_DURATION = 10 * 60 * 1000; // 10 minutes default
const MAX_FILE_SIZE = "256MB";

export const uploadRouter = {
  fileUploader: f({
    blob: {
      maxFileSize: MAX_FILE_SIZE,
      maxFileCount: 1,
    },
  })
    .input(
      z.object({
        expiryDuration: z.number().optional(),
      })
    )
    .middleware(async ({ input }) => {
      const fileId = nanoid(12);
      const now = Date.now();
      const expiryDuration = input?.expiryDuration || DEFAULT_EXPIRY_DURATION;
      return {
        fileId,
        createdAt: now,
        expiresAt: now + expiryDuration,
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
