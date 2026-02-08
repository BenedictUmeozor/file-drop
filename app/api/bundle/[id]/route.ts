import { api } from "@/convex/_generated/api";
import { deleteUploadThingFile } from "@/lib/utapi";
import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Bundle ID is required" },
        { status: 400 },
      );
    }

    const bundle = await convex.query(api.files.getBundle, { bundleId: id });

    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    if (Date.now() > bundle.expiresAt) {
      const result = await convex.mutation(api.files.deleteBundle, {
        bundleId: id,
      });
      if (result.uploadThingKeys.length > 0) {
        await Promise.all(
          result.uploadThingKeys.map((key) => deleteUploadThingFile(key)),
        );
      }
      return NextResponse.json(
        { error: "Files have expired" },
        { status: 410 },
      );
    }

    const files = await convex.query(api.files.getBundleFiles, {
      bundleId: id,
    });

    return NextResponse.json({
      bundleId: bundle.bundleId,
      fileCount: bundle.fileCount,
      totalSize: bundle.totalSize,
      createdAt: bundle.createdAt,
      expiresAt: bundle.expiresAt,
      files: files.map((f) => ({
        fileId: f.fileId,
        filename: f.filename,
        size: f.size,
        mimetype: f.mimetype,
        createdAt: f.createdAt,
        expiresAt: f.expiresAt,
        uploadThingUrl: f.uploadThingUrl,
      })),
    });
  } catch (error) {
    console.error("[Bundle] Error:", error);
    return NextResponse.json(
      { error: "Failed to get bundle metadata" },
      { status: 500 },
    );
  }
}
