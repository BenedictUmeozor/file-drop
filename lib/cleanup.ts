import { listAllFiles, getMetadata, deleteFile, isExpired } from './storage';

export async function cleanupExpiredFiles(): Promise<number> {
  const fileIds = await listAllFiles();
  let deletedCount = 0;

  for (const id of fileIds) {
    const metadata = await getMetadata(id);
    if (metadata && (await isExpired(metadata))) {
      await deleteFile(id);
      deletedCount++;
      console.log(`[Cleanup] Deleted expired file: ${id}`);
    }
  }

  if (deletedCount > 0) {
    console.log(`[Cleanup] Removed ${deletedCount} expired file(s)`);
  }

  return deletedCount;
}

// Run cleanup and return a promise
export async function runCleanup(): Promise<void> {
  try {
    await cleanupExpiredFiles();
  } catch (error) {
    console.error('[Cleanup] Error during cleanup:', error);
  }
}
