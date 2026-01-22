// In-memory store for file metadata
// In production, you'd want to use a database like Redis, SQLite, or PostgreSQL

export interface FileMetadata {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  createdAt: number;
  expiresAt: number;
  uploadThingKey: string;
  uploadThingUrl: string;
}

// In-memory store (will reset on server restart)
// For production, consider using a persistent store
const fileMetadataStore = new Map<string, FileMetadata>();

export function saveFileMetadata(metadata: FileMetadata): void {
  fileMetadataStore.set(metadata.id, metadata);
  console.log(`[Metadata] Saved metadata for file: ${metadata.id}`);
}

export function getFileMetadata(id: string): FileMetadata | null {
  const metadata = fileMetadataStore.get(id);
  return metadata || null;
}

export function deleteFileMetadata(id: string): boolean {
  const deleted = fileMetadataStore.delete(id);
  if (deleted) {
    console.log(`[Metadata] Deleted metadata for file: ${id}`);
  }
  return deleted;
}

export function isFileExpired(metadata: FileMetadata): boolean {
  return Date.now() > metadata.expiresAt;
}

export function listAllFileIds(): string[] {
  return Array.from(fileMetadataStore.keys());
}

export function getAllFileMetadata(): FileMetadata[] {
  return Array.from(fileMetadataStore.values());
}

// Cleanup expired files from the metadata store
export function cleanupExpiredMetadata(): number {
  let deletedCount = 0;
  const now = Date.now();
  
  for (const [id, metadata] of fileMetadataStore.entries()) {
    if (now > metadata.expiresAt) {
      fileMetadataStore.delete(id);
      deletedCount++;
      console.log(`[Metadata Cleanup] Removed expired metadata: ${id}`);
    }
  }
  
  if (deletedCount > 0) {
    console.log(`[Metadata Cleanup] Removed ${deletedCount} expired entries`);
  }
  
  return deletedCount;
}
