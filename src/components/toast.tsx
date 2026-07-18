"use client";

import { createContext, useContext, useCallback, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback(
    (id: number) => setToasts((t) => t.filter((x) => x.id !== id)),
    []
  );

  const toast = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, kind }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            role="alert"
          >
            {t.kind === "success" && (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            )}
            {t.kind === "error" && (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
            )}
            {t.kind === "info" && (
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
            )}
            <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">
              {t.message}
            </p>
            <button
              onClick={() => remove(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
