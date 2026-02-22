import { api } from "@/convex/_generated/api";
import { verifyUnlockToken, makeUnlockCookieName } from "@/lib/bundle-unlock-cookie";
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
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const bundle = await convex.query(api.files.getBundle, { bundleId: id });

    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
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
        { status: 410, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Check if bundle is unlocked (for password-protected bundles)
    let isUnlocked = true;
    if (bundle.isPasswordProtected) {
      const cookieName = makeUnlockCookieName(id);
      const cookieValue = request.cookies.get(cookieName)?.value;
      
      if (cookieValue) {
        const verified = verifyUnlockToken(cookieValue);
        isUnlocked = verified !== null && verified.bundleId === id;
      } else {
        isUnlocked = false;
      }
    }

    // Use server-guarded query to get full file data with URLs
    const files = await convex.query(api.files.getBundleFilesForServer, {
      bundleId: id,
      serverToken: process.env.BUNDLE_AUTH_SERVER_TOKEN || "",
    });

    // Prepare response headers
    const headers: HeadersInit = {};
    if (bundle.isPasswordProtected) {
      headers['Cache-Control'] = 'no-store';
    }

    return NextResponse.json({
      bundleId: bundle.bundleId,
      fileCount: bundle.fileCount,
      totalSize: bundle.totalSize,
      createdAt: bundle.createdAt,
      expiresAt: bundle.expiresAt,
      isPasswordProtected: bundle.isPasswordProtected,
      isUnlocked,
      files: files.map((f) => ({
        fileId: f.fileId,
        filename: f.filename,
        size: f.size,
        mimetype: f.mimetype,
        createdAt: f.createdAt,
        expiresAt: f.expiresAt,
        // Only expose direct URLs if bundle is unlocked, otherwise use guarded endpoint
        uploadThingUrl: isUnlocked ? f.uploadThingUrl : undefined,
        downloadUrl: isUnlocked ? undefined : `/api/download/${f.fileId}`,
      })),
    }, { headers });
  } catch (error) {
    console.error("[Bundle] Error:", error);
    return NextResponse.json(
      { error: "Failed to get bundle metadata" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
