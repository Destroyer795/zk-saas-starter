"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info", title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast / Snackbar Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = "bg-white";
          let Icon = Info;

          if (toast.type === "success") {
            bgClass = "bg-[#A8FF35]";
            Icon = CheckCircle2;
          } else if (toast.type === "error") {
            bgClass = "bg-[#FF6B6B]";
            Icon = AlertTriangle;
          } else if (toast.type === "info") {
            bgClass = "bg-[#FFE600]";
            Icon = Info;
          }

          return (
            <div
              key={toast.id}
              className={`neo-box p-4 ${bgClass} text-black font-sans pointer-events-auto flex items-start justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-black shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  {toast.title && (
                    <h5 className="font-black text-sm uppercase font-sans tracking-tight text-black">
                      {toast.title}
                    </h5>
                  )}
                  <p className="text-xs font-mono text-black leading-snug font-bold">
                    {toast.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 border-2 border-black bg-white hover:bg-gray-100 font-bold shrink-0 cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
