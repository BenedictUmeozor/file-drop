import { NextRequest, NextResponse } from 'next/server';
import { getMetadata, isExpired, deleteFile } from '@/lib/storage';
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

    return NextResponse.json({
      id: metadata.id,
      filename: metadata.filename,
      size: metadata.size,
      mimetype: metadata.mimetype,
      createdAt: metadata.createdAt,
      expiresAt: metadata.expiresAt,
    });
  } catch (error) {
    console.error('[Files] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get file metadata' },
      { status: 500 }
    );
  }
}
