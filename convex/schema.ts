import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  files: defineTable({
    fileId: v.string(),
    filename: v.string(),
    size: v.number(),
    mimetype: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    uploadThingKey: v.string(),
    uploadThingUrl: v.string(),
  })
    .index("by_fileId", ["fileId"])
    .index("by_expiresAt", ["expiresAt"]),
});
