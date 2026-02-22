import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { verifyUnlockToken, makeUnlockCookieName } from "@/lib/bundle-unlock-cookie";
import { deleteUploadThingFile } from "@/lib/utapi";

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

    const file = await convex.query(api.files.getFileForServer, {
      fileId: id,
      serverToken: process.env.BUNDLE_AUTH_SERVER_TOKEN || "",
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    if (Date.now() > file.expiresAt) {
      await convex.mutation(api.files.deleteFile, { fileId: id });
      await deleteUploadThingFile(file.uploadThingKey);
      return NextResponse.json({ error: "File has expired" }, { status: 410, headers: { "Cache-Control": "no-store" } });
    }

    // Check if the file's bundle is password protected
    if (file.bundleId) {
      const bundle = await convex.query(api.files.getBundle, { 
        bundleId: file.bundleId 
      });

      if (bundle?.isPasswordProtected) {
        const cookieName = makeUnlockCookieName(file.bundleId);
        const cookieValue = request.cookies.get(cookieName)?.value;
        
        let isUnlocked = false;
        if (cookieValue) {
          const verified = verifyUnlockToken(cookieValue);
          isUnlocked = verified !== null && verified.bundleId === file.bundleId;
        }

        if (!isUnlocked) {
          return NextResponse.json(
            { error: "Unauthorized: passphrase required" },
            { status: 401, headers: { "Cache-Control": "no-store" } }
          );
        }
      }
    }

    return NextResponse.redirect(file.uploadThingUrl, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[Download] Error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
