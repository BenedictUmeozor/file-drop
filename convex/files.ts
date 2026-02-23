import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

const SERVER_TOKEN = process.env.BUNDLE_AUTH_SERVER_TOKEN;

export const saveFile = mutation({
  args: {
    fileId: v.string(),
    bundleId: v.string(),
    filename: v.string(),
    size: v.number(),
    mimetype: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    uploadThingKey: v.string(),
    uploadThingUrl: v.string(),
    // E2E encryption fields
    isEncrypted: v.optional(v.boolean()),
    encryptedMetadataB64: v.optional(v.string()),
    encryptedMetadataIvB64: v.optional(v.string()),
    wrappedDekB64: v.optional(v.string()),
    wrappedDekIvB64: v.optional(v.string()),
    baseNonceB64: v.optional(v.string()),
    originalSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("files", {
      fileId: args.fileId,
      bundleId: args.bundleId,
      filename: args.filename,
      size: args.size,
      mimetype: args.mimetype,
      createdAt: args.createdAt,
      expiresAt: args.expiresAt,
      uploadThingKey: args.uploadThingKey,
      uploadThingUrl: args.uploadThingUrl,
      isEncrypted: args.isEncrypted,
      encryptedMetadataB64: args.encryptedMetadataB64,
      encryptedMetadataIvB64: args.encryptedMetadataIvB64,
      wrappedDekB64: args.wrappedDekB64,
      wrappedDekIvB64: args.wrappedDekIvB64,
      baseNonceB64: args.baseNonceB64,
      originalSize: args.originalSize,
    });
    return id;
  },
});

export const createBundle = mutation({
  args: {
    bundleId: v.string(),
    fileCount: v.number(),
    totalSize: v.number(),
    createdAt: v.number(),
    expiresAt: v.number(),
    passphraseHash: v.optional(v.string()),
    serverToken: v.string(),
    // E2E encryption fields
    isEncrypted: v.optional(v.boolean()),
    encryptionSaltB64: v.optional(v.string()),
    encryptionIterations: v.optional(v.number()),
    encryptionChunkSize: v.optional(v.number()),
    unlockSaltB64: v.optional(v.string()),
    unlockVerifierB64: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify server token
    if (args.serverToken !== SERVER_TOKEN) {
      throw new Error("Unauthorized: Invalid server token");
    }

    // Server-side validation: reject invalid timestamps
    const now = Date.now();
    if (args.createdAt > now + 60000) { // Allow 1min clock skew
      throw new Error("Invalid createdAt: timestamp in future");
    }
    if (args.expiresAt <= now) {
      throw new Error("Invalid expiresAt: already expired");
    }
    if (args.expiresAt <= args.createdAt) {
      throw new Error("Invalid expiresAt: must be after createdAt");
    }

    // Bundle is password protected if it has passphraseHash OR unlockVerifier
    const isPasswordProtected = !!(args.passphraseHash || args.unlockVerifierB64);

    const id = await ctx.db.insert("bundles", {
      bundleId: args.bundleId,
      fileCount: args.fileCount,
      totalSize: args.totalSize,
      createdAt: args.createdAt,
      expiresAt: args.expiresAt,
      isPasswordProtected,
      isEncrypted: args.isEncrypted,
      encryptionSaltB64: args.encryptionSaltB64,
      encryptionIterations: args.encryptionIterations,
      encryptionChunkSize: args.encryptionChunkSize,
    });

    // Store secrets if either passphraseHash or unlockVerifier is present
    if (args.passphraseHash || args.unlockVerifierB64) {
      await ctx.db.insert("bundleSecrets", {
        bundleId: args.bundleId,
        passphraseHash: args.passphraseHash,
        createdAt: args.createdAt,
        unlockSaltB64: args.unlockSaltB64,
        unlockVerifierB64: args.unlockVerifierB64,
      });
    }

    // Schedule precise cleanup to fire exactly when this bundle expires
    await ctx.scheduler.runAt(
      args.expiresAt,
      internal.cleanup.deleteExpiredBundle,
      { bundleId: args.bundleId },
    );

    return id;
  },
});

export const getBundle = query({
  args: { bundleId: v.string() },
  handler: async (ctx, args) => {
    const bundle = await ctx.db
      .query("bundles")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .first();
    return bundle;
  },
});

/**
 * Public query - returns file metadata WITHOUT uploadThingUrl for password-protected bundles.
 * This prevents direct URL access bypass. Use server-guarded version for trusted routes.
 */
export const getBundleFiles = query({
  args: { bundleId: v.string() },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .collect();

    // Check if bundle is password protected
    const bundle = await ctx.db
      .query("bundles")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .first();

    if (bundle?.isPasswordProtected) {
      // Strip uploadThingUrl and uploadThingKey from protected bundles
      return files.map((f) => ({
        _id: f._id,
        _creationTime: f._creationTime,
        fileId: f.fileId,
        bundleId: f.bundleId,
        filename: f.filename,
        size: f.size,
        mimetype: f.mimetype,
        createdAt: f.createdAt,
        expiresAt: f.expiresAt,
        uploadThingKey: "[PROTECTED]",
        uploadThingUrl: "[PROTECTED]",
      }));
    }

    return files;
  },
});

