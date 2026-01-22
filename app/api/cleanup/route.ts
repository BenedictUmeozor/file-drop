import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { deleteUploadThingFiles } from "@/lib/utapi";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expiredFiles = await convex.query(api.files.getExpiredFiles, {});

    if (expiredFiles.length === 0) {
      return NextResponse.json({ message: "No expired files", deletedCount: 0 });
    }

    const uploadThingKeys = expiredFiles.map((file) => file.uploadThingKey);
    await deleteUploadThingFiles(uploadThingKeys);

    for (const file of expiredFiles) {
      await convex.mutation(api.files.deleteFile, { fileId: file.fileId });
    }

    return NextResponse.json({
      message: "Cleanup completed",
      deletedCount: expiredFiles.length,
    });
  } catch (error) {
    console.error("[Cleanup] Error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
