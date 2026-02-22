import { v } from "convex/values";
import { UTApi } from "uploadthing/server";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

/**
 * Scheduled internal action that runs precisely at each bundle's expiresAt.
 * Scheduled via ctx.scheduler.runAt() inside the createBundle mutation.
 *
 * Two-step deletion to avoid orphaned UploadThing files:
 *   1. Delete from UploadThing (keeping Convex keys intact if this fails)
 *   2. Delete from Convex DB only after storage deletion succeeds
 *
 * NOTE: Requires UPLOADTHING_TOKEN to be set in your Convex environment
 * variables (Convex dashboard → Settings → Environment Variables).
 */
export const deleteExpiredBundle = internalAction({
  args: { bundleId: v.string() },
  handler: async (ctx, args) => {
    // Fetch bundle + file keys from Convex (needed since actions can't access ctx.db)
    const data = await ctx.runQuery(
      internal.files.getBundleWithFilesInternal,
      { bundleId: args.bundleId },
    );

    if (!data) {
      // Already cleaned up by lazy deletion — nothing to do
      return;
    }

    // Safety check: guard against clock skew or rescheduled jobs
    if (Date.now() < data.bundle.expiresAt) {
      return;
    }

    const uploadThingKeys = data.files.map(
      (f: { uploadThingKey: string }) => f.uploadThingKey,
    );

    // Step 1: Delete from UploadThing first.
    // Wrapped in try-catch so that already-deleted keys (e.g. from lazy deletion)
    // don't cause the action to fail permanently — we still clean up Convex records.
    if (uploadThingKeys.length > 0) {
      const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });
      try {
        await utapi.deleteFiles(uploadThingKeys);
      } catch (err) {
        console.error(
          "UploadThing delete error (proceeding with DB cleanup):",
          err,
        );
      }
    }

    // Step 2: Delete from Convex DB (only reached if UploadThing deletion succeeded)
    await ctx.runMutation(internal.files.deleteBundleInternal, {
      bundleId: args.bundleId,
    });
  },
});
