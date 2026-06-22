"use client";

// App-wide replacement for the browser's blocking window.alert / window.confirm.
// Exposes async confirm()/alert() via useDialog(); both resolve when the user
// acts on a styled modal that matches the rest of the UI. Mounted once in the
// root layout so any client component can call it.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

type Tone = "default" | "danger";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
}

interface AlertOptions {
  title?: string;
  message: string;
  tone?: Tone;
}

interface DialogContextValue {
  confirm: (opts: ConfirmOptions | string) => Promise<boolean>;
  alert: (opts: AlertOptions | string) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

interface DialogState {
  kind: "confirm" | "alert";
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: Tone;
  resolve: (value: boolean) => void;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [mounted, setMounted] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Focus the primary action and wire up Escape (cancel) / Enter (confirm).
  useEffect(() => {
    if (!dialog) return;
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(dialog.kind === "alert");
      else if (e.key === "Enter") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog]);

  const close = useCallback(
    (result: boolean) => {
      setDialog((d) => {
        d?.resolve(result);
        return null;
      });
    },
    []
  );

  const confirm = useCallback(
    (opts: ConfirmOptions | string) =>
      new Promise<boolean>((resolve) => {
        const o = typeof opts === "string" ? { message: opts } : opts;
        setDialog({
          kind: "confirm",
          title: o.title ?? "Please confirm",
          message: o.message,
          confirmLabel: o.confirmLabel ?? "Confirm",
          cancelLabel: o.cancelLabel ?? "Cancel",
          tone: o.tone ?? "default",
          resolve,
        });
      }),
    []
  );

  const alert = useCallback(
    (opts: AlertOptions | string) =>
      new Promise<void>((resolve) => {
        const o = typeof opts === "string" ? { message: opts } : opts;
        setDialog({
          kind: "alert",
          title: o.title ?? "Notice",
          message: o.message,
          confirmLabel: "OK",
          cancelLabel: "",
          tone: o.tone ?? "default",
          resolve: () => resolve(),
        });
      }),
    []
  );

  const isDanger = dialog?.tone === "danger";
  const iconWrapCls = isDanger
    ? "bg-red-100 text-red-600"
    : "bg-indigo-100 text-indigo-600";
  const icon = isDanger
    ? "warning"
    : dialog?.kind === "confirm"
      ? "help"
      : "info";

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {mounted &&
        dialog &&
        createPortal(
          <div
            className="payroll-scope fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
            onClick={() => close(dialog.kind === "alert")}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              className="animate-fade-in w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconWrapCls}`}
                >
                  <span className="material-symbols-rounded">{icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-slate-900">{dialog.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{dialog.message}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {dialog.kind === "confirm" && (
                  <Button variant="outline" onClick={() => close(false)}>
                    {dialog.cancelLabel}
                  </Button>
                )}
                <Button
                  ref={confirmBtnRef}
                  onClick={() => close(true)}
                  className={isDanger ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                >
                  {dialog.confirmLabel}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within a DialogProvider");
  return ctx;
}
