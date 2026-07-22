"use client";

import React, { useState, useSyncExternalStore } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  FileText,
  Key,
  HardDrive,
  Cpu,
  Info,
  Terminal,
} from "lucide-react";

import { useCrypto } from "@/hooks/useCrypto";
import { MasterPasswordModal } from "@/components/MasterPasswordModal";
import { NetworkStatus } from "@/components/ui/NetworkStatus";
import { NeoButton } from "@/components/ui/NeoButton";
import { ToastProvider } from "@/components/ui/Toast";

import { SecureNotesDemo } from "@/components/demos/SecureNotesDemo";
import { PasswordVaultDemo } from "@/components/demos/PasswordVaultDemo";
import { FileMetadataDemo } from "@/components/demos/FileMetadataDemo";

// Standard React 18/19 subscription helper to check client-side hydration without triggering set-state-in-effect
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<"notes" | "passwords" | "files" | "architecture">("notes");
  const [isEncryptingActive, setIsEncryptingActive] = useState(false);

  const {
    isUnlocked,
    cryptoError,
    isProcessing,
    unlockVault,
    lockVault,
    encryptData,
    decryptData,
  } = useCrypto();

  // If vault is locked or page was refreshed without key in volatile memory
  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-[#FFFDF5] p-4 flex flex-col justify-between">
        <header className="max-w-6xl mx-auto w-full flex items-center justify-between border-b-3 border-black pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FFE600] border-2 border-black flex items-center justify-center font-black text-black">
              ZK
            </div>
            <span className="font-black text-lg tracking-tight uppercase text-black">
              Zero-Knowledge SaaS Starter Kit
            </span>
          </div>
          <span className="neo-badge neo-badge-pink">Vault Locked</span>
        </header>

        <MasterPasswordModal
          onUnlock={unlockVault}
          isProcessing={isProcessing}
          error={cryptoError}
        />

        <footer className="max-w-6xl mx-auto w-full text-center font-mono text-xs text-gray-600 pt-6 border-t-2 border-black font-bold">
          Built with Next.js App Router, Native Web Crypto API & Prisma SQLite ORM.
        </footer>
      </main>
    );
  }

  // Main Unlocked Dashboard UI
  return (
    <div className="min-h-screen bg-[#FFFDF5] p-4 md:p-8 font-sans space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <header className="neo-box p-4 bg-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFE600] border-3 border-black flex items-center justify-center font-black text-lg text-black">
            ZK
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              Zero-Knowledge SaaS Starter Kit
            </h1>
            <p className="text-xs font-mono text-gray-700 font-bold">
              Commercial Developer Template - Client-Side AES-256-GCM + PBKDF2
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="neo-badge neo-badge-green flex items-center gap-1">
            <Unlock className="w-3.5 h-3.5 text-black" />
            Vault Unlocked
          </span>

          <NeoButton onClick={lockVault} variant="danger" className="text-xs px-3 py-1.5">
            <Lock className="w-3.5 h-3.5" />
            Lock Vault
          </NeoButton>
        </div>
      </header>

      {/* Network Status Indicator */}
      <NetworkStatus isEncrypting={isEncryptingActive} />

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 space-y-3">
          <div className="neo-box p-4 bg-white space-y-2">
            <h2 className="font-black text-xs uppercase text-gray-700 font-mono tracking-wider border-b-2 border-black pb-2">
              Interactive Demos
            </h2>

            <nav className="space-y-2 font-mono text-xs pt-1">
              <button
                onClick={() => setActiveTab("notes")}
                className={`w-full text-left p-3 border-2 border-black font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "notes"
                    ? "bg-[#4ECDC4] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px]"
                    : "bg-white hover:bg-gray-100 text-black"
                }`}
              >
                <FileText className="w-4 h-4 text-black" />
                1. Secure Notes
              </button>

              <button
                onClick={() => setActiveTab("passwords")}
                className={`w-full text-left p-3 border-2 border-black font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "passwords"
                    ? "bg-[#FFE600] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px]"
                    : "bg-white hover:bg-gray-100 text-black"
                }`}
              >
                <Key className="w-4 h-4 text-black" />
                2. Password Vault
              </button>

              <button
                onClick={() => setActiveTab("files")}
                className={`w-full text-left p-3 border-2 border-black font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "files"
                    ? "bg-[#A8FF35] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px]"
                    : "bg-white hover:bg-gray-100 text-black"
                }`}
              >
                <HardDrive className="w-4 h-4 text-black" />
                3. File Metadata Index
              </button>

              <button
                onClick={() => setActiveTab("architecture")}
                className={`w-full text-left p-3 border-2 border-black font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "architecture"
                    ? "bg-[#FF6B6B] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px]"
                    : "bg-white hover:bg-gray-100 text-black"
                }`}
              >
                <Terminal className="w-4 h-4 text-black" />
                Architecture & Proof
              </button>
            </nav>
          </div>

          {/* Security Guarantee Box */}
          <div className="neo-box p-4 bg-[#FFFDF5] text-xs font-mono space-y-2">
            <div className="font-bold flex items-center gap-1 text-black">
              <Info className="w-4 h-4 text-blue-700" /> Security Guarantee
            </div>
            <p className="text-gray-800 leading-relaxed font-bold">
              Open your browser&apos;s <strong>Network Tab</strong> (F12) to verify that only Base64 ciphertext payloads cross the network wire.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-3">
          {activeTab === "notes" && (
            <SecureNotesDemo
              encryptData={encryptData}
              decryptData={decryptData}
              onEncryptStart={() => setIsEncryptingActive(true)}
              onEncryptEnd={() => setIsEncryptingActive(false)}
            />
          )}

          {activeTab === "passwords" && (
            <PasswordVaultDemo
              encryptData={encryptData}
              decryptData={decryptData}
              onEncryptStart={() => setIsEncryptingActive(true)}
              onEncryptEnd={() => setIsEncryptingActive(false)}
            />
          )}

          {activeTab === "files" && (
            <FileMetadataDemo
              encryptData={encryptData}
              decryptData={decryptData}
              onEncryptStart={() => setIsEncryptingActive(true)}
              onEncryptEnd={() => setIsEncryptingActive(false)}
            />
          )}

          {activeTab === "architecture" && (
            <div className="neo-box p-6 bg-white space-y-6 font-mono text-xs">
              <div className="border-b-2 border-black pb-3">
                <h3 className="text-lg font-black uppercase font-sans text-black flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" /> Zero-Knowledge Cryptographic Flow
                </h3>
                <p className="text-gray-700 font-bold mt-1">
                  How client-side encryption protects user data from host servers, cloud providers, and database breaches.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 border-2 border-black space-y-2">
                  <h4 className="font-bold text-red-900 text-sm font-sans flex items-center gap-1">
                    ❌ Traditional SaaS (Server-Side Trust)
                  </h4>
                  <p className="text-gray-800 font-bold">
                    Traditional apps send raw JSON plaintext to server endpoints. If the database or server is breached, all user secrets are leaked in plaintext.
                  </p>
                  <pre className="bg-black text-red-400 p-2 overflow-x-auto rounded-none font-mono text-[10px]">
{`POST /api/vault
{
  "password": "SecretPassword123!",
  "credit_card": "4532-xxxx-xxxx"
}`}
                  </pre>
                </div>

                <div className="p-4 bg-green-50 border-2 border-black space-y-2">
                  <h4 className="font-bold text-green-950 text-sm font-sans flex items-center gap-1">
                    ✅ Zero-Knowledge Architecture (This Kit)
                  </h4>
                  <p className="text-gray-800 font-bold">
                    The browser derives an AES key using PBKDF2 (100k iterations) and encrypts the JSON locally. The server only receives opaque ciphertext.
                  </p>
                  <pre className="bg-black text-green-400 p-2 overflow-x-auto rounded-none font-mono text-[10px]">
{`POST /api/vault
{
  "encrypted_payload": "8f3a1b9c...",
  "iv": "4k2j9s1d..."
}`}
                  </pre>
                </div>
              </div>

              <div className="p-4 bg-[#FFE600] border-2 border-black space-y-2 text-black">
                <h4 className="font-bold text-sm font-sans text-black">🔑 Key Storage Policy</h4>
                <p className="font-bold text-black">
                  The master password and derived CryptoKey exist <strong>ONLY in volatile React memory</strong>. If the user locks the vault or closes the window, the master key is wiped from memory while your derivation salt remains securely stored locally.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#FFFDF5] flex items-center justify-center p-6 font-mono text-sm">
        <div className="neo-box p-6 bg-white flex items-center gap-3 font-bold text-black">
          <Cpu className="w-5 h-5 animate-spin text-black" /> Initializing Zero-Knowledge Client Engine...
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
