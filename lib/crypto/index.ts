/**
 * E2E Encryption utilities for FileDrop
 * 
 * Provides client-side encryption/decryption using Web Crypto API:
 * - PBKDF2 for key derivation from passphrases
 * - AES-256-GCM for file encryption (chunked for large files)
 * - Metadata encryption (filenames, MIME types)
 * - Zero-knowledge unlock verification
 */

export * from "./base64url";
export * from "./key-derivation";
export * from "./file-encryption";

// Note: hmac-verifier is server-side only (Node.js crypto module)
// and should not be imported in client code

/**
 * Check if Web Crypto API is available
 * Requires secure context (HTTPS)
 */
export function isWebCryptoAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.crypto !== "undefined" &&
    typeof window.crypto.subtle !== "undefined" &&
    window.isSecureContext === true
  );
}

/**
 * Crypto capabilities check with detailed info
 */
export interface CryptoCapabilities {
  available: boolean;
  secureContext: boolean;
  subtleCrypto: boolean;
  reason?: string;
}

export function checkCryptoCapabilities(): CryptoCapabilities {
  if (typeof window === "undefined") {
    return {
      available: false,
      secureContext: false,
      subtleCrypto: false,
      reason: "Not in browser environment",
    };
  }

  const secureContext = window.isSecureContext === true;
  const subtleCrypto = typeof window.crypto?.subtle !== "undefined";

  if (!secureContext) {
    return {
      available: false,
      secureContext: false,
      subtleCrypto,
      reason: "Requires HTTPS (secure context)",
    };
  }

  if (!subtleCrypto) {
    return {
      available: false,
      secureContext,
      subtleCrypto: false,
      reason: "Web Crypto API not available",
    };
  }

  return {
    available: true,
    secureContext: true,
    subtleCrypto: true,
  };
}
