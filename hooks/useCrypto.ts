"use client";

import { useState, useCallback } from "react";
import { deriveMasterKey } from "@/lib/crypto/keyDerivation";
import { encryptPayload, EncryptedResult } from "@/lib/crypto/encryption";
import { decryptPayload } from "@/lib/crypto/decryption";
import { generateSalt } from "@/lib/crypto/utils";

export interface UseCryptoReturn {
  masterKey: CryptoKey | null;
  isUnlocked: boolean;
  activeSalt: string | null;
  cryptoError: string | null;
  isProcessing: boolean;
  unlockVault: (password: string, saltInput?: string) => Promise<string>;
  lockVault: () => void;
  encryptData: (payload: Record<string, unknown> | string) => Promise<EncryptedResult>;
  decryptData: <T = unknown>(ciphertext: string, iv: string) => Promise<T>;
}

const SALT_STORAGE_KEY = "zk_vault_salt";

/**
 * Custom React Hook for Zero-Knowledge Client Cryptography
 * Manages master key derivation, volatile in-memory storage, and persistent client key salt.
 */
export function useCrypto(): UseCryptoReturn {
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);

  // Lazy state initialization reads localStorage once synchronously on mount without calling setState inside an effect
  const [activeSalt, setActiveSalt] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const storedSalt = localStorage.getItem(SALT_STORAGE_KEY);
    if (storedSalt) return storedSalt;
    const freshSalt = generateSalt();
    localStorage.setItem(SALT_STORAGE_KEY, freshSalt);
    return freshSalt;
  });

  const [cryptoError, setCryptoError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const unlockVault = useCallback(
    async (password: string, saltInput?: string): Promise<string> => {
      setIsProcessing(true);
      setCryptoError(null);
      try {
        let saltToUse = saltInput && saltInput.trim() !== "" ? saltInput.trim() : null;

        if (!saltToUse) {
          const stored = typeof window !== "undefined" ? localStorage.getItem(SALT_STORAGE_KEY) : null;
          saltToUse = stored || generateSalt();
        }

        const derivedKey = await deriveMasterKey(password, saltToUse);

        // Store salt in localStorage for consistency across page refreshes
        if (typeof window !== "undefined") {
          localStorage.setItem(SALT_STORAGE_KEY, saltToUse);
        }

        setMasterKey(derivedKey);
        setActiveSalt(saltToUse);
        return saltToUse;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to derive master key.";
        setCryptoError(msg);
        throw new Error(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const lockVault = useCallback(() => {
    // Zero-out volatile key state in memory
    setMasterKey(null);
    setCryptoError(null);
  }, []);

  const encryptData = useCallback(
    async (payload: Record<string, unknown> | string): Promise<EncryptedResult> => {
      if (!masterKey) {
        throw new Error("Vault is locked. Unlock vault with master password before encrypting.");
      }
      return await encryptPayload(payload, masterKey);
    },
    [masterKey]
  );

  const decryptData = useCallback(
    async <T = unknown>(ciphertext: string, iv: string): Promise<T> => {
      if (!masterKey) {
        throw new Error("Vault is locked. Unlock vault with master password before decrypting.");
      }
      return await decryptPayload<T>(ciphertext, iv, masterKey);
    },
    [masterKey]
  );

  return {
    masterKey,
    isUnlocked: masterKey !== null,
    activeSalt,
    cryptoError,
    isProcessing,
    unlockVault,
    lockVault,
    encryptData,
    decryptData,
  };
}
