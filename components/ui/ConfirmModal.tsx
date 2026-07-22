"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="neo-box w-full max-w-md bg-[#FFFDF5] p-6 space-y-4 font-sans relative">
        <div className="flex items-center gap-3 border-b-3 border-black pb-3">
          <div className="w-9 h-9 bg-[#FF6B6B] border-2 border-black flex items-center justify-center font-black">
            <AlertTriangle className="w-5 h-5 text-black" />
          </div>
          <h3 className="text-lg font-black uppercase text-black">{title}</h3>
        </div>

        <p className="text-xs font-mono text-gray-800 leading-relaxed font-bold">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 font-mono font-bold text-xs cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            {cancelLabel}
          </button>
          <NeoButton
            type="button"
            variant="danger"
            onClick={onConfirm}
            className="text-xs px-4 py-2"
          >
            {confirmLabel}
          </NeoButton>
        </div>
      </div>
    </div>
  );
}
