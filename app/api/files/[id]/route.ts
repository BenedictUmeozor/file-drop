import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { deleteUploadThingFile } from "@/lib/utapi";
import { verifyUnlockToken, makeUnlockCookieName } from "@/lib/bundle-unlock-cookie";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    // Use getFileForServer since this is a server-side operation that needs real URLs
    const file = await convex.query(api.files.getFileForServer, {
      fileId: id,
      serverToken: process.env.BUNDLE_AUTH_SERVER_TOKEN || "",
    });

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (Date.now() > file.expiresAt) {
      await convex.mutation(api.files.deleteFile, { fileId: id });
      await deleteUploadThingFile(file.uploadThingKey);
      return NextResponse.json(
        { error: "File has expired" },
        { status: 410, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Check if file is part of a password-protected bundle
    // For protected bundles, always use guarded endpoint (never expose real URL)
    let downloadUrl = `/api/download/${file.fileId}`;
    
    if (file.bundleId) {
      const bundle = await convex.query(api.files.getBundle, { bundleId: file.bundleId });
      if (bundle?.isPasswordProtected) {
        const cookieName = makeUnlockCookieName(file.bundleId);
        const cookieValue = request.cookies.get(cookieName)?.value;
        
        let isUnlocked = false;
        if (cookieValue) {
          const verified = verifyUnlockToken(cookieValue);
          isUnlocked = verified !== null && verified.bundleId === file.bundleId;
        }
        
        // Protected files always use guarded endpoint, even when unlocked
        // This ensures consistent authorization checking
        downloadUrl = `/api/download/${file.fileId}`;
      } else {
        // Unprotected files can use direct URL for better performance
        downloadUrl = file.uploadThingUrl;
      }
    } else {
      // Files without bundles use direct URL
      downloadUrl = file.uploadThingUrl;
    }

    return NextResponse.json({
      id: file.fileId,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      createdAt: file.createdAt,
      expiresAt: file.expiresAt,
      downloadUrl,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Files] Error:", error);
    return NextResponse.json(
      { error: "Failed to get file metadata" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
