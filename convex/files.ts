import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const saveFile = mutation({
  args: {
    fileId: v.string(),
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

export const deleteExpiredFile = internalMutation({
  args: { id: v.id("files") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
