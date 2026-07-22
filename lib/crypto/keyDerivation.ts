import { base64ToBuffer } from "./utils";

/**
 * PBKDF2 Key Derivation Module (Client-side ONLY)
 * Derives a 256-bit AES-GCM CryptoKey from a user master password using PBKDF2 with SHA-256.
 */

export const PBKDF2_ITERATIONS = 100000; // 100,000 iterations per NIST recommendations

/**
 * Derives a 256-bit AES-GCM CryptoKey from a master password and salt using PBKDF2 (SHA-256).
 * 
 * @param password Raw master password string provided by user.
 * @param saltBase64 Base64 string representing unique salt.
 * @returns CryptoKey object extractable = false (stored strictly in volatile memory).
 */
export async function deriveMasterKey(
  password: string,
  saltBase64: string
): Promise<CryptoKey> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API is only accessible in client-side environment.");
  }

  if (!password || password.trim().length === 0) {
    throw new Error("Password cannot be empty for key derivation.");
  }

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = base64ToBuffer(saltBase64);

  // 1. Import raw password bytes into a base key for PBKDF2
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer.buffer as ArrayBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // 2. Derive 256-bit AES-GCM Key
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false, // extractable = false for zero-knowledge client security
    ["encrypt", "decrypt"]
  );

  return derivedKey;
}
