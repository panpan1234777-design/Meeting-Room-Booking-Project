"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  List,
  Loader2,
  XCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "../../../context/AuthContext";
import SearchBar from "@/components/SearchBar";
import Pagination from "@/components/Pagination";

/* -------------------- TYPES & CONSTANTS -------------------- */

type Status = "booked" | "cancelled" | "rejected";
type StatusTab = "all" | Status;
type DateRange = "today" | "week" | "month" | "all";

type Booking = {
  id: number;
  room: { name: string; location?: string };
  user: { name: string };
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: Status;
};

const PAGE_SIZE = 6; // change to 7 if you want 7 per page

const STATUS_TABS: StatusTab[] = ["all", "booked", "cancelled", "rejected"];
const DATE_RANGES: DateRange[] = ["today", "week", "month", "all"];

const DATE_LABELS: Record<DateRange, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All",
};

const STATUS_BADGE: Record<Status, string> = {
  booked: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  cancelled: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  rejected: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const TAB_ACTIVE_COLOR: Record<StatusTab, string> = {
  all: "text-indigo-400 border-b-2 border-indigo-400",
  booked: "text-blue-400 border-b-2 border-blue-400",
  cancelled: "text-slate-300 border-b-2 border-slate-300",
  rejected: "text-rose-400 border-b-2 border-rose-400",
};

const TAB_ICON: Record<StatusTab, typeof List> = {
  all: List,
  booked: Clock,
  cancelled: XCircle,
  rejected: XCircle,
};

/* -------------------- HELPERS -------------------- */

// Local-time "YYYY-MM-DD" (no UTC shift)
function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isWithinRange(dateStr: string, range: DateRange) {
  if (range === "all") return true;

  const date = String(dateStr).substring(0, 10);
  const now = new Date();
  const today = toDateString(now);

  if (range === "today") return date === today;

  if (range === "week") {
    // Monday - Sunday of the current week
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return date >= toDateString(monday) && date <= toDateString(sunday);
  }

  // month
  return date.substring(0, 7) === today.substring(0, 7);
}

function getInitials(name?: string) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

/* -------------------- PAGE -------------------- */

export default function AdminBookingsPage() {
  const { token } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [dateFilter, setDateFilter] = useState<DateRange>("today"); // default: today
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /* ---------- Fetch ---------- */

  const fetchBookings = async () => {
    setLoading(true);

    try {
      const res = await apiFetch("/bookings", { token });
      setBookings(res.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    }
  }, [token]);

  // Go back to page 1 whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, dateFilter, search]);

  /* ---------- Filtering ---------- */

  // Date + search first (tab counts are based on this list)
  const scopedBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return bookings
      .filter((b) => {
        if (!isWithinRange(b.booking_date, dateFilter)) return false;
        if (!keyword) return true;

        return (
          (b.user?.name ?? "").toLowerCase().includes(keyword) ||
          (b.room?.name ?? "").toLowerCase().includes(keyword) ||
          (b.purpose ?? "").toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => {
        // newest date first, earliest time first inside the same date
        const dateCompare = b.booking_date.localeCompare(a.booking_date);
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      });
  }, [bookings, search, dateFilter]);

 const counts = Object.fromEntries(
  STATUS_TABS.map((tab) => [
    tab,
    tab === "all"
      ? scopedBookings.length
      : scopedBookings.filter((b) => b.status === tab).length,
  ])
) as Record<StatusTab, number>;

  const filteredBookings = useMemo(
    () =>
      activeTab === "all"
        ? scopedBookings
        : scopedBookings.filter((b) => b.status === activeTab),
    [scopedBookings, activeTab]
  );

  /* ---------- Pagination ---------- */

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages); // e.g. after deleting last item of last page

  const pagedBookings = filteredBookings.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  /* ---------- Actions ---------- */

  const runAction = async (
    id: number,
    request: () => Promise<unknown>,
    onSuccess: () => void
  ) => {
    setActingId(id);

    try {
      await request();
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  const updateStatus = (id: number, status: Status) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
  };

  const handleReject = (id: number) =>
    runAction(
      id,
      () => apiFetch(`/bookings/${id}/reject`, { method: "POST", token }),
      () => updateStatus(id, "rejected")
    );

  const handleDelete = (id: number) => {
    if (!window.confirm("Delete this booking?")) return;

    runAction(
      id,
      () => apiFetch(`/bookings/${id}`, { method: "DELETE", token }),
      () => setBookings((prev) => prev.filter((b) => b.id !== id))
    );
  };

  /* ---------- Loading ---------- */

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="mb-2 h-6 w-6 animate-spin text-indigo-400" />
        <p className="text-sm text-slate-400">Loading bookings...</p>
      </div>
    );
  }

  /* ---------- UI ---------- */

  return (
    <div className="mx-auto min-h-screen max-w-6xl p-6 text-slate-200">
      {/* Header */}
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            All Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage every user&apos;s meeting room reservation.
          </p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search user, room, purpose..."
          />

          {/* <button
            type="button"
            onClick={fetchBookings}
            className="shrink-0 rounded-xl border border-slate-800/60 bg-slate-900/40 px-3 py-2 text-[11px] font-semibold text-slate-300 transition hover:text-white"
          >
            Refresh
          </button> */}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="mb-5 flex gap-6 overflow-x-auto border-b border-slate-800/80 text-[11px] font-bold uppercase tracking-wider">
        {STATUS_TABS.map((tab) => {
          const Icon = TAB_ICON[tab];

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex shrink-0 items-center gap-1.5 pb-2.5 transition-all ${
                activeTab === tab
                  ? TAB_ACTIVE_COLOR[tab]
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab} ({counts[tab]})
            </button>
          );
        })}
      </div>

      {/* Date Filter */}
      <div className="mb-4 flex justify-end">
        <div className="flex gap-1.5 rounded-xl border border-slate-800/60 bg-slate-900/40 p-1">
          {DATE_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDateFilter(range)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${
                dateFilter === range
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {DATE_LABELS[range]}
            </button>
          ))}
        </div>
      </div>

      {/* Booking List */}
      {pagedBookings.length > 0 ? (
        <div className="space-y-2.5">
          {pagedBookings.map((b) => {
            const busy = actingId === b.id;

            return (
              <div
                key={b.id}
                className="flex flex-col justify-between gap-2.5 rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 transition-colors hover:border-slate-700/40 sm:flex-row sm:items-center"
              >
                {/* Left side */}
                <div className="flex min-w-0 flex-col gap-1.5">
                  {/* Room */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                      <Building2 className="h-4 w-4 text-indigo-400" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-white">
                        {b.room?.name || "Meeting Room"}
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        {b.room?.location || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* User / Date / Time */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-800/40 bg-slate-950/40 px-2.5 py-1">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-700 text-[8px] font-bold text-slate-200">
                        {getInitials(b.user?.name)}
                      </span>
                      <span>{b.user?.name || "Unknown User"}</span>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-800/40 bg-slate-950/40 px-2.5 py-1">
                      <CalendarDays className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{b.booking_date.substring(0, 10)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-lg border border-slate-800/40 bg-slate-950/40 px-2.5 py-1">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      <span>
                        {b.start_time?.substring(0, 5)}
                        {" - "}
                        {b.end_time?.substring(0, 5)}
                      </span>
                    </div>
                  </div>

                  {/* Purpose */}
                  <p className="truncate text-[11px] text-slate-400">
                    <span className="text-slate-500">Purpose:</span>{" "}
                    <span className="font-medium text-slate-300">
                      {b.purpose || "No purpose stated"}
                    </span>
                  </p>
                </div>

                {/* Right side */}
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      STATUS_BADGE[b.status] ??
                      "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}
                  >
                    {b.status}
                  </span>

                  {b.status === "booked" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleReject(b.id)}
                      className="rounded-md border border-amber-500/30 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-amber-400 transition-all hover:bg-amber-500/10 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(b.id)}
                    className="rounded-md border border-slate-700/70 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400 transition-all hover:border-rose-500/40 hover:bg-rose-500/5 hover:text-rose-400 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/60 bg-slate-900/10 p-10 text-center">
          <AlertCircle className="mb-2 h-7 w-7 text-slate-600" />

          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
            No {activeTab === "all" ? "" : activeTab} bookings
          </h3>

          <p className="mt-0.5 text-[11px] text-slate-500">
            There are no records for this filter at the moment.
          </p>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={safePage}
        totalItems={filteredBookings.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}