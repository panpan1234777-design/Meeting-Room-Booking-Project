"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface Booking {
  id: number;
  user_id: number;
  room: {
    name: string;
    location: string;
  };
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: "booked" | "cancelled" | "rejected";
  created_at: string;
}

export default function MyBookingsPage() {
  const { user: authUser } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    "booked" | "cancelled" | "rejected"
  >("booked");
  const [dateFilter, setDateFilter] = useState<
    "today" | "week" | "month" | "all"
  >("all");

  const BASE_URL = "http://localhost:8000";
  const isWithinRange = (dateStr: string) => {
    if (dateFilter === "all") return true;
    const d = new Date(dateStr);
    const now = new Date();
    if (dateFilter === "today") {
      return d.toDateString() === now.toDateString();
    }
    if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo && d <= now;
    }
    if (dateFilter === "month") {
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }
    return true;
  };

  // ==========================================
  // Fetch user's bookings
  // ==========================================
  const fetchAndFilterBookings = async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem("token");
      const currentUserId = authUser?.id;

      if (!token || !currentUserId) {
        setBookings([]);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/bookings`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const resData = await response.json();

      if (resData.status && currentUserId) {
        const myFilteredBookings = resData.data.filter(
          (booking: Booking) =>
            Number(booking.user_id) === Number(currentUserId),
        );

        myFilteredBookings.sort(
          (a: Booking, b: Booking) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        setBookings(myFilteredBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // Load bookings when user is available
  // ==========================================
  useEffect(() => {
    if (authUser?.id) {
      fetchAndFilterBookings();
    }
  }, [authUser]);

  // ==========================================
  // Cancel booking
  // ==========================================
  const handleCancelBooking = async (bookingId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("You are not logged in.");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/bookings/${bookingId}/cancel`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const resData = await response.json();

      if (!response.ok) {
        alert(resData.message || "Failed to cancel this booking.");
        return;
      }

      // Change the booking status locally.
      // This makes it immediately move from Booked
      // to Cancelled without refreshing the page.
      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: "cancelled" }
            : booking,
        ),
      );
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Something went wrong while cancelling the booking.");
    }
  };

  // ==========================================
  // Filter bookings based on active tab
  // ==========================================
  const filteredBookings = bookings.filter((booking) => {
    const currentStatus = booking.status?.toLowerCase();
    const dateMatch = isWithinRange(booking.booking_date);

    if (activeTab === "booked") {
      return currentStatus === "booked" && dateMatch;
    }

    if (activeTab === "cancelled") {
      return currentStatus === "cancelled" && dateMatch;
    }

    if (activeTab === "rejected") {
      return currentStatus === "rejected" && dateMatch;
    }

    return false;
  });

  const bookedCount = bookings.filter(
    (booking) => booking.status?.toLowerCase() === "booked",
  ).length;

  const cancelledCount = bookings.filter(
    (booking) => booking.status?.toLowerCase() === "cancelled",
  ).length;

  const rejectedCount = bookings.filter(
    (booking) => booking.status?.toLowerCase() === "rejected",
  ).length;

  // ==========================================
  // Loading
  // ==========================================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
        <p className="text-slate-400 text-sm">Loading your bookings...</p>
      </div>
    );
  }

  // ==========================================
  // Main UI
  // ==========================================
  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen text-slate-200">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-white">
          My Bookings
        </h1>

        <p className="text-slate-500 text-[11px] mt-0.5">
          Track the status of your meeting room reservations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 mb-5 gap-6 text-[11px] font-bold uppercase tracking-wider">
        {/* Booked Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("booked")}
          className={`pb-2.5 transition-all relative flex items-center gap-1.5 ${
            activeTab === "booked"
              ? "text-emerald-400 border-b-2 border-emerald-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Booked ({bookedCount})
        </button>

        {/* Cancelled Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("cancelled")}
          className={`pb-2.5 transition-all relative flex items-center gap-1.5 ${
            activeTab === "cancelled"
              ? "text-rose-400 border-b-2 border-rose-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Cancelled ({cancelledCount})
        </button>

        {/* Rejected Tab */}
        <button
          type="button"
          onClick={() => setActiveTab("rejected")}
          className={`pb-2.5 transition-all relative flex items-center gap-1.5 ${
            activeTab === "rejected"
              ? "text-rose-400 border-b-2 border-rose-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex justify-end mb-4">
        <div className="flex gap-1.5 bg-slate-900/40 border border-slate-800/60 rounded-xl p-1">
          {(["today", "week", "month", "all"] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDateFilter(range)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition ${
                dateFilter === range
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {range === "today"
                ? "Today"
                : range === "week"
                  ? "This Week"
                  : range === "month"
                    ? "This Month"
                    : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Booking List */}
      {filteredBookings.length > 0 ? (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const isBooked = booking.status?.toLowerCase() === "booked";

            const isCancelled = booking.status?.toLowerCase() === "cancelled";

            const isRejected = booking.status?.toLowerCase() === "rejected";

            return (
              <div
                key={booking.id}
                className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700/40 transition-colors"
              >
                {/* Left side */}
                <div className="flex flex-col gap-2">
                  {/* Room */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider ${
                        isBooked
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : isRejected
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}
                    >
                      <Building2
                        className={`w-4 h-4 ${
                          isBooked
                            ? "text-emerald-400"
                            : isRejected
                              ? "text-rose-400"
                              : "text-slate-500"
                        }`}
                      />
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white">
                        {booking.room?.name || "Meeting Room"}
                      </h3>

                      <p className="text-[10px] text-slate-500">
                        {booking.room?.location || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/40">
                      <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />

                      <span>{booking.booking_date}</span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-1.5 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/40">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />

                      <span>
                        {booking.start_time?.substring(0, 5)}
                        {" - "}
                        {booking.end_time?.substring(0, 5)}
                      </span>
                    </div>
                  </div>

                  {/* Purpose */}
                  <p className="text-[11px] text-slate-400">
                    <span className="text-slate-500">Purpose:</span>{" "}
                    <span className="text-slate-300 font-medium">
                      {booking.purpose}
                    </span>
                  </p>
                </div>

                {/* Right side */}
                <div className="flex items-center sm:self-center self-end shrink-0 gap-2">
                  {/* Status */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border tracking-wider ${
                      isBooked
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : isRejected
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}
                  >
                    {isBooked
                      ? "Booked"
                      : isRejected
                        ? "Rejected"
                        : "Cancelled"}
                  </span>

                  {/* Cancel Button */}
                  {isBooked && (
                    <button
                      type="button"
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-2.5 py-1 rounded-md text-[9px] font-semibold uppercase tracking-wide text-slate-400 border border-slate-700/70 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // ==========================================
        // Empty State
        // ==========================================
        <div className="flex flex-col items-center justify-center border border-dashed border-slate-800/60 rounded-2xl p-10 bg-slate-900/10 text-center">
          <AlertCircle className="w-7 h-7 text-slate-600 mb-2" />

          <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wide">
            No{" "}
            {activeTab === "booked"
              ? "Booked"
              : activeTab === "rejected"
                ? "Rejected"
                : "Cancelled"}{" "}
            Bookings
          </h3>

          <p className="text-[11px] text-slate-500 mt-0.5">
            There are no records in this section at the moment.
          </p>
        </div>
      )}
    </div>
  );
}
