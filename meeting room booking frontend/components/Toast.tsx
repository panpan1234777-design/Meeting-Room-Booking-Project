"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type ToastProps = {
  message: string | null;
  type?: "success" | "error";
  onClose: () => void;
  duration?: number; // ms
};

export default function Toast({
  message,
  type = "success",
  onClose,
  duration = 2500,
}: ToastProps) {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <div className="fixed top-5 left-1/2 z-[100] -translate-x-1/2 animate-in fade-in slide-in-from-top-2">
      <div
        className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-sm ${
          isSuccess
            ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-300"
            : "border-rose-500/30 bg-rose-950/90 text-rose-300"
        }`}
      >
        <Icon className="h-4.5 w-4.5 shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}