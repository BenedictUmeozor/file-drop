import { NextRequest, NextResponse } from 'next/server';
import { getMetadata, getFile, isExpired, deleteFile } from '@/lib/storage';
import { runCleanup } from '@/lib/cleanup';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Run cleanup in background
    runCleanup().catch(console.error);

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    const metadata = await getMetadata(id);

    if (!metadata) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    if (await isExpired(metadata)) {
      // Delete expired file
      await deleteFile(id);
      return NextResponse.json(
        { error: 'File has expired' },
        { status: 410 }
      );
    }

    const fileBuffer = await getFile(id);

    if (!fileBuffer) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(fileBuffer);

    // Create response with file data
    const response = new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': metadata.mimetype,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(metadata.filename)}"`,
        'Content-Length': metadata.size.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });

    return response;
  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
