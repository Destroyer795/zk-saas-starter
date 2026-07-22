/**
 * Core Cryptographic Helper Utilities
 * Client-side utilities converting ArrayBuffers, TypedArrays, Base64 strings, and generating CSRNG values.
 * Uses Web Crypto API (window.crypto).
 */

/**
 * Converts an ArrayBuffer or Uint8Array to a Base64 string for JSON transport over network APIs.
 */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string back into an ArrayBuffer for Web Crypto API operations.
 */
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

/**
 * Generates cryptographically secure random bytes using Web Crypto.
 */
export function generateSecureRandomBytes(length: number): Uint8Array {
  if (typeof window === "undefined" || !window.crypto) {
    throw new Error("Web Crypto API is only available in client browser environment.");
  }
  const bytes = new Uint8Array(length);
  window.crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Utility to generate a 16-byte random salt for PBKDF2.
 */
export function generateSalt(): string {
  const saltBytes = generateSecureRandomBytes(16);
  return bufferToBase64(saltBytes);
}

/**
 * Computes SHA-256 hash of a string (useful for privacy-preserving email indexing).
 */
export function hashSHA256(input: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API is only available in client browser environment.");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  return window.crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer).then((hashBuffer) => bufferToBase64(hashBuffer));
}
