import { api } from "@/convex/_generated/api";
import { deleteUploadThingFiles } from "@/lib/utapi";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isProxyTrigger = request.headers.get("x-cleanup-trigger") === "proxy";

    if (
      cronSecret &&
      !isProxyTrigger &&
      authHeader !== `Bearer ${cronSecret}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let deletedFilesCount = 0;
    let deletedBundlesCount = 0;
    const allUploadThingKeys: string[] = [];

    const expiredBundles = await convex.query(api.files.getExpiredBundles, {});

    for (const bundle of expiredBundles) {
      const result = await convex.mutation(api.files.deleteBundle, {
        bundleId: bundle.bundleId,
      });
      allUploadThingKeys.push(...result.uploadThingKeys);
      deletedFilesCount += result.uploadThingKeys.length;
      deletedBundlesCount++;
    }

    const expiredFiles = await convex.query(api.files.getExpiredFiles, {});

    for (const file of expiredFiles) {
      allUploadThingKeys.push(file.uploadThingKey);
      await convex.mutation(api.files.deleteFile, { fileId: file.fileId });
      deletedFilesCount++;
    }

    if (allUploadThingKeys.length > 0) {
      await deleteUploadThingFiles(allUploadThingKeys);
    }

    return NextResponse.json({
      message: "Cleanup completed",
      deletedBundles: deletedBundlesCount,
      deletedFiles: deletedFilesCount,
    });
  } catch (error) {
    console.error("[Cleanup] Error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
