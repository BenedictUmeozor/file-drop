import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { deleteUploadThingFile } from "@/lib/utapi";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const file = await convex.query(api.files.getFile, { fileId: id });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (Date.now() > file.expiresAt) {
      await convex.mutation(api.files.deleteFile, { fileId: id });
      await deleteUploadThingFile(file.uploadThingKey);
      return NextResponse.json({ error: "File has expired" }, { status: 410 });
    }

    return NextResponse.json({
      id: file.fileId,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      createdAt: file.createdAt,
      expiresAt: file.expiresAt,
      downloadUrl: file.uploadThingUrl,
    });
  } catch (error) {
    console.error("[Files] Error:", error);
    return NextResponse.json({ error: "Failed to get file metadata" }, { status: 500 });
  }
}
