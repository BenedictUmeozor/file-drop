import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    fileId: v.string(),
    bundleId: v.optional(v.string()),
    filename: v.string(),
    size: v.number(),
    mimetype: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    uploadThingKey: v.string(),
    uploadThingUrl: v.string(),
  })
    .index("by_fileId", ["fileId"])
    .index("by_bundleId", ["bundleId"])
    .index("by_expiresAt", ["expiresAt"]),

  bundles: defineTable({
    bundleId: v.string(),
    fileCount: v.number(),
    totalSize: v.number(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_bundleId", ["bundleId"])
    .index("by_expiresAt", ["expiresAt"]),
});
