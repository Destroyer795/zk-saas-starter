"use client";

import React, { useState } from "react";
import { KeyRound, ShieldAlert, Cpu, Lock, RefreshCw } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";
import { generateSalt } from "@/lib/crypto/utils";

interface MasterPasswordModalProps {
  onUnlock: (password: string, salt: string) => Promise<string>;
  isProcessing: boolean;
  error?: string | null;
}

const SALT_STORAGE_KEY = "zk_vault_salt";

export function MasterPasswordModal({
  onUnlock,
  isProcessing,
  error,
}: MasterPasswordModalProps) {
  const [password, setPassword] = useState("");

  // Lazy state initialization reads localStorage synchronously on mount without calling setState in useEffect
  const [salt, setSalt] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const storedSalt = localStorage.getItem(SALT_STORAGE_KEY);
    if (storedSalt) return storedSalt;
    const freshSalt = generateSalt();
    localStorage.setItem(SALT_STORAGE_KEY, freshSalt);
    return freshSalt;
  });

  const [showSaltInput, setShowSaltInput] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    try {
      await onUnlock(password, salt);
    } catch {
      // Error state handled by parent hook
    }
  };

  const handleRegenerateSalt = () => {
    const newSalt = generateSalt();
    setSalt(newSalt);
    if (typeof window !== "undefined") {
      localStorage.setItem(SALT_STORAGE_KEY, newSalt);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="neo-box w-full max-w-lg bg-[#FFFDF5] p-6 space-y-6 relative">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b-3 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFE600] border-2 border-black flex items-center justify-center font-black">
              <Lock className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                Unlock Vault
              </h2>
              <p className="text-xs font-mono text-gray-700">
                Zero-Knowledge Master Password Setup
              </p>
            </div>
          </div>
          <span className="neo-badge neo-badge-pink">Client-Side Key</span>
        </div>

        {/* Warning Banner */}
        <div className="neo-box p-3 bg-[#FF6B6B] text-black flex items-start gap-3 text-xs font-mono">
          <ShieldAlert className="w-5 h-5 shrink-0 text-black mt-0.5" />
          <div>
            <strong className="block font-black text-sm uppercase text-black">
              Zero-Knowledge Guarantee
            </strong>
            <span className="text-black font-bold">
              Your master password never leaves this browser window. PBKDF2 SHA-256 derives your 256-bit AES key locally.
            </span>
          </div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-mono font-bold uppercase text-black">
              Master Password <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password"
                required
                className="neo-input pr-10"
                disabled={isProcessing}
                autoFocus
              />
              <KeyRound className="w-4 h-4 text-black absolute right-3 top-3.5" />
            </div>
            <p className="text-[11px] font-mono text-gray-600">
              Min 100,000 PBKDF2 iterations executed natively in Web Crypto.
            </p>
          </div>

          {/* Key Salt Configuration */}
          <div className="space-y-2 pt-2 border-t-2 border-dashed border-black">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSaltInput(!showSaltInput)}
                className="text-xs font-mono font-bold text-black underline cursor-pointer hover:text-blue-900"
              >
                {showSaltInput ? "▼ Hide Key Salt Configuration" : "► Advanced: Key Salt"}
              </button>
              {showSaltInput && (
                <button
                  type="button"
                  onClick={handleRegenerateSalt}
                  className="text-xs font-mono font-bold text-black flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-black" /> Reset Salt
                </button>
              )}
            </div>

            {showSaltInput && (
              <div className="space-y-1">
                <input
                  type="text"
                  value={salt}
                  onChange={(e) => {
                    setSalt(e.target.value);
                    if (typeof window !== "undefined") {
                      localStorage.setItem(SALT_STORAGE_KEY, e.target.value);
                    }
                  }}
                  className="neo-input text-xs font-mono text-black"
                  placeholder="PBKDF2 Salt (Base64)"
                  disabled={isProcessing}
                />
                <p className="text-[10px] font-mono text-gray-700 font-bold">
                  Persistent local salt used to derive your AES master key. Keeping the same salt ensures your master password derives the matching key across sessions.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-100 border-2 border-black font-mono text-xs font-bold text-red-900">
              ⚠️ {error}
            </div>
          )}

          <div className="pt-2">
            <NeoButton
              type="submit"
              disabled={isProcessing || !password}
              className="w-full text-base py-3"
            >
              {isProcessing ? (
                <>
                  <Cpu className="w-5 h-5 animate-spin text-black" />
                  Deriving Key (100,000 iterations)...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-black" />
                  Unlock Zero-Knowledge Vault
                </>
              )}
            </NeoButton>
          </div>
        </form>

        <div className="text-center font-mono text-[11px] text-gray-700 font-bold pt-2 border-t-2 border-black">
          🔒 No raw password or master key is stored in database, cookies, or server logs.
        </div>
      </div>
    </div>
  );
}
