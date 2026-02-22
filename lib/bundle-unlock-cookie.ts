import { createHmac, timingSafeEqual, randomBytes } from "crypto";

// Fail fast if secret is not set in production
const COOKIE_SECRET = process.env.BUNDLE_UNLOCK_COOKIE_SECRET;

// Generate random per-boot secret for dev environments only
let DEV_SECRET: string | null = null;

if (!COOKIE_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("BUNDLE_UNLOCK_COOKIE_SECRET must be set in production");
  }
  // Generate random secret for this boot (not persistent across restarts)
  DEV_SECRET = randomBytes(32).toString("hex");
  console.warn("[SECURITY] BUNDLE_UNLOCK_COOKIE_SECRET not set - using random per-boot secret for dev");
}

const SECRET = COOKIE_SECRET || DEV_SECRET!

/**
 * Generates the cookie name for a specific bundle.
 */
export function makeUnlockCookieName(bundleId: string): string {
  return `fd_unlock_${bundleId}`;
}

/**
 * Signs an unlock token containing bundleId and expiration.
 * Returns a base64-encoded string: payload.signature
 */
export function signUnlockToken({
  bundleId,
  exp,
}: {
  bundleId: string;
  exp: number;
}): string {
  const payload = JSON.stringify({ bundleId, exp });
  const payloadB64 = Buffer.from(payload).toString("base64url");

  const hmac = createHmac("sha256", SECRET);
  hmac.update(payloadB64);
  const signature = hmac.digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies and parses an unlock token.
 * Returns the payload if valid and not expired, otherwise null.
 */
export function verifyUnlockToken(
  token: string
): { bundleId: string; exp: number } | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) {
      return null;
    }

    // Verify signature
    const hmac = createHmac("sha256", SECRET);
    hmac.update(payloadB64);
    const expectedSignature = hmac.digest("base64url");

    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);

    if (
      expectedBuffer.length !== actualBuffer.length ||
      !timingSafeEqual(expectedBuffer, actualBuffer)
    ) {
      return null;
    }

    // Parse payload
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

    // Check expiration
    if (Date.now() > payload.exp) {
      return null;
    }

    return {
      bundleId: payload.bundleId,
      exp: payload.exp,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}
