"use client";

import React, { useState, useEffect } from "react";
import { FileText, Plus, Lock, Eye, EyeOff, Trash2 } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";
import { EncryptedResult } from "@/lib/crypto/encryption";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface SecureNotePlaintext {
  title: string;
  content: string;
  category: string;
  updatedAt: string;
}

interface VaultRow {
  id: string;
  type: string;
  encrypted_payload: string;
  iv: string;
  created_at: string;
}

interface SecureNotesDemoProps {
  encryptData: (payload: Record<string, unknown> | string) => Promise<EncryptedResult>;
  decryptData: <T = unknown>(ciphertext: string, iv: string) => Promise<T>;
  onEncryptStart: () => void;
  onEncryptEnd: () => void;
}

export function SecureNotesDemo({
  encryptData,
  decryptData,
  onEncryptStart,
  onEncryptEnd,
}: SecureNotesDemoProps) {
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Personal");

  const [notes, setNotes] = useState<VaultRow[]>([]);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, SecureNotePlaintext>>({});
  const [revealedNotes, setRevealedNotes] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Deletion confirmation state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Helper function called by user action event handlers
  const loadNotes = async () => {
    try {
      const res = await fetch("/api/vault?type=note");
      const json = await res.json();
      if (json.success) {
        setNotes(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      showToast("Failed to connect to database.", "error", "Database Error");
    } finally {
      setIsLoading(false);
    }
  };

  // Async promise resolution avoids synchronous setState inside effect body
  useEffect(() => {
    let isSubscribed = true;
    fetch("/api/vault?type=note")
      .then((res) => res.json())
      .then((json) => {
        if (isSubscribed) {
          if (json.success) setNotes(json.data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch notes:", err);
        if (isSubscribed) setIsLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setIsSaving(true);
    onEncryptStart();

    try {
      const plaintextPayload: SecureNotePlaintext = {
        title,
        content,
        category,
        updatedAt: new Date().toISOString(),
      };

      // 1. Client-Side Encryption
      const encrypted = await encryptData(plaintextPayload as unknown as Record<string, unknown>);

      // 2. Post encrypted payload to dumb server API
      const response = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "note",
          encrypted_payload: encrypted.ciphertext,
          iv: encrypted.iv,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to save note");
      }

      setTitle("");
      setContent("");

      showToast(
        "Note encrypted locally with AES-256-GCM and stored safely in vault!",
        "success",
        "Encrypted & Stored"
      );

      await loadNotes();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error saving note";
      showToast(errMsg, "error", "Encryption Failed");
    } finally {
      setIsSaving(false);
      onEncryptEnd();
    }
  };

  const toggleDecrypt = async (noteId: string, ciphertext: string, iv: string) => {
    if (revealedNotes[noteId]) {
      setRevealedNotes((prev) => ({ ...prev, [noteId]: false }));
      return;
    }

    try {
      if (!decryptedCache[noteId]) {
        const decrypted = await decryptData<SecureNotePlaintext>(ciphertext, iv);
        setDecryptedCache((prev) => ({ ...prev, [noteId]: decrypted }));
      }
      setRevealedNotes((prev) => ({ ...prev, [noteId]: true }));
      showToast("Decrypted ciphertext in local browser memory.", "info", "Decrypted");
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
      showToast("Encrypted note removed from database.", "info", "Deleted");
      await loadNotes();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete note from vault.", "error", "Delete Error");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Demo Description */}
      <div className="neo-box p-4 bg-[#4ECDC4] flex items-start justify-between gap-4 text-black">
        <div>
          <h3 className="text-lg font-black uppercase text-black flex items-center gap-2">
            <FileText className="w-5 h-5 text-black" /> Demo 1: Zero-Knowledge Secure Notes
          </h3>
          <p className="text-xs font-mono text-black font-bold mt-1">
            Write confidential rich notes. Content is serialized to JSON and encrypted using AES-256-GCM in Web Crypto before any network request occurs.
          </p>
        </div>
        <span className="neo-badge neo-badge-yellow shrink-0">AES-256-GCM</span>
      </div>

      {/* Form */}
      <div className="neo-box p-5 bg-white space-y-4">
        <h4 className="font-black text-sm uppercase border-b-2 border-black pb-2 flex items-center justify-between text-black">
          <span>Create New Encrypted Note</span>
          <span className="text-xs font-mono text-gray-700 font-bold">Local Encryption</span>
        </h4>

        <form onSubmit={handleCreateNote} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-xs font-mono font-bold uppercase text-black">Note Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Financial Projections & API Keys"
                required
                className="neo-input"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-mono font-bold uppercase text-black">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="neo-input font-bold"
              >
                <option value="Personal">Personal</option>
                <option value="Work">Work</option>
                <option value="Financial">Financial</option>
                <option value="Secret Ops">Secret Ops</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono font-bold uppercase text-black">
              Note Body (Plaintext locally)
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type sensitive text here..."
              required
              className="neo-input font-mono text-xs"
            />
          </div>

          <div className="flex justify-end">
            <NeoButton type="submit" disabled={isSaving || !title || !content} variant="primary">
              <Plus className="w-4 h-4 text-black" />
              {isSaving ? "Encrypting & Saving..." : "Encrypt & Store Note"}
            </NeoButton>
          </div>
        </form>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        <h4 className="font-black text-sm uppercase flex items-center justify-between text-black">
          <span>Stored Encrypted Vault Rows ({notes.length})</span>
          {isLoading && <span className="text-xs font-mono animate-pulse text-black">Loading database...</span>}
        </h4>

        {notes.length === 0 ? (
          <div className="neo-box p-6 bg-[#FFFDF5] text-center font-mono text-xs text-gray-700 font-bold">
            No secure notes created yet. Use the form above to encrypt and save your first note.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {notes.map((note) => {
              const isRevealed = revealedNotes[note.id];
              const decrypted = decryptedCache[note.id];

              return (
                <div key={note.id} className="neo-box p-4 bg-white space-y-3">
                  <div className="flex items-start justify-between border-b-2 border-black pb-2 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="neo-badge neo-badge-cyan">{decrypted?.category || "Encrypted Category"}</span>
                        <h5 className="font-black text-base text-black">
                          {isRevealed && decrypted ? decrypted.title : `Encrypted Item (${note.id.substring(0, 8)}...)`}
                        </h5>
                      </div>
                      <span className="text-[10px] font-mono text-gray-700 font-bold">
                        Saved: {new Date(note.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <NeoButton
                        type="button"
                        onClick={() => toggleDecrypt(note.id, note.encrypted_payload, note.iv)}
                        variant={isRevealed ? "secondary" : "accent"}
                        className="text-xs px-3 py-1"
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-black" /> : <Eye className="w-3.5 h-3.5 text-black" />}
                        {isRevealed ? "Hide Plaintext" : "Decrypt Client-Side"}
                      </NeoButton>
                      <button
                        onClick={() => setDeleteTargetId(note.id)}
                        className="p-1.5 border-2 border-black bg-red-400 hover:bg-red-500 font-bold cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4 text-black" />
                      </button>
                    </div>
                  </div>

                  {/* Body display */}
                  {isRevealed && decrypted ? (
                    <div className="p-3 bg-[#FFFDF5] border-2 border-black font-mono text-xs text-black whitespace-pre-wrap">
                      <div className="flex items-center gap-1 font-bold text-green-800 mb-1">
                        <Lock className="w-3.5 h-3.5" /> Decrypted in Local Memory:
                      </div>
                      {decrypted.content}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-900 border-2 border-black font-mono text-[11px] text-green-400 space-y-1 overflow-x-auto">
                      <div className="text-gray-300 font-bold flex items-center justify-between">
                        <span>🔒 Raw Ciphertext (Stored in DB):</span>
                        <span className="text-[10px] text-amber-300">Server Zero-Knowledge</span>
                      </div>
                      <div className="break-all truncate">
                        <strong>Payload:</strong> {note.encrypted_payload}
                      </div>
                      <div className="text-gray-300">
                        <strong>IV:</strong> {note.iv}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Delete Encrypted Note"
        message="Are you sure you want to permanently delete this encrypted note from the database?"
        confirmLabel="Delete Note"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
