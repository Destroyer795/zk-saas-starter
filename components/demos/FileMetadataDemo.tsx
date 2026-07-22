"use client";

import React, { useState, useEffect } from "react";
import { HardDrive, Plus, Eye, EyeOff, Trash2, File, Database, Tag } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";
import { EncryptedResult } from "@/lib/crypto/encryption";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface FileMetadataPlaintext {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  storagePointer: string;
  tags: string[];
  uploadedAt: string;
}

interface VaultRow {
  id: string;
  type: string;
  encrypted_payload: string;
  iv: string;
  created_at: string;
}

interface FileMetadataDemoProps {
  encryptData: (payload: Record<string, unknown> | string) => Promise<EncryptedResult>;
  decryptData: <T = unknown>(ciphertext: string, iv: string) => Promise<T>;
  onEncryptStart: () => void;
  onEncryptEnd: () => void;
}

export function FileMetadataDemo({
  encryptData,
  decryptData,
  onEncryptStart,
  onEncryptEnd,
}: FileMetadataDemoProps) {
  const { showToast } = useToast();

  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("1048576"); // 1MB default
  const [mimeType, setMimeType] = useState("application/pdf");
  const [storagePointer, setStoragePointer] = useState("ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco");
  const [tags, setTags] = useState("Confidential, Tax, 2025");

  const [vaultItems, setVaultItems] = useState<VaultRow[]>([]);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, FileMetadataPlaintext>>({});
  const [revealedItems, setRevealedItems] = useState<Record<string, boolean>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Delete target state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      const res = await fetch("/api/vault?type=file_metadata");
      const json = await res.json();
      if (json.success) {
        setVaultItems(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch file metadata items:", err);
      showToast("Failed to fetch file metadata from database.", "error", "Database Error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    fetch("/api/vault?type=file_metadata")
      .then((res) => res.json())
      .then((json) => {
        if (isSubscribed) {
          if (json.success) setVaultItems(json.data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch file metadata items:", err);
        if (isSubscribed) setIsLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleSaveFileIndex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !fileSize || !mimeType) return;

    setIsSaving(true);
    onEncryptStart();

    try {
      const plaintextPayload: FileMetadataPlaintext = {
        fileName,
        fileSizeBytes: parseInt(fileSize, 10) || 0,
        mimeType,
        storagePointer,
        tags: tags.split(",").map((t) => t.trim()),
        uploadedAt: new Date().toISOString(),
      };

      // Encrypt locally
      const encrypted = await encryptData(plaintextPayload as unknown as Record<string, unknown>);

      // Post encrypted payload to dumb API
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "file_metadata",
          encrypted_payload: encrypted.ciphertext,
          iv: encrypted.iv,
        }),
      });

      if (!res.ok) throw new Error("Failed to save file metadata");

      setFileName("");

      showToast("File metadata encrypted locally and added to index!", "success", "Metadata Encrypted");

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
        const decrypted = await decryptData<FileMetadataPlaintext>(ciphertext, iv);
        setDecryptedCache((prev) => ({ ...prev, [itemId]: decrypted }));
      }
      setRevealedItems((prev) => ({ ...prev, [itemId]: true }));
      showToast("File metadata decrypted in local browser memory.", "info", "Decrypted");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Decryption failed";
      showToast(msg, "error", "Decryption Error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);

    try {
      await fetch(`/api/vault?id=${id}`, { method: "DELETE" });
      showToast("File metadata index entry deleted.", "info", "Deleted");
      await loadItems();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete file metadata index.", "error", "Delete Error");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="neo-box p-4 bg-[#A8FF35] flex items-start justify-between gap-4 text-black">
        <div>
          <h3 className="text-lg font-black uppercase text-black flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-black" /> Demo 3: Secret File Metadata Index
          </h3>
          <p className="text-xs font-mono text-black font-bold mt-1">
            Simulate a zero-knowledge cloud drive index. File names, MIME types, sizes, tags, and blob storage pointers are encrypted client-side so host storage providers learn 0 file metadata.
          </p>
        </div>
        <span className="neo-badge neo-badge-yellow shrink-0">Storage Index</span>
      </div>

      {/* Form */}
      <div className="neo-box p-5 bg-white space-y-4">
        <h4 className="font-black text-sm uppercase border-b-2 border-black pb-2 text-black">
          Add Encrypted File Metadata
        </h4>

        <form onSubmit={handleSaveFileIndex} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-mono font-bold uppercase text-black">File Name</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. corporate_strategy_2026.pdf"
                required
                className="neo-input"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono font-bold uppercase text-black">File Size (Bytes)</label>
              <input
                type="number"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                placeholder="1048576"
                required
                className="neo-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-mono font-bold uppercase text-black">MIME Type</label>
              <select
                value={mimeType}
                onChange={(e) => setMimeType(e.target.value)}
                className="neo-input font-mono font-bold"
              >
                <option value="application/pdf">application/pdf</option>
                <option value="image/png">image/png</option>
                <option value="video/mp4">video/mp4</option>
                <option value="application/zip">application/zip</option>
                <option value="application/json">application/json</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono font-bold uppercase text-black">Storage Pointer / CID</label>
              <input
                type="text"
                value={storagePointer}
                onChange={(e) => setStoragePointer(e.target.value)}
                placeholder="e.g. ipfs://QmXoypizj..."
                className="neo-input font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold uppercase text-black">Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. Confidential, Board, 2026"
              className="neo-input font-mono text-xs"
            />
          </div>

          <div className="flex justify-end">
            <NeoButton type="submit" disabled={isSaving || !fileName} variant="accent">
              <Plus className="w-4 h-4 text-black" />
              {isSaving ? "Encrypting Metadata..." : "Encrypt & Store File Index"}
            </NeoButton>
          </div>
        </form>
      </div>

      {/* Index List */}
      <div className="space-y-4">
        <h4 className="font-black text-sm uppercase flex items-center justify-between text-black">
          <span>Encrypted File Storage Index ({vaultItems.length})</span>
          {isLoading && <span className="text-xs font-mono animate-pulse text-black">Loading database...</span>}
        </h4>

        {vaultItems.length === 0 ? (
          <div className="neo-box p-6 bg-[#FFFDF5] text-center font-mono text-xs text-gray-700 font-bold">
            No file metadata entries stored yet. Create your first index entry above.
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
                      <span className="neo-badge neo-badge-cyan">FILE INDEX</span>
                      <h5 className="font-black text-base flex items-center gap-1.5 text-black">
                        <File className="w-4 h-4 text-black" />
                        {isRevealed && decrypted ? decrypted.fileName : `Encrypted File (${item.id.substring(0, 8)})`}
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
                        {isRevealed ? "Hide Metadata" : "Decrypt Metadata"}
                      </NeoButton>
                      <button
                        onClick={() => setDeleteTargetId(item.id)}
                        className="p-1.5 border-2 border-black bg-red-400 hover:bg-red-500 font-bold cursor-pointer"
                        title="Delete index entry"
                      >
                        <Trash2 className="w-4 h-4 text-black" />
                      </button>
                    </div>
                  </div>

                  {isRevealed && decrypted ? (
                    <div className="p-3 bg-[#FFFDF5] border-2 border-black font-mono text-xs space-y-2 text-black">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-bold text-gray-700">File Size:</span> {formatBytes(decrypted.fileSizeBytes)}
                        </div>
                        <div>
                          <span className="font-bold text-gray-700">MIME Type:</span> {decrypted.mimeType}
                        </div>
                      </div>

                      <div className="pt-1 border-t border-black flex items-center gap-1">
                        <Database className="w-3.5 h-3.5 text-gray-700" />
                        <span className="font-bold text-gray-700">Storage Pointer:</span>
                        <code className="bg-gray-200 px-1 py-0.5 border border-black font-mono text-[11px] truncate text-black font-bold">
                          {decrypted.storagePointer}
                        </code>
                      </div>

                      {decrypted.tags && decrypted.tags.length > 0 && (
                        <div className="flex items-center gap-1 pt-1">
                          <Tag className="w-3.5 h-3.5 text-gray-700" />
                          <span className="font-bold text-gray-700">Tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {decrypted.tags.map((t, idx) => (
                              <span key={idx} className="neo-badge neo-badge-yellow text-[10px] text-black">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-900 border-2 border-black font-mono text-[11px] text-cyan-300 space-y-1">
                      <div className="text-gray-300 font-bold flex justify-between">
                        <span>🔒 Encrypted File Index Blob:</span>
                        <span>IV: {item.iv}</span>
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Delete File Index Entry"
        message="Are you sure you want to delete this encrypted file metadata index from your vault?"
        confirmLabel="Delete Metadata"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
