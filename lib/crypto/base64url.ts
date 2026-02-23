/**
 * Base64URL encoding/decoding utilities for E2E encryption
 * Uses URL-safe base64 encoding (no padding, - instead of +, _ instead of /)
 */

export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  // Add padding back
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  if (padding > 0) {
    base64 += "=".repeat(4 - padding);
  }
  
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function uint8ArrayToBase64Url(array: Uint8Array): string {
  return arrayBufferToBase64Url(array.buffer as ArrayBuffer);
}

export function base64UrlToUint8Array(base64url: string): Uint8Array {
  return new Uint8Array(base64UrlToArrayBuffer(base64url));
}
