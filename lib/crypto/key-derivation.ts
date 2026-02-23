/**
 * Key derivation utilities for E2E encryption
 * Uses PBKDF2 for passphrase-based key derivation
 */

import { arrayBufferToBase64Url, base64UrlToArrayBuffer } from "./base64url";

export interface KeyDerivationParams {
  saltB64: string;
  iterations: number;
  hash: "SHA-256" | "SHA-384" | "SHA-512";
}

export interface DerivedKeys {
  kekWrapKey: CryptoKey; // Key Encryption Key for wrapping DEKs
  metadataKey: CryptoKey; // Key for encrypting metadata
  unlockKey: ArrayBuffer; // Key material for zero-knowledge unlock proof
}

/**
 * Calibrated PBKDF2 iterations for ~200-300ms on mid-tier hardware
 * Can be adjusted based on performance requirements
 */
export const DEFAULT_PBKDF2_ITERATIONS = 100000;

/**
 * Generate a random salt for PBKDF2
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Derive encryption keys from a passphrase
 * Uses PBKDF2 with SHA-256 to derive master key material,
 * then derives purpose-specific subkeys
 * 
 * Domain separation: Prepends "FileDrop-Encryption:" to passphrase
 * to ensure encryption keys cannot be derived from unlock credentials
 * 
 * @param passphrase - User-provided passphrase
 * @param salt - Random salt (16 bytes recommended)
 * @param iterations - PBKDF2 iterations (defaults to 100k)
 * @returns Object containing derived keys and parameters
 */
export async function deriveKeysFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<DerivedKeys> {
  // Domain separation: prepend label to ensure encryption and unlock derivations are distinct
  const domainSeparatedPassphrase = "FileDrop-Encryption:" + passphrase;
  
  // Import passphrase as key material
  const passphraseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(domainSeparatedPassphrase),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // Derive master key material (96 bytes = 768 bits)
  // We'll split this into three 32-byte keys for different purposes
  const masterKeyMaterial = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new Uint8Array(salt.buffer as ArrayBuffer),
      iterations: iterations,
      hash: "SHA-256",
    },
    passphraseKey,
    768 // 96 bytes = 3 × 32 bytes for three separate keys
  );

  const masterBytes = new Uint8Array(masterKeyMaterial);

  // Split into three 32-byte keys
  const kekWrapKeyBytes = masterBytes.slice(0, 32);
  const metadataKeyBytes = masterBytes.slice(32, 64);
  const unlockKeyBytes = masterBytes.slice(64, 96);

  // Import KEK wrap key for AES-GCM
  const kekWrapKey = await crypto.subtle.importKey(
    "raw",
    kekWrapKeyBytes,
    "AES-GCM",
    false,
    ["wrapKey", "unwrapKey"]
  );

  // Import metadata key for AES-GCM
  const metadataKey = await crypto.subtle.importKey(
    "raw",
    metadataKeyBytes,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );

  return {
    kekWrapKey,
    metadataKey,
    unlockKey: unlockKeyBytes.buffer,
  };
}

/**
 * Derive unlock proof from passphrase for zero-knowledge verification
 * Uses a separate salt from encryption to ensure domain separation
 * 
 * Domain separation: Prepends "FileDrop-Unlock:" to passphrase
 * to ensure unlock proof cannot be used to derive encryption keys
 * 
 * @param passphrase - User-provided passphrase
 * @param unlockSalt - Separate salt for unlock verification
 * @param iterations - PBKDF2 iterations
 * @returns Base64URL-encoded unlock proof
 */
export async function deriveUnlockProof(
  passphrase: string,
  unlockSalt: Uint8Array,
  iterations: number = DEFAULT_PBKDF2_ITERATIONS
): Promise<string> {
  // Domain separation: prepend different label to ensure unlock and encryption derivations are distinct
  const domainSeparatedPassphrase = "FileDrop-Unlock:" + passphrase;
  
  const passphraseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(domainSeparatedPassphrase),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const unlockKeyMaterial = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: new Uint8Array(unlockSalt.buffer as ArrayBuffer),
      iterations: iterations,
      hash: "SHA-256",
    },
    passphraseKey,
    256 // 32 bytes
  );

  return arrayBufferToBase64Url(unlockKeyMaterial);
}

/**
 * Re-derive keys from stored parameters (for download/decryption)
 */
export async function deriveKeysFromParams(
  passphrase: string,
  params: KeyDerivationParams
): Promise<DerivedKeys> {
  const salt = new Uint8Array(base64UrlToArrayBuffer(params.saltB64));
  return deriveKeysFromPassphrase(passphrase, salt, params.iterations);
}
