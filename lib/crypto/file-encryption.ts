/**
 * File encryption/decryption utilities
 * Implements chunked AES-GCM encryption for large files
 */

import { arrayBufferToBase64Url, base64UrlToArrayBuffer } from "./base64url";

export interface EncryptedFileResult {
  ciphertext: Uint8Array;
  dekB64: string; // Base64URL-encoded Data Encryption Key (plaintext, will be wrapped)
  baseNonceB64: string;
  chunkSize: number;
  totalChunks: number;
}

export interface WrappedDEK {
  wrappedDekB64: string;
  wrapIvB64: string;
}

export interface EncryptedMetadata {
  ciphertextB64: string;
  ivB64: string;
}

/**
 * Default chunk size: 1 MiB
 * Balances memory usage and performance
 */
export const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1 MiB

/**
 * Generate a random Data Encryption Key (DEK) for file encryption
 */
export async function generateDEK(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable (so we can wrap it)
    ["encrypt", "decrypt"]
  );
}

/**
 * Wrap a DEK with a KEK using AES-GCM
 */
export async function wrapDEK(
  dek: CryptoKey,
  kekWrapKey: CryptoKey
): Promise<WrappedDEK> {
  const wrapIv = crypto.getRandomValues(new Uint8Array(12));
  
  const wrappedKey = await crypto.subtle.wrapKey(
    "raw",
    dek,
    kekWrapKey,
    {
      name: "AES-GCM",
      iv: wrapIv,
    }
  );

  return {
    wrappedDekB64: arrayBufferToBase64Url(wrappedKey),
    wrapIvB64: arrayBufferToBase64Url(wrapIv.buffer),
  };
}

/**
 * Unwrap a DEK from its wrapped form
 */
export async function unwrapDEK(
  wrappedDekB64: string,
  wrapIvB64: string,
  kekWrapKey: CryptoKey
): Promise<CryptoKey> {
  const wrappedKey = base64UrlToArrayBuffer(wrappedDekB64);
  const wrapIv = base64UrlToArrayBuffer(wrapIvB64);

  return crypto.subtle.unwrapKey(
    "raw",
    wrappedKey,
    kekWrapKey,
    {
      name: "AES-GCM",
      iv: wrapIv,
    },
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt file data in chunks using AES-GCM
 * Returns encrypted data with metadata for decryption
 * 
 * @param fileData - Raw file bytes
 * @param dek - Data Encryption Key
 * @param chunkSize - Size of each chunk (default 1 MiB)
 * @param onProgress - Optional progress callback (0-1)
 */
export async function encryptFileChunked(
  fileData: Uint8Array,
  dek: CryptoKey,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  onProgress?: (progress: number) => void
): Promise<Omit<EncryptedFileResult, 'dekB64'>> {
  const baseNonce = crypto.getRandomValues(new Uint8Array(12));
  const totalChunks = Math.ceil(fileData.length / chunkSize);
  const encryptedChunks: Uint8Array[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, fileData.length);
    const chunk = fileData.slice(start, end);

    // Create unique nonce for this chunk: baseNonce + counter
    const chunkNonce = new Uint8Array(12);
    chunkNonce.set(baseNonce);
    // XOR the last 4 bytes with the chunk counter
    const counterBytes = new Uint8Array(4);
    new DataView(counterBytes.buffer).setUint32(0, i, false); // big-endian
    for (let j = 0; j < 4; j++) {
      chunkNonce[8 + j] ^= counterBytes[j];
    }

    // Additional authenticated data: chunk index
    const aad = new Uint8Array(4);
    new DataView(aad.buffer).setUint32(0, i, false);

    const encryptedChunk = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: chunkNonce,
        additionalData: aad,
      },
      dek,
      chunk
    );

    encryptedChunks.push(new Uint8Array(encryptedChunk));

    if (onProgress) {
      onProgress((i + 1) / totalChunks);
    }
  }

  // Concatenate all encrypted chunks
  const totalSize = encryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const ciphertext = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of encryptedChunks) {
    ciphertext.set(chunk, offset);
    offset += chunk.length;
  }

  return {
    ciphertext,
    baseNonceB64: arrayBufferToBase64Url(baseNonce.buffer),
    chunkSize,
    totalChunks,
  };
}

/**
 * Decrypt chunked encrypted file data
 * 
 * @param ciphertext - Encrypted file data
 * @param dek - Data Encryption Key
 * @param baseNonceB64 - Base64URL-encoded base nonce
 * @param chunkSize - Size of each chunk
 * @param originalSize - Original file size (to handle last chunk)
 * @param onProgress - Optional progress callback (0-1)
 */
