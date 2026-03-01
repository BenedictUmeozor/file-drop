import { UTApi } from "uploadthing/server";

export const utapi = new UTApi();

const UPLOADTHING_LIST_LIMIT = 1000;

type ListAllUploadThingFilesOptions = {
  maxPages?: number;
  maxDurationMs?: number;
};

export type UploadThingDeleteResult = {
  success: boolean;
  deletedCount: number;
};

export type UploadThingListItem = {
  key: string;
  uploadedAt: number;
  status: string;
};

export async function listUploadThingFilesPage(
  offset: number,
  limit = UPLOADTHING_LIST_LIMIT,
): Promise<{ files: UploadThingListItem[]; hasMore: boolean }> {
  const pageLimit = Math.min(Math.max(limit, 1), UPLOADTHING_LIST_LIMIT);
  const result = await utapi.listFiles({ limit: pageLimit, offset });

  return {
    files: result.files.map((file) => ({
      key: file.key,
      uploadedAt: file.uploadedAt,
      status: file.status,
    })),
    hasMore: result.hasMore,
  };
}

export async function listAllUploadThingFiles(
  options: ListAllUploadThingFilesOptions = {},
): Promise<UploadThingListItem[]> {
  const allFiles: UploadThingListItem[] = [];
  let offset = 0;
  let pagesRead = 0;
  const scanStartedAt = Date.now();

  while (true) {
    if (
      options.maxPages !== undefined &&
      pagesRead >= options.maxPages
    ) {
      throw new Error(
        `UploadThing file listing exceeded max pages (${options.maxPages})`,
      );
    }

    if (
      options.maxDurationMs !== undefined &&
      Date.now() - scanStartedAt >= options.maxDurationMs
    ) {
      throw new Error(
        `UploadThing file listing exceeded time budget (${options.maxDurationMs}ms)`,
      );
    }

    const page = await listUploadThingFilesPage(offset);
    pagesRead++;
    allFiles.push(...page.files);

    if (!page.hasMore || page.files.length === 0) {
      break;
    }

    offset += page.files.length;
  }

  return allFiles;
}

export async function deleteUploadThingFile(
  fileKey: string,
): Promise<UploadThingDeleteResult> {
  try {
    const result = await utapi.deleteFiles([fileKey]);

    if (!result.success) {
      console.error(
        `UploadThing reported unsuccessful single-file delete for ${fileKey}: deletedCount=${result.deletedCount}`,
      );
    }

    return {
      success: result.success,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error(`Failed to delete file ${fileKey}:`, error);
    return {
      success: false,
      deletedCount: 0,
    };
  }
}

export async function deleteUploadThingFiles(
  fileKeys: string[],
): Promise<UploadThingDeleteResult> {
  if (fileKeys.length === 0) {
    return {
      success: true,
      deletedCount: 0,
    };
  }

  try {
    const result = await utapi.deleteFiles(fileKeys);

    if (!result.success) {
      console.error(
        `UploadThing reported unsuccessful batch delete: requested=${fileKeys.length}, deletedCount=${result.deletedCount}`,
      );
    }

    return {
      success: result.success,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error("Failed to delete files:", error);
    return {
      success: false,
      deletedCount: 0,
    };
  }
}
