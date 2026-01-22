import { NextRequest, NextResponse } from 'next/server';
import { 
  getFileMetadata, 
  isFileExpired, 
  deleteFileMetadata,
  cleanupExpiredMetadata 
} from '@/lib/file-metadata';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Run cleanup in background
    cleanupExpiredMetadata();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    const metadata = getFileMetadata(id);

    if (!metadata) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    if (isFileExpired(metadata)) {
      // Delete expired file metadata
      deleteFileMetadata(id);
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
      // Include UploadThing URL for direct download
      downloadUrl: metadata.uploadThingUrl,
    });
  } catch (error) {
    console.error('[Files] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get file metadata' },
      { status: 500 }
    );
  }
}