export async function decryptFileChunked(
  ciphertext: Uint8Array,
  dek: CryptoKey,
  baseNonceB64: string,
  chunkSize: number,
  originalSize: number,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const baseNonce = new Uint8Array(base64UrlToArrayBuffer(baseNonceB64));
  
  // Calculate encrypted chunk size (includes 16-byte auth tag)
  const encryptedChunkSize = chunkSize + 16;
  const totalChunks = Math.ceil(originalSize / chunkSize);
  const decryptedChunks: Uint8Array[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * encryptedChunkSize;
    // Last chunk might be smaller
    const isLastChunk = i === totalChunks - 1;
    const plaintextChunkSize = isLastChunk ? (originalSize % chunkSize || chunkSize) : chunkSize;
    const end = start + plaintextChunkSize + 16; // +16 for auth tag
    const encryptedChunk = ciphertext.slice(start, end);

    // Reconstruct chunk nonce
    const chunkNonce = new Uint8Array(12);
    chunkNonce.set(baseNonce);
    const counterBytes = new Uint8Array(4);
    new DataView(counterBytes.buffer).setUint32(0, i, false);
    for (let j = 0; j < 4; j++) {
      chunkNonce[8 + j] ^= counterBytes[j];
    }

    // Reconstruct AAD
    const aad = new Uint8Array(4);
    new DataView(aad.buffer).setUint32(0, i, false);

    try {
      const decryptedChunk = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: chunkNonce,
          additionalData: aad,
        },
        dek,
        encryptedChunk
      );

      decryptedChunks.push(new Uint8Array(decryptedChunk));
    } catch (error) {
      throw new Error(`Decryption failed at chunk ${i}: ${error}`);
    }

    if (onProgress) {
      onProgress((i + 1) / totalChunks);
    }
  }

  // Concatenate all decrypted chunks
  const totalSize = decryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const plaintext = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of decryptedChunks) {
    plaintext.set(chunk, offset);
    offset += chunk.length;
  }

  return plaintext;
}

/**
 * Encrypt metadata (filename, mimetype, etc.) using AES-GCM
 */
export async function encryptMetadata(
  metadata: { filename: string; mimetype: string; size: number },
  metadataKey: CryptoKey
): Promise<EncryptedMetadata> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(metadata));

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    metadataKey,
    plaintext
  );

  return {
    ciphertextB64: arrayBufferToBase64Url(ciphertext),
    ivB64: arrayBufferToBase64Url(iv.buffer),
  };
}

/**
 * Decrypt metadata
 */
export async function decryptMetadata(
  ciphertextB64: string,
  ivB64: string,
  metadataKey: CryptoKey
): Promise<{ filename: string; mimetype: string; size: number }> {
  const ciphertext = base64UrlToArrayBuffer(ciphertextB64);
  const iv = base64UrlToArrayBuffer(ivB64);

  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    metadataKey,
    ciphertext
  );

  const json = new TextDecoder().decode(plaintext);
  return JSON.parse(json);
}

/**
 * Full encryption workflow for a file
 */
export async function encryptFile(
  fileData: Uint8Array,
  filename: string,
  mimetype: string,
  kekWrapKey: CryptoKey,
  metadataKey: CryptoKey,
  onProgress?: (progress: number) => void
): Promise<{
  ciphertext: Uint8Array;
  wrappedDek: WrappedDEK;
  encryptedMetadata: EncryptedMetadata;
  baseNonceB64: string;
  chunkSize: number;
  originalSize: number;
}> {
  // Generate DEK
  const dek = await generateDEK();

  // Encrypt file data
  const { ciphertext, baseNonceB64, chunkSize } = await encryptFileChunked(
    fileData,
    dek,
    DEFAULT_CHUNK_SIZE,
    onProgress
  );

  // Wrap DEK
  const wrappedDek = await wrapDEK(dek, kekWrapKey);

  // Encrypt metadata
  const encryptedMetadata = await encryptMetadata(
    { filename, mimetype, size: fileData.length },
    metadataKey
  );

  return {
    ciphertext,
    wrappedDek,
    encryptedMetadata,
    baseNonceB64,
    chunkSize,
    originalSize: fileData.length,
  };
}

/**
 * Full decryption workflow for a file
 */
export async function decryptFile(
  ciphertext: Uint8Array,
  wrappedDekB64: string,
  wrapIvB64: string,
  baseNonceB64: string,
  chunkSize: number,
  originalSize: number,
  kekWrapKey: CryptoKey,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  // Unwrap DEK
  const dek = await unwrapDEK(wrappedDekB64, wrapIvB64, kekWrapKey);

  // Decrypt file data
  return decryptFileChunked(
    ciphertext,
    dek,
    baseNonceB64,
    chunkSize,
    originalSize,
    onProgress
  );
}
