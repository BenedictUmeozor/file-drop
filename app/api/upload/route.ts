import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { saveFile } from '@/lib/storage';
import { runCleanup } from '@/lib/cleanup';

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const EXPIRY_DURATION = 60 * 60 * 1000; // 60 minutes (1 hour) in milliseconds

export async function POST(request: NextRequest) {
  try {
    // Run cleanup on each upload request
    runCleanup().catch(console.error);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit of 200MB` },
        { status: 413 }
      );
    }

    const id = nanoid(12);
    const buffer = Buffer.from(await file.arrayBuffer());
    const now = Date.now();

    const metadata = await saveFile(id, buffer, {
      filename: file.name,
      size: file.size,
      mimetype: file.type || 'application/octet-stream',
      createdAt: now,
      expiresAt: now + EXPIRY_DURATION,
    });

    return NextResponse.json({
      id: metadata.id,
      filename: metadata.filename,
      size: metadata.size,
      expiresAt: metadata.expiresAt,
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
