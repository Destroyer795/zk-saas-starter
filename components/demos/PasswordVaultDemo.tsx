"use client";

import React, { useState, useEffect } from "react";
import { Key, Plus, Eye, EyeOff, Copy, RefreshCw, Check, Trash2, Globe, User } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";
import { EncryptedResult } from "@/lib/crypto/encryption";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface PasswordVaultPlaintext {
  serviceUrl: string;
  username: string;
  password: string;
  notes?: string;
  category: string;
}

interface VaultRow {
  id: string;
  type: string;
  encrypted_payload: string;
  iv: string;
  created_at: string;
}

interface PasswordVaultDemoProps {
  encryptData: (payload: Record<string, unknown> | string) => Promise<EncryptedResult>;
  decryptData: <T = unknown>(ciphertext: string, iv: string) => Promise<T>;
  onEncryptStart: () => void;
  onEncryptEnd: () => void;
}

export function PasswordVaultDemo({
  encryptData,
  decryptData,
  onEncryptStart,
  onEncryptEnd,
}: PasswordVaultDemoProps) {
  const { showToast } = useToast();

  const [serviceUrl, setServiceUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");

  const [vaultItems, setVaultItems] = useState<VaultRow[]>([]);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, PasswordVaultPlaintext>>({});
  const [revealedItems, setRevealedItems] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Deletion target state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      const res = await fetch("/api/vault?type=password");
      const json = await res.json();
      if (json.success) {
        setVaultItems(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch password vault items:", err);
      showToast("Failed to fetch credentials from database.", "error", "Database Error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    fetch("/api/vault?type=password")
      .then((res) => res.json())
      .then((json) => {
        if (isSubscribed) {
          if (json.success) setVaultItems(json.data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch password items:", err);
        if (isSubscribed) setIsLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    const array = new Uint8Array(20);
    window.crypto.getRandomValues(array);
    let pwd = "";
    for (let i = 0; i < array.length; i++) {
      pwd += chars[array[i] % chars.length];
    }
    setPassword(pwd);
    showToast("Generated high-entropy 20-character password.", "info", "Password Generated");
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceUrl || !username || !password) return;

    setIsSaving(true);
    onEncryptStart();

    try {
      const plaintextPayload: PasswordVaultPlaintext = {
        serviceUrl,
        username,
        password,
        notes,
        category: "Logins",
      };

      // 1. Encrypt locally in browser memory
      const encrypted = await encryptData(plaintextPayload as unknown as Record<string, unknown>);

      // 2. Save encrypted payload to API
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "password",
          encrypted_payload: encrypted.ciphertext,
          iv: encrypted.iv,
        }),
      });

      if (!res.ok) throw new Error("Failed to save password item");

      setServiceUrl("");
      setUsername("");
      setPassword("");
      setNotes("");

      showToast("Credential encrypted with AES-256-GCM and saved to vault!", "success", "Credential Saved");

      await loadItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      showToast(msg, "error", "Save Failed");
    } finally {
      setIsSaving(false);
      onEncryptEnd();
    }
  };

  const toggleDecrypt = async (itemId: string, ciphertext: string, iv: string) => {
    if (revealedItems[itemId]) {
      setRevealedItems((prev) => ({ ...prev, [itemId]: false }));
      return;
    }

    try {
      if (!decryptedCache[itemId]) {
        const decrypted = await decryptData<PasswordVaultPlaintext>(ciphertext, iv);
        setDecryptedCache((prev) => ({ ...prev, [itemId]: decrypted }));
      }
      setRevealedItems((prev) => ({ ...prev, [itemId]: true }));
      showToast("Credential decrypted in local browser memory.", "info", "Decrypted");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Decryption failed";
      showToast(msg, "error", "Decryption Error");
    }
  };

  const copyToClipboard = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`${label} copied to clipboard!`, "success", "Copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);

    try {
      await fetch(`/api/vault?id=${id}`, { method: "DELETE" });
      showToast("Credential entry deleted from vault.", "info", "Deleted");
      await loadItems();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete credential.", "error", "Delete Error");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Info */}
      <div className="neo-box p-4 bg-[#FFE600] flex items-start justify-between gap-4 text-black">
        <div>
          <h3 className="text-lg font-black uppercase text-black flex items-center gap-2">
            <Key className="w-5 h-5 text-black" /> Demo 2: Password & Credentials Vault
          </h3>
          <p className="text-xs font-mono text-black font-bold mt-1">
            Store usernames, high-entropy generated passwords, and API credentials. Plaintext values are never stored in localStorage or database records.
          </p>
        </div>
        <span className="neo-badge neo-badge-pink shrink-0">Client Crypto</span>
      </div>

      {/* Form */}
      <div className="neo-box p-5 bg-white space-y-4">
        <h4 className="font-black text-sm uppercase border-b-2 border-black pb-2 text-black">
          Add Encrypted Credential
        </h4>

        <form onSubmit={handleSavePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-mono font-bold uppercase text-black">Service URL / Site</label>
              <div className="relative">
                <input
                  type="text"
                  value={serviceUrl}
                  onChange={(e) => setServiceUrl(e.target.value)}
                  placeholder="e.g. https://github.com or AWS Console"
                  required
                  className="neo-input pr-10"
                />
                <Globe className="w-4 h-4 text-gray-500 absolute right-3 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono font-bold uppercase text-black">Username / Email</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. dev@company.com"
                  required
                  className="neo-input pr-10"
                />
                <User className="w-4 h-4 text-gray-500 absolute right-3 top-3" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-mono font-bold uppercase text-black">Password</label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-xs font-mono text-blue-900 font-bold underline hover:text-black flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-blue-900" /> Generate High-Entropy Password
              </button>
            </div>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter or generate secure password"
              required
              className="neo-input font-mono"
            />
          </div>

          <div className="flex justify-end">
            <NeoButton type="submit" disabled={isSaving || !serviceUrl || !username || !password}>
              <Plus className="w-4 h-4 text-black" />
              {isSaving ? "Encrypting..." : "Encrypt & Save Credential"}
            </NeoButton>
          </div>
        </form>
      </div>

      {/* Password Vault List */}
      <div className="space-y-4">
        <h4 className="font-black text-sm uppercase flex items-center justify-between text-black">
          <span>Encrypted Credentials ({vaultItems.length})</span>
          {isLoading && <span className="text-xs font-mono animate-pulse text-black">Loading database...</span>}
        </h4>

        {vaultItems.length === 0 ? (
          <div className="neo-box p-6 bg-[#FFFDF5] text-center font-mono text-xs text-gray-700 font-bold">
            No credentials saved in vault yet. Add one above.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {vaultItems.map((item) => {
              const isRevealed = revealedItems[item.id];
              const decrypted = decryptedCache[item.id];

              return (
                <div key={item.id} className="neo-box p-4 bg-white space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <div className="flex items-center gap-2">
                      <span className="neo-badge neo-badge-yellow">LOGIN</span>
                      <h5 className="font-black text-base text-black">
                        {isRevealed && decrypted ? decrypted.serviceUrl : `Encrypted Credential (${item.id.substring(0, 8)})`}
                      </h5>
                    </div>

                    <div className="flex items-center gap-2">
                      <NeoButton
                        type="button"
                        onClick={() => toggleDecrypt(item.id, item.encrypted_payload, item.iv)}
                        variant={isRevealed ? "secondary" : "accent"}
                        className="text-xs px-3 py-1"
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-black" /> : <Eye className="w-3.5 h-3.5 text-black" />}
                        {isRevealed ? "Hide Password" : "Decrypt Credential"}
                      </NeoButton>
                      <button
                        onClick={() => setDeleteTargetId(item.id)}
                        className="p-1.5 border-2 border-black bg-red-400 hover:bg-red-500 font-bold cursor-pointer"
                        title="Delete credential"
                      >
                        <Trash2 className="w-4 h-4 text-black" />
                      </button>
                    </div>
                  </div>

                  {isRevealed && decrypted ? (
                    <div className="p-3 bg-[#FFFDF5] border-2 border-black font-mono text-xs space-y-2 text-black">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-700 font-bold">Username:</span> {decrypted.username}
                        </div>
                        <button
                          onClick={() => copyToClipboard(decrypted.username, `user-${item.id}`, "Username")}
                          className="neo-badge neo-badge-cyan cursor-pointer text-black"
                        >
                          {copiedId === `user-${item.id}` ? <Check className="w-3 h-3 text-green-900" /> : <Copy className="w-3 h-3 text-black" />}
                          Copy Username
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-black">
                        <div>
                          <span className="text-gray-700 font-bold">Password:</span>{" "}
                          <span className="font-bold text-red-900 bg-yellow-300 px-1 border border-black">{decrypted.password}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(decrypted.password, `pwd-${item.id}`, "Password")}
                          className="neo-badge neo-badge-green cursor-pointer text-black"
                        >
                          {copiedId === `pwd-${item.id}` ? <Check className="w-3 h-3 text-green-900" /> : <Copy className="w-3 h-3 text-black" />}
                          Copy Password
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-900 border-2 border-black font-mono text-[11px] text-yellow-300 space-y-1">
                      <div className="text-gray-300 font-bold flex justify-between">
                        <span>🔒 AES-256-GCM Encrypted Blob:</span>
                        <span className="text-gray-400">IV: {item.iv}</span>
                      </div>
                      <div className="truncate text-green-400">{item.encrypted_payload}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Delete Credential"
        message="Are you sure you want to delete this encrypted credential entry from your vault?"
        confirmLabel="Delete Credential"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
