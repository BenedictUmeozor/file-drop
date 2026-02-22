import { api } from "@/convex/_generated/api";
import { verifyUnlockToken, makeUnlockCookieName } from "@/lib/bundle-unlock-cookie";
import { deleteUploadThingFile } from "@/lib/utapi";
import archiver from "archiver";
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

    // Check if bundle is password protected and verify unlock
    if (bundle.isPasswordProtected) {
      const cookieName = makeUnlockCookieName(id);
      const cookieValue = request.cookies.get(cookieName)?.value;
      
      let isUnlocked = false;
      if (cookieValue) {
        const verified = verifyUnlockToken(cookieValue);
        isUnlocked = verified !== null && verified.bundleId === id;
      }

      if (!isUnlocked) {
        return NextResponse.json(
          { error: "Unauthorized: passphrase required" },
          { status: 401, headers: { "Cache-Control": "no-store" } }
        );
      }
    }

    const files = await convex.query(api.files.getBundleFilesForServer, {
      bundleId: id,
      serverToken: process.env.BUNDLE_AUTH_SERVER_TOKEN || "",
    });

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files in bundle" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (files.length === 1) {
      return NextResponse.redirect(files[0].uploadThingUrl, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const archive = archiver("zip", { zlib: { level: 5 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    await Promise.all(
      files.map(async (file) => {
        const response = await fetch(file.uploadThingUrl);
        const arrayBuffer = await response.arrayBuffer();
        archive.append(Buffer.from(arrayBuffer), { name: file.filename });
      }),
    );

    await archive.finalize();

    const zipBuffer = Buffer.concat(chunks);

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="filedrop-${id}.zip"`,
        "Content-Length": zipBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Bundle Download] Error:", error);
    return NextResponse.json(
      { error: "Failed to download bundle" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
