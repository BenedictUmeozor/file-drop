import { UTApi } from "uploadthing/server";

export const utapi = new UTApi();

export async function deleteUploadThingFile(fileKey: string): Promise<boolean> {
  try {
    await utapi.deleteFiles([fileKey]);
    return true;
  } catch (error) {
    console.error(`Failed to delete file ${fileKey}:`, error);
    return false;
  }
}

export async function deleteUploadThingFiles(fileKeys: string[]): Promise<number> {
  if (fileKeys.length === 0) return 0;

  try {
    await utapi.deleteFiles(fileKeys);
    return fileKeys.length;
  } catch (error) {
    console.error("Failed to delete files:", error);
    return 0;
  }
}
