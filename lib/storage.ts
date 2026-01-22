import fs from 'fs/promises';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

export interface FileMetadata {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  createdAt: number;
  expiresAt: number;
}

async function ensureUploadsDir(): Promise<void> {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

export async function saveFile(
  id: string,
  buffer: Buffer,
  metadata: Omit<FileMetadata, 'id'>
): Promise<FileMetadata> {
  await ensureUploadsDir();

  const filePath = path.join(UPLOADS_DIR, id);
  const metadataPath = path.join(UPLOADS_DIR, `${id}.json`);

  const fullMetadata: FileMetadata = {
    id,
    ...metadata,
  };

  await fs.writeFile(filePath, buffer);
  await fs.writeFile(metadataPath, JSON.stringify(fullMetadata, null, 2));

  return fullMetadata;
}

export async function getMetadata(id: string): Promise<FileMetadata | null> {
  try {
    const metadataPath = path.join(UPLOADS_DIR, `${id}.json`);
    const data = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(data) as FileMetadata;
  } catch {
    return null;
  }
}

export async function getFile(id: string): Promise<Buffer | null> {
  try {
    const filePath = path.join(UPLOADS_DIR, id);
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

export async function getFilePath(id: string): Promise<string | null> {
  try {
    const filePath = path.join(UPLOADS_DIR, id);
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
}

export async function deleteFile(id: string): Promise<boolean> {
  try {
    const filePath = path.join(UPLOADS_DIR, id);
    const metadataPath = path.join(UPLOADS_DIR, `${id}.json`);

    await fs.unlink(filePath).catch(() => {});
    await fs.unlink(metadataPath).catch(() => {});

    return true;
  } catch {
    return false;
  }
}

export async function isExpired(metadata: FileMetadata): Promise<boolean> {
  return Date.now() > metadata.expiresAt;
}

export async function listAllFiles(): Promise<string[]> {
  try {
    await ensureUploadsDir();
    const files = await fs.readdir(UPLOADS_DIR);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
  } catch {
    return [];
  }
}