/**
 * Server-token-guarded query - returns full file data including uploadThingUrl.
 * Only callable from Next.js server routes with the correct token.
 */
export const getBundleFilesForServer = query({
  args: {
    bundleId: v.string(),
    serverToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify server token
    if (args.serverToken !== SERVER_TOKEN) {
      throw new Error("Unauthorized: Invalid server token");
    }

    const files = await ctx.db
      .query("files")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .collect();
    return files;
  },
});

/**
 * Public query - returns file metadata WITHOUT uploadThingUrl for password-protected bundles.
 * This prevents direct URL access bypass. Use server-guarded version for trusted routes.
 */
export const getFile = query({
  args: { fileId: v.string() },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("files")
      .withIndex("by_fileId", (q) => q.eq("fileId", args.fileId))
      .first();

    if (!file) return null;

    // Check if file belongs to a password-protected bundle
    if (file.bundleId) {
      const bundleId = file.bundleId; // Store in variable for type narrowing
      const bundle = await ctx.db
        .query("bundles")
        .withIndex("by_bundleId", (q) => q.eq("bundleId", bundleId))
        .first();

      if (bundle?.isPasswordProtected) {
        // Strip uploadThingUrl and uploadThingKey from protected files
        return {
          _id: file._id,
          _creationTime: file._creationTime,
          fileId: file.fileId,
          bundleId: file.bundleId,
          filename: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          createdAt: file.createdAt,
          expiresAt: file.expiresAt,
          uploadThingKey: "[PROTECTED]",
          uploadThingUrl: "[PROTECTED]",
        };
      }
    }

    return file;
  },
});

/**
 * Server-token-guarded query - returns full file data including uploadThingUrl.
 * Only callable from Next.js server routes with the correct token.
 */
export const getFileForServer = query({
  args: {
    fileId: v.string(),
    serverToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify server token
    if (args.serverToken !== SERVER_TOKEN) {
      throw new Error("Unauthorized: Invalid server token");
    }

    const file = await ctx.db
      .query("files")
      .withIndex("by_fileId", (q) => q.eq("fileId", args.fileId))
      .first();
    return file;
  },
});

export const deleteFile = mutation({
  args: { fileId: v.string() },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("files")
      .withIndex("by_fileId", (q) => q.eq("fileId", args.fileId))
      .first();

    if (file) {
      await ctx.db.delete(file._id);
      return { deleted: true, uploadThingKey: file.uploadThingKey };
    }
    return { deleted: false, uploadThingKey: null };
  },
});

export const deleteBundle = mutation({
  args: { bundleId: v.string() },
  handler: async (ctx, args) => {
    const bundle = await ctx.db
      .query("bundles")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .first();

    const files = await ctx.db
      .query("files")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .collect();

    const uploadThingKeys: string[] = [];

    for (const file of files) {
      uploadThingKeys.push(file.uploadThingKey);
      await ctx.db.delete(file._id);
    }

    // Delete bundle secret if it exists
    const secret = await ctx.db
      .query("bundleSecrets")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .first();
    if (secret) {
      await ctx.db.delete(secret._id);
    }

    // Delete all unlock attempts for this bundle
    const attempts = await ctx.db
      .query("bundleUnlockAttempts")
      .withIndex("by_bundleId_ip")
      .filter((q) => q.eq(q.field("bundleId"), args.bundleId))
      .collect();
    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }

    if (bundle) {
      await ctx.db.delete(bundle._id);
    }

    return { deleted: true, uploadThingKeys };
  },
});

export const getExpiredFiles = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredFiles = await ctx.db
      .query("files")
      .withIndex("by_expiresAt")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    return expiredFiles;
  },
});

export const getExpiredBundles = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiredBundles = await ctx.db
      .query("bundles")
      .withIndex("by_expiresAt")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    return expiredBundles;
  },
});

// ─── Internal helpers used by convex/cleanup.ts ─────────────────────────────

/** Returns a bundle and all its files in one query (for use inside actions). */
export const getBundleWithFilesInternal = internalQuery({
  args: { bundleId: v.string() },
  handler: async (ctx, args) => {
    const bundle = await ctx.db
      .query("bundles")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .first();
    if (!bundle) return null;
    const files = await ctx.db
      .query("files")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .collect();
    return { bundle, files };
  },
});

/** Deletes a bundle and all its files from Convex DB by bundleId string. */
export const deleteBundleInternal = internalMutation({
  args: { bundleId: v.string() },
  handler: async (ctx, args) => {
    const bundle = await ctx.db
      .query("bundles")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .first();
    const files = await ctx.db
      .query("files")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .collect();
    for (const file of files) {
      await ctx.db.delete(file._id);
    }

    // Delete bundle secret if it exists
    const secret = await ctx.db
      .query("bundleSecrets")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .first();
    if (secret) {
      await ctx.db.delete(secret._id);
    }

    // Delete all unlock attempts for this bundle
    const attempts = await ctx.db
      .query("bundleUnlockAttempts")
      .withIndex("by_bundleId_ip")
      .filter((q) => q.eq(q.field("bundleId"), args.bundleId))
      .collect();
    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }

    if (bundle) {
      await ctx.db.delete(bundle._id);
    }
  },
});

export const deleteExpiredFile = internalMutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const deleteBundleById = internalMutation({
  args: { id: v.id("bundles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
