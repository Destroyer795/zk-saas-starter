import { bufferToBase64, generateSecureRandomBytes } from "./utils";

/**
 * AES-256-GCM Payload Encryption Module (Client-Side ONLY)
 */

export interface EncryptedResult {
  ciphertext: string; // Base64 encoded string of encrypted payload
  iv: string;         // Base64 encoded Initialization Vector (12 bytes)
}

/**
 * Encrypts a JSON payload or string payload using AES-256-GCM.
 * 
 * @param payload Raw string or object payload to encrypt locally.
 * @param masterKey Derived CryptoKey (AES-GCM).
 * @returns Object containing Base64 ciphertext and IV.
 */
export async function encryptPayload(
  payload: Record<string, unknown> | string,
  masterKey: CryptoKey
): Promise<EncryptedResult> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API is only accessible in client-side environment.");
  }

  // Serialize payload to JSON string if object
  const serialized = typeof payload === "string" ? payload : JSON.stringify(payload);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(serialized);

  // Generate a fresh random 12-byte (96-bit) Initialization Vector (IV) for AES-GCM
  const ivBytes = generateSecureRandomBytes(12);

  // Perform AES-GCM encryption
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ivBytes.buffer as ArrayBuffer,
    },
    masterKey,
    dataBuffer.buffer as ArrayBuffer
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(ivBytes),
  };
}
