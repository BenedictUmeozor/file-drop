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

    // Redirect to UploadThing URL for download
    // The UploadThing URL handles serving the file directly
    return NextResponse.redirect(metadata.uploadThingUrl);
  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
