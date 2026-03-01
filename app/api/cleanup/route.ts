import { api } from "@/convex/_generated/api";
import { deleteUploadThingFiles } from "@/lib/utapi";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const allUploadThingKeys: string[] = [];

    // Step 1: Fetch expired bundles and collect their UploadThing keys
    const expiredBundles = await convex.query(api.files.getExpiredBundles, {});
    const bundleFileData: Array<{ bundleId: string; fileCount: number }> = [];

    for (const bundle of expiredBundles) {
      const files = await convex.query(api.files.getBundleFiles, {
        bundleId: bundle.bundleId,
      });
      const keys = files.map((f) => f.uploadThingKey);
      allUploadThingKeys.push(...keys);
      bundleFileData.push({ bundleId: bundle.bundleId, fileCount: keys.length });
    }

    // Step 2: Fetch orphaned expired files and collect their keys
    const expiredFiles = await convex.query(api.files.getExpiredFiles, {});
    for (const file of expiredFiles) {
      allUploadThingKeys.push(file.uploadThingKey);
    }

    // Step 3: Delete from UploadThing FIRST — avoids orphaned storage if Convex deletion fails
    if (allUploadThingKeys.length > 0) {
      await deleteUploadThingFiles(allUploadThingKeys);
    }

    // Step 4: Delete from Convex only after storage is cleared
    let deletedFilesCount = 0;
    let deletedBundlesCount = 0;

    for (const { bundleId, fileCount } of bundleFileData) {
      await convex.mutation(api.files.deleteBundle, { bundleId });
      deletedBundlesCount++;
      deletedFilesCount += fileCount;
    }

    for (const file of expiredFiles) {
      await convex.mutation(api.files.deleteFile, { fileId: file.fileId });
      deletedFilesCount++;
    }

    return NextResponse.json({
      message: "Cleanup completed",
      deletedBundles: deletedBundlesCount,
      deletedFiles: deletedFilesCount,
    });
  } catch (error) {
    console.error("[Cleanup] Error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
