import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

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
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("bundles", {
      bundleId: args.bundleId,
      fileCount: args.fileCount,
      totalSize: args.totalSize,
      createdAt: args.createdAt,
      expiresAt: args.expiresAt,
    });
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

export const getBundleFiles = query({
  args: { bundleId: v.string() },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .collect();
    return files;
  },
});

export const getFile = query({
  args: { fileId: v.string() },
  handler: async (ctx, args) => {
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

export const deleteExpiredFile = internalMutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const deleteExpiredBundle = internalMutation({
  args: { id: v.id("bundles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
