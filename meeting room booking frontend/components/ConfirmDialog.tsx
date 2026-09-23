"use client";

import { AlertTriangle } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  alertOnly?: boolean; // true = OK button တစ်ခုတည်း (alert() အစား)
  onConfirm: () => void;
  onCancel?: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  alertOnly = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle
            className={`h-5 w-5 ${danger ? "text-rose-400" : "text-amber-400"}`}
          />
          <h2 className="text-sm font-bold text-white">{title}</h2>
        </div>

        <p className="mb-5 text-[13px] text-slate-400">{message}</p>

        <div className="flex justify-end gap-2">
          {!alertOnly && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition ${
              danger
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {alertOnly ? "OK" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}