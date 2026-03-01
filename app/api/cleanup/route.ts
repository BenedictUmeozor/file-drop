import { api } from "@/convex/_generated/api";
import { deleteUploadThingFiles, listAllUploadThingFiles } from "@/lib/utapi";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const ORPHAN_GRACE_PERIOD_MS = 2 * 60 * 60 * 1000;
const ORPHAN_DELETE_BATCH_SIZE = 200;
const CONVEX_KEYS_PAGE_SIZE = 500;
const ORPHAN_SCAN_MAX_PAGES = 150;
const ORPHAN_SCAN_MAX_DURATION_MS = 45_000;

type OrphanCleanupStats = {
  orphanedFilesFound: number;
  orphanedFilesDeleted: number;
  orphanedFileErrors: number;
};

type ExpiredCleanupStatus = "ok" | "skipped" | "partial" | "failed";

function isValidUploadThingKey(key: string | null | undefined): key is string {
  if (typeof key !== "string") {
    return false;
  }

  const normalizedKey = key.trim();
  return normalizedKey.length > 0 && normalizedKey !== "[PROTECTED]";
}

function getDeletedFileIdsFromBundleDeleteResult(
  result: { uploadThingKeys: string[] } & Record<string, unknown>,
): string[] {
  const candidate = result.deletedFileIds;
  if (!Array.isArray(candidate)) {
    return [];
  }

  return candidate.filter((item): item is string => typeof item === "string");
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown cleanup failure";
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

async function listAllConvexUploadThingKeys(serverToken: string): Promise<string[]> {
  const allKeys: string[] = [];
  let cursor: string | null = null;
  let pagesRead = 0;
  const startedAt = Date.now();

  while (true) {
    if (pagesRead >= ORPHAN_SCAN_MAX_PAGES) {
      throw new Error(
        `Convex UploadThing key scan exceeded max pages (${ORPHAN_SCAN_MAX_PAGES})`,
      );
    }

    if (Date.now() - startedAt >= ORPHAN_SCAN_MAX_DURATION_MS) {
      throw new Error(
        `Convex UploadThing key scan exceeded time budget (${ORPHAN_SCAN_MAX_DURATION_MS}ms)`,
      );
    }

    const page: {
      keys: string[];
      isDone: boolean;
      continueCursor: string | null;
    } = await convex.query(api.files.getAllUploadThingKeysForServer, {
      serverToken,
      paginationOpts: {
        cursor,
        numItems: CONVEX_KEYS_PAGE_SIZE,
      },
    });

    allKeys.push(...page.keys);
    pagesRead++;

    if (page.isDone) {
      break;
    }

    cursor = page.continueCursor;
  }

  return allKeys;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const effectiveSecret = process.env.CRON_SECRET?.trim();
    const normalizedAuthHeader = authHeader?.trim();
    const isProxyTrigger = request.headers.get("x-cleanup-trigger") === "proxy";

    if (!effectiveSecret) {
      return NextResponse.json(
        { error: "Server misconfiguration: CRON_SECRET not set" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (
      !isProxyTrigger &&
      normalizedAuthHeader !== `Bearer ${effectiveSecret}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const allUploadThingKeys: string[] = [];
    const orphanStats: OrphanCleanupStats = {
      orphanedFilesFound: 0,
      orphanedFilesDeleted: 0,
      orphanedFileErrors: 0,
    };

    const bundleServerToken = process.env.BUNDLE_AUTH_SERVER_TOKEN?.trim();
    let deletedFilesCount = 0;
    let deletedBundlesCount = 0;
    let expiredStorageRequested = 0;
    let expiredStorageDeleted = 0;
    let expiredConvexBundlesDeleted = 0;
    let expiredConvexFilesDeleted = 0;
    let expiredBundlesFound = 0;
    let standaloneExpiredFilesFound = 0;
    let convexDeletionSkipped = false;
    let expiredCleanupStatus: ExpiredCleanupStatus = "skipped";
    let mainCleanupError: string | null = null;
    const cleanupErrors: string[] = [];
    let convexDeletionStarted = false;

    try {
      if (!bundleServerToken) {
        throw new Error("Server misconfiguration: BUNDLE_AUTH_SERVER_TOKEN not set");
      }

      const expiredBundles = await convex.query(api.files.getExpiredBundles, {});
      expiredBundlesFound = expiredBundles.length;
      const expiredBundleIds = new Set<string>();
      const bundleFileIds = new Set<string>();
      const bundleKeys: string[] = [];

      for (const bundle of expiredBundles) {
        expiredBundleIds.add(bundle.bundleId);

        const files = await convex.query(api.files.getBundleFilesForServer, {
          bundleId: bundle.bundleId,
          serverToken: bundleServerToken,
        });

        for (const file of files) {
          if (!isValidUploadThingKey(file.uploadThingKey)) {
            throw new Error(
              `Invalid UploadThing key for expired bundle ${bundle.bundleId} file ${file.fileId}`,
            );
          }

          bundleKeys.push(file.uploadThingKey);
          bundleFileIds.add(file.fileId);
        }
      }

      const expiredFiles = await convex.query(api.files.getExpiredFiles, {});
      const standaloneExpiredFiles = expiredFiles.filter((file) => {
        if (file.bundleId && expiredBundleIds.has(file.bundleId)) {
          return false;
        }

        return !bundleFileIds.has(file.fileId);
      });

      standaloneExpiredFilesFound = standaloneExpiredFiles.length;

      for (const file of standaloneExpiredFiles) {
        if (!isValidUploadThingKey(file.uploadThingKey)) {
          throw new Error(`Invalid UploadThing key for expired file ${file.fileId}`);
        }
      }

      allUploadThingKeys.push(
        ...bundleKeys,
        ...standaloneExpiredFiles.map((file) => file.uploadThingKey),
      );

      const uniqueExpiredKeys = Array.from(new Set(allUploadThingKeys));
      expiredStorageRequested = uniqueExpiredKeys.length;

      if (uniqueExpiredKeys.length > 0) {
        const expiredDeleteResult = await deleteUploadThingFiles(uniqueExpiredKeys);
        expiredStorageDeleted = expiredDeleteResult.deletedCount;
        const storageDeleteSucceeded =
          expiredDeleteResult.success &&
          expiredDeleteResult.deletedCount === uniqueExpiredKeys.length;

        if (!storageDeleteSucceeded) {
          const failedCount = Math.max(
            uniqueExpiredKeys.length - expiredStorageDeleted,
            0,
          );
          convexDeletionSkipped = true;
          mainCleanupError =
            `Storage deletion failed: requested=${uniqueExpiredKeys.length}, ` +
            `deleted=${expiredStorageDeleted}, failed=${failedCount}, ` +
            `success=${expiredDeleteResult.success}`;
          cleanupErrors.push(mainCleanupError);
          expiredCleanupStatus = "failed";
          console.error("[Cleanup] Expired UploadThing delete incomplete", {
            requested: uniqueExpiredKeys.length,
            deleted: expiredStorageDeleted,
            failed: failedCount,
            success: expiredDeleteResult.success,
          });
        }
      }

      if (!mainCleanupError) {
        if (expiredBundles.length === 0 && standaloneExpiredFiles.length === 0) {
          expiredCleanupStatus = "skipped";
        } else {
          expiredCleanupStatus = "ok";
        }

        convexDeletionStarted = true;

        for (const bundle of expiredBundles) {
          try {
            const result = await convex.mutation(api.files.deleteBundle, {
              bundleId: bundle.bundleId,
            });

            const deletedFileIds = getDeletedFileIdsFromBundleDeleteResult(
              result as { uploadThingKeys: string[] } & Record<string, unknown>,
            );
            deletedFilesCount += deletedFileIds.length;

            if (result.deleted) {
              deletedBundlesCount++;
            }
          } catch (error) {
            const errorMessage =
              `Convex bundle deletion failed for ${bundle.bundleId}: ${getErrorMessage(error)}`;
            cleanupErrors.push(errorMessage);
            throw new Error(errorMessage);
          }
        }

        for (const file of standaloneExpiredFiles) {
          try {
            const result = await convex.mutation(api.files.deleteFile, {
              fileId: file.fileId,
            });

            if (result.deleted) {
              deletedFilesCount++;
            }
          } catch (error) {
            const errorMessage =
              `Convex file deletion failed for ${file.fileId}: ${getErrorMessage(error)}`;
            cleanupErrors.push(errorMessage);
            throw new Error(errorMessage);
          }
        }
      }
    } catch (error) {
      if (!mainCleanupError) {
        const message = getErrorMessage(error);
        mainCleanupError = message;
        cleanupErrors.push(message);
      }

      if (!convexDeletionStarted) {
        convexDeletionSkipped = true;
      }

      if (deletedFilesCount + deletedBundlesCount > 0) {
        expiredCleanupStatus = "partial";
      } else if (expiredCleanupStatus !== "failed") {
        expiredCleanupStatus = "failed";
      }

      console.error("[Cleanup] Expired cleanup failure:", error);
    }

    expiredConvexBundlesDeleted = deletedBundlesCount;
    expiredConvexFilesDeleted = deletedFilesCount;

    try {
      const orphanScanStart = Date.now();
      const serverToken = bundleServerToken;

      if (!serverToken) {
        throw new Error("Server misconfiguration: BUNDLE_AUTH_SERVER_TOKEN not set");
      }

      const [uploadThingFiles, convexKeys] = await Promise.all([
        listAllUploadThingFiles({
          maxPages: ORPHAN_SCAN_MAX_PAGES,
          maxDurationMs: ORPHAN_SCAN_MAX_DURATION_MS,
        }),
        listAllConvexUploadThingKeys(serverToken),
      ]);

      const convexKeySet = new Set(convexKeys);
      const graceCutoff = Date.now() - ORPHAN_GRACE_PERIOD_MS;
      const orphanKeysToDelete: string[] = [];
      let skippedGracePeriod = 0;
      let skippedByStatus = 0;

      for (const file of uploadThingFiles) {
        if (convexKeySet.has(file.key)) {
          continue;
        }

        if (file.status !== "Uploaded") {
          skippedByStatus++;
          continue;
        }

        if (file.uploadedAt > graceCutoff) {
          skippedGracePeriod++;
          continue;
        }

        orphanKeysToDelete.push(file.key);
      }

      orphanStats.orphanedFilesFound = orphanKeysToDelete.length;
      console.log(
        `[Cleanup] Orphan scan completed in ${Date.now() - orphanScanStart}ms: ` +
          `uploadThingFiles=${uploadThingFiles.length}, convexKeys=${convexKeys.length}, ` +
          `orphansFound=${orphanStats.orphanedFilesFound}, skippedStatus=${skippedByStatus}, skippedGrace=${skippedGracePeriod}`,
      );

      const orphanDeleteBatches = chunkArray(
        orphanKeysToDelete,
        ORPHAN_DELETE_BATCH_SIZE,
      );

      for (const [index, batch] of orphanDeleteBatches.entries()) {
        const deleteResult = await deleteUploadThingFiles(batch);
        const deletedCount = deleteResult.deletedCount;

        if (!deleteResult.success) {
          orphanStats.orphanedFileErrors += batch.length;
          console.error(
            `[Cleanup] Orphan delete batch ${index + 1}/${orphanDeleteBatches.length} reported unsuccessful status: ` +
              `requested=${batch.length}, deleted=${deletedCount}, success=${deleteResult.success}`,
          );
          continue;
        }

        orphanStats.orphanedFilesDeleted += deletedCount;

        if (deletedCount < batch.length) {
          const failedCount = batch.length - deletedCount;
          orphanStats.orphanedFileErrors += failedCount;
          console.error(
            `[Cleanup] Orphan delete batch ${index + 1}/${orphanDeleteBatches.length} had failures: ` +
              `requested=${batch.length}, deleted=${deletedCount}, failed=${failedCount}`,
          );
          continue;
        }

        console.log(
          `[Cleanup] Orphan delete batch ${index + 1}/${orphanDeleteBatches.length} succeeded: ` +
            `deleted=${deletedCount}`,
        );
      }
    } catch (orphanError) {
      orphanStats.orphanedFileErrors++;
      console.error("[Cleanup] Orphaned file cleanup error:", orphanError);
    }

    const responseBody = {
      message: mainCleanupError
        ? "Cleanup completed with expired cleanup errors"
        : "Cleanup completed",
      error: mainCleanupError,
      deletedBundles: deletedBundlesCount,
      deletedFiles: deletedFilesCount,
      expiredStorageRequested,
      expiredStorageDeleted,
      expiredConvexBundlesDeleted,
      expiredConvexFilesDeleted,
      expiredBundlesFound,
      standaloneExpiredFilesFound,
      expiredCleanupStatus,
      convexDeletionSkipped,
      cleanupErrors,
      orphanedFilesFound: orphanStats.orphanedFilesFound,
      orphanedFilesDeleted: orphanStats.orphanedFilesDeleted,
      orphanedFileErrors: orphanStats.orphanedFileErrors,
    };

    if (mainCleanupError) {
      return NextResponse.json(responseBody, {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("[Cleanup] Error:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
