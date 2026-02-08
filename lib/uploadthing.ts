import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { nanoid } from "nanoid";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";

const f = createUploadthing();
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const DEFAULT_EXPIRY_DURATION = 10 * 60 * 1000;
const MAX_FILE_SIZE = "256MB";
const MAX_FILE_COUNT = 10;

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
      }),
    )
    .middleware(async ({ input, files }) => {
      const bundleId = input?.bundleId || nanoid(12);
      const now = Date.now();
      const expiryDuration = input?.expiryDuration || DEFAULT_EXPIRY_DURATION;
      const expiresAt = now + expiryDuration;

      return {
        bundleId,
        createdAt: now,
        expiresAt,
        fileCount: files.length,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const fileId = nanoid(12);

      await convex.mutation(api.files.saveFile, {
        fileId,
        bundleId: metadata.bundleId,
        filename: file.name,
        size: file.size,
        mimetype: file.type || "application/octet-stream",
        createdAt: metadata.createdAt,
        expiresAt: metadata.expiresAt,
        uploadThingKey: file.key,
        uploadThingUrl: file.ufsUrl,
      });

      return {
        fileId,
        bundleId: metadata.bundleId,
        filename: file.name,
        size: file.size,
        expiresAt: metadata.expiresAt,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
