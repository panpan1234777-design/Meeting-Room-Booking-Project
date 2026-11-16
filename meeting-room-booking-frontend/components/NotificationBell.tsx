"use client";

import { useEffect, useRef, useState } from "react";

export type NotificationKind = "new" | "confirmed" | "rejected" | "cancelled";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  time: string; // ISO timestamp
}

const STORAGE_KEY = "dashboard_notif_last_seen";

const DOT: Record<NotificationKind, string> = {
  new: "bg-blue-500",
  confirmed: "bg-emerald-500",
  rejected: "bg-rose-500",
  cancelled: "bg-slate-500",
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function timeOf(n: NotificationItem) {
  return new Date(n.time).getTime();
}

export default function NotificationBell({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState(0);
  const [highlightFrom, setHighlightFrom] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load "last seen" from this browser
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEY));
      if (!Number.isNaN(saved)) setLastSeen(saved);
    } catch {}
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => timeOf(n) > lastSeen).length;

  const toggle = () => {
    if (!open) {
      // keep old "last seen" so new items stay highlighted while the panel is open
      setHighlightFrom(lastSeen);

      const newest = notifications.reduce(
        (max, n) => Math.max(max, timeOf(n) || 0),
        0
      );

      if (newest > lastSeen) {
        setLastSeen(newest);
        try {
          localStorage.setItem(STORAGE_KEY, String(newest));
        } catch {}
      }
    }
    setOpen(!open);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={toggle}
        className="relative rounded-xl border border-slate-800 bg-slate-900/70 p-2.5 text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-96 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40">
          <div className="border-b border-slate-800 px-4 py-3">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
          </div>

          <ul className="max-h-[420px] divide-y divide-slate-800/70 overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <li className="px-4 py-10 text-center text-xs text-slate-500">
                No notifications yet
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 ${
                    timeOf(n) > highlightFrom ? "bg-blue-500/5" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[n.kind]}`}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-5 text-slate-200">
                      {n.title}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {n.detail}
                    </p>
                  </div>

                  <span className="shrink-0 text-[10px] text-slate-600">
                    {timeAgo(n.time)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}