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
    isPasswordProtected: v.boolean(),
  })
    .index("by_bundleId", ["bundleId"])
    .index("by_expiresAt", ["expiresAt"]),

  bundleSecrets: defineTable({
    bundleId: v.string(),
    passphraseHash: v.string(),
    createdAt: v.number(),
  }).index("by_bundleId", ["bundleId"]),

  bundleUnlockAttempts: defineTable({
    bundleId: v.string(),
    ip: v.string(),
    windowStart: v.number(),
    count: v.number(),
    blockedUntil: v.number(),
  }).index("by_bundleId_ip", ["bundleId", "ip"]),
});
