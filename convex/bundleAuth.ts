import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Server-token-guarded function to retrieve bundle secret.
 * Only callable from Next.js server routes with the correct token.
 */
export const getBundleSecretForServer = query({
  args: {
    bundleId: v.string(),
    serverToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify server token
    if (args.serverToken !== process.env.BUNDLE_AUTH_SERVER_TOKEN) {
      throw new Error("Unauthorized: Invalid server token");
    }

    const secret = await ctx.db
      .query("bundleSecrets")
      .withIndex("by_bundleId", (q) => q.eq("bundleId", args.bundleId))
      .first();

    if (!secret) {
      return null;
    }

    return {
      passphraseHash: secret.passphraseHash,
    };
  },
});

/**
 * Server-token-guarded function to record unlock attempts and enforce rate limiting.
 * Returns whether the attempt is allowed and retry delay if blocked.
 */
export const recordUnlockAttemptForServer = mutation({
  args: {
    bundleId: v.string(),
    ip: v.string(),
    serverToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify server token
    if (args.serverToken !== process.env.BUNDLE_AUTH_SERVER_TOKEN) {
      throw new Error("Unauthorized: Invalid server token");
    }

    const now = Date.now();
    const WINDOW_DURATION = 10 * 60 * 1000; // 10 minutes
    const MAX_ATTEMPTS = 5;
    const BLOCK_DURATION = 10 * 60 * 1000; // 10 minutes

    // Find existing attempt record for this bundle + IP
    const existingAttempt = await ctx.db
      .query("bundleUnlockAttempts")
      .withIndex("by_bundleId_ip", (q) =>
        q.eq("bundleId", args.bundleId).eq("ip", args.ip)
      )
      .first();

    // Check if currently blocked
    if (existingAttempt && existingAttempt.blockedUntil > now) {
      const retryAfterMs = existingAttempt.blockedUntil - now;
      return {
        allowed: false,
        retryAfterMs,
      };
    }

    if (!existingAttempt) {
      // First attempt - create record
      await ctx.db.insert("bundleUnlockAttempts", {
        bundleId: args.bundleId,
        ip: args.ip,
        windowStart: now,
        count: 1,
        blockedUntil: 0,
      });
      return { allowed: true, retryAfterMs: 0 };
    }

    // Check if we're in a new window
    const windowExpired = now - existingAttempt.windowStart > WINDOW_DURATION;

    if (windowExpired) {
      // Reset count for new window
      await ctx.db.patch(existingAttempt._id, {
        windowStart: now,
        count: 1,
        blockedUntil: 0,
      });
      return { allowed: true, retryAfterMs: 0 };
    }

    // Increment count in current window
    const newCount = existingAttempt.count + 1;

    if (newCount > MAX_ATTEMPTS) {
      // Block the user
      const blockedUntil = now + BLOCK_DURATION;
      await ctx.db.patch(existingAttempt._id, {
        count: newCount,
        blockedUntil,
      });
      return {
        allowed: false,
        retryAfterMs: BLOCK_DURATION,
      };
    }

    // Update attempt count
    await ctx.db.patch(existingAttempt._id, {
      count: newCount,
    });

    return { allowed: true, retryAfterMs: 0 };
  },
});
