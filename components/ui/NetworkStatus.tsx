"use client";

import React from "react";
import { Lock, ShieldCheck, Cpu, Database } from "lucide-react";

interface NetworkStatusProps {
  isEncrypting: boolean;
  statusMessage?: string;
}

export function NetworkStatus({ isEncrypting, statusMessage }: NetworkStatusProps) {
  return (
    <div className="neo-box p-3 bg-[#FFE600] flex flex-wrap items-center justify-between gap-3 text-sm font-mono">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
              isEncrypting ? "bg-red-500" : "bg-green-500"
            } opacity-75`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-3 w-3 ${
              isEncrypting ? "bg-red-600" : "bg-black"
            }`}
          ></span>
        </span>

        {isEncrypting ? (
          <div className="flex items-center gap-2 font-bold text-black animate-pulse">
            <Cpu className="w-4 h-4 text-black animate-spin" />
            <span>Encrypting locally... (Web Crypto AES-256-GCM)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 font-bold text-black">
            <ShieldCheck className="w-4 h-4 text-black" />
            <span>Zero-Knowledge Engine: ACTIVE</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="neo-badge neo-badge-green flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Client-Side Only
        </span>
        <span className="neo-badge neo-badge-cyan flex items-center gap-1">
          <Database className="w-3 h-3" />
          {statusMessage || "Dumb Server Mode"}
        </span>
      </div>
    </div>
  );
}
