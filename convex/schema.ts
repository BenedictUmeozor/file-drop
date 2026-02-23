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
    // E2E encryption fields
    isEncrypted: v.optional(v.boolean()),
    encryptedMetadataB64: v.optional(v.string()),
    encryptedMetadataIvB64: v.optional(v.string()),
    wrappedDekB64: v.optional(v.string()),
    wrappedDekIvB64: v.optional(v.string()),
    baseNonceB64: v.optional(v.string()),
    originalSize: v.optional(v.number()),
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
    // E2E encryption fields
    isEncrypted: v.optional(v.boolean()),
    encryptionSaltB64: v.optional(v.string()),
    encryptionIterations: v.optional(v.number()),
    encryptionChunkSize: v.optional(v.number()),
  })
    .index("by_bundleId", ["bundleId"])
    .index("by_expiresAt", ["expiresAt"]),

  bundleSecrets: defineTable({
    bundleId: v.string(),
    passphraseHash: v.optional(v.string()),
    createdAt: v.number(),
    // Zero-knowledge unlock fields
    unlockSaltB64: v.optional(v.string()),
    unlockVerifierB64: v.optional(v.string()),
  }).index("by_bundleId", ["bundleId"]),

  bundleUnlockAttempts: defineTable({
    bundleId: v.string(),
    ip: v.string(),
    windowStart: v.number(),
    count: v.number(),
    blockedUntil: v.number(),
  }).index("by_bundleId_ip", ["bundleId", "ip"]),
});
