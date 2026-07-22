import { base64ToBuffer } from "./utils";

/**
 * AES-256-GCM Payload Decryption Module (Client-Side ONLY)
 */

/**
 * Decrypts a Base64-encoded AES-256-GCM ciphertext payload.
 * 
 * @param ciphertext Base64 ciphertext string.
 * @param iv Base64 Initialization Vector string.
 * @param masterKey Derived CryptoKey (AES-GCM).
 * @returns Decrypted object of type T or raw string.
 */
export async function decryptPayload<T = unknown>(
  ciphertext: string,
  iv: string,
  masterKey: CryptoKey
): Promise<T> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API is only accessible in client-side environment.");
  }

  const ciphertextBuffer = base64ToBuffer(ciphertext);
  const ivBuffer = base64ToBuffer(iv);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer,
      },
      masterKey,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);

    try {
      return JSON.parse(jsonString) as T;
    } catch {
      return jsonString as unknown as T;
    }
  } catch {
    throw new Error(
      "Decryption failed. Invalid master key, corrupted payload, or tampered Initialization Vector."
    );
  }
}
