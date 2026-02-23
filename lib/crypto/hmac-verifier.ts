/**
 * Server-side HMAC utilities for zero-knowledge unlock verification
 * 
 * SECURITY MODEL:
 * - Client derives unlockProof from passphrase using PBKDF2
 * - Server stores HMAC(serverSecret, unlockProof) as verifier
 * - On unlock, client sends unlockProof, server computes HMAC and compares
 * - Database compromise does NOT reveal unlockProof (requires server secret)
 * 
 * This prevents server from deriving encryption keys even with DB access.
 */

import { createHmac, timingSafeEqual } from "crypto";

/**
 * Compute HMAC-SHA256 verifier from unlock proof
 * 
 * @param unlockProof - Base64URL-encoded unlock key material from client
 * @param serverSecret - Server secret from environment variable
 * @returns Base64URL-encoded HMAC verifier
 */
export function computeUnlockVerifier(
  unlockProof: string,
  serverSecret: string
): string {
  if (!serverSecret || serverSecret.length < 32) {
    throw new Error("Invalid server secret: must be at least 32 characters");
  }

  const hmac = createHmac("sha256", serverSecret);
  hmac.update(unlockProof);
  const verifier = hmac.digest("base64url");
  
  return verifier;
}

/**
 * Verify unlock proof against stored HMAC verifier
 * Uses constant-time comparison to prevent timing attacks
 * 
 * @param unlockProof - Base64URL-encoded unlock key material from client
 * @param storedVerifier - Stored HMAC verifier from database
 * @param serverSecret - Server secret from environment variable
 * @returns true if proof matches verifier
 */
export function verifyUnlockProof(
  unlockProof: string,
  storedVerifier: string,
  serverSecret: string
): boolean {
  try {
    const computedVerifier = computeUnlockVerifier(unlockProof, serverSecret);
    
    // Constant-time comparison to prevent timing attacks
    const computedBuffer = Buffer.from(computedVerifier, "base64url");
    const storedBuffer = Buffer.from(storedVerifier, "base64url");
    
    if (computedBuffer.length !== storedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(computedBuffer, storedBuffer);
  } catch (error) {
    console.error("HMAC verification error:", error);
    return false;
  }
}
