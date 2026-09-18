"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../context/AuthContext";
import BookingChart from "@/components/BookingChart";

interface Room {
  id: number;
  name: string;
  location?: string;
  capacity?: number;
}

interface Booking {
  id: number;
  room_id: number;
  user_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose?: string;
  status: string;
  room?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
  };
}

/* -------------------- DATE HELPERS -------------------- */

function dateOnly(value: string | Date): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return String(value).substring(0, 10);
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function formatDate(date: string) {
  const value = new Date(`${date}T00:00:00`);

  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

/* -------------------- STATUS HELPERS -------------------- */

function isConfirmed(status: string) {
  return status.toLowerCase() === "confirmed";
}

function isCancelledOrRejected(status: string) {
  const value = status.toLowerCase();

  return (
    value === "cancel" ||
    value === "cancelled" ||
    value === "canceled" ||
    value === "rejected"
  );
}

function getStatusStyle(status: string) {
  const value = status.toLowerCase();

  if (value === "confirmed") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  }

  if (value === "booked") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-400";
  }

  if (value === "unconfirmed") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-400";
  }

  if (
    value === "cancel" ||
    value === "cancelled" ||
    value === "canceled"
  ) {
    return "border-slate-500/30 bg-slate-500/10 text-slate-400";
  }

  if (value === "rejected") {
    return "border-red-500/30 bg-red-500/10 text-red-400";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-400";
}

function getStatusLabel(status: string) {
  const value = status.toLowerCase();

  if (value === "confirmed") return "Confirmed";
  if (value === "booked") return "Booked";
  if (value === "unconfirmed") return "Unconfirmed";
  if (value === "rejected") return "Rejected";

  if (
    value === "cancel" ||
    value === "cancelled" ||
    value === "canceled"
  ) {
    return "Cancelled";
  }

  return status;
}

/* -------------------- MAIN DASHBOARD -------------------- */

export default function DashboardPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadData() {
      try {
        const roomsData = await apiFetch("/rooms", {
          token,
        });

        const bookingsData = await apiFetch("/bookings", {
          token,
        });

        setRooms(roomsData.data || roomsData);
        setBookings(bookingsData.data || bookingsData);
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token, router]);

  /* -------------------- TODAY -------------------- */

  const today = new Date();
  const todayString = dateOnly(today);

  /* -------------------- THIS WEEK -------------------- */

  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();

  const mondayOffset = day === 0 ? -6 : 1 - day;

  startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = addDays(startOfWeek, 6);

  const startOfWeekString = dateOnly(startOfWeek);
  const endOfWeekString = dateOnly(endOfWeek);

  /* -------------------- SEARCH -------------------- */

  const filteredBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return bookings;
    }

    return bookings.filter((booking) => {
      const roomName =
        booking.room?.name ||
        rooms.find((room) => room.id === booking.room_id)?.name ||
        "";

      const userName = booking.user?.name || "";

      return (
        roomName.toLowerCase().includes(keyword) ||
        userName.toLowerCase().includes(keyword) ||
        booking.purpose?.toLowerCase().includes(keyword) ||
        booking.status.toLowerCase().includes(keyword) ||
        booking.booking_date.includes(keyword)
      );
    });
  }, [bookings, rooms, search]);

  /* -------------------- TODAY BOOKINGS -------------------- */

  const todayBookings = filteredBookings
    .filter((booking) => dateOnly(booking.booking_date) === todayString)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  /* -------------------- NEXT 6 DAYS -------------------- */

  const nextSixDaysEnd = dateOnly(addDays(today, 6));

  const upcomingBookings = filteredBookings
    .filter((booking) => {
      const bookingDate = dateOnly(booking.booking_date);

      return (
        bookingDate > todayString &&
        bookingDate <= nextSixDaysEnd
      );
    })
    .sort((a, b) => {
      const dateCompare = a.booking_date.localeCompare(b.booking_date);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return a.start_time.localeCompare(b.start_time);
    });

  /* -------------------- SUMMARY CARDS -------------------- */

  const thisWeekBookings = bookings.filter((booking) => {
    const bookingDate = dateOnly(booking.booking_date);

    return (
      bookingDate >= startOfWeekString &&
      bookingDate <= endOfWeekString
    );
  });

  const confirmedBookings = thisWeekBookings.filter((booking) =>
    isConfirmed(booking.status)
  ).length;

  const cancelledOrRejectedBookings = thisWeekBookings.filter((booking) =>
    isCancelledOrRejected(booking.status)
  ).length;

  const roomBookingCounts: Record<string, number> = {};

  thisWeekBookings.forEach((booking) => {
    const roomName =
      booking.room?.name ||
      rooms.find((room) => room.id === booking.room_id)?.name ||
      `Room #${booking.room_id}`;

    roomBookingCounts[roomName] =
      (roomBookingCounts[roomName] || 0) + 1;
  });

  const mostBookedRoom =
    Object.entries(roomBookingCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || "No bookings";

  const mostBookedRoomCount =
    Object.entries(roomBookingCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[1] || 0;

  function roomName(roomId: number) {
    return (
      rooms.find((room) => room.id === roomId)?.name ||
      `Room #${roomId}`
    );
  }

  return (
    <main className="min-h-screen flex-1 overflow-y-auto bg-[#020817] text-white">
      {/* =====================================================
          TOP HEADER
      ====================================================== */}

      <div className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#020817]/95 px-6 py-4 backdrop-blur-xl lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}

          <div className="relative w-full max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms, bookings..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          {/* Right side */}

          <div className="flex items-center gap-4">
            <button
              type="button"
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

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
            </button>

            <div className="hidden h-8 w-px bg-slate-800 sm:block" />

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-xs font-bold text-slate-800">
                {getInitials(
                  bookings[0]?.user?.name
                )}
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-200">
                  Meeting Room
                </p>

                <p className="text-xs text-slate-500">
                  Booking System
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8">
        {/* =====================================================
            PAGE INTRO
        ====================================================== */}

        <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-blue-400">
              Dashboard
            </p>

            <h1 className="text-2xl font-extrabold tracking-tight text-white lg:text-3xl">
              Good Afternoon 👋
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Here&apos;s what&apos;s happening with your meeting rooms.
            </p>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-400">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2">
              <span className="text-slate-500">Today</span>
              <span className="ml-2 font-medium text-slate-200">
                {formatDate(todayString)}
              </span>
            </div>
          </div>
        </div>

        {/* =====================================================
            SUMMARY CARDS
        ====================================================== */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* This Week */}

          <SummaryCard
            icon="calendar"
            title="This Week Total Bookings"
            value={thisWeekBookings.length}
            description="Bookings this week"
            iconStyle="bg-blue-500/15 text-blue-400"
          />

          {/* Confirmed */}

          <SummaryCard
            icon="check"
            title="Confirmed Bookings"
            value={confirmedBookings}
            description="Confirmed this week"
            iconStyle="bg-emerald-500/15 text-emerald-400"
          />

          {/* Cancel / Reject */}

          <SummaryCard
            icon="alert"
            title="Cancel / Reject Booking"
            value={cancelledOrRejectedBookings}
            description="Cancelled or rejected"
            iconStyle="bg-rose-500/15 text-rose-400"
          />

          {/* Most Booked */}

          <SummaryCard
            icon="chart"
            title="Most Booked Room"
            value={mostBookedRoom}
            description={`${mostBookedRoomCount} booking${
              mostBookedRoomCount === 1 ? "" : "s"
            } this week`}
            iconStyle="bg-violet-500/15 text-violet-400"
            valueClass="text-lg"
          />
        </div>

        {/* =====================================================
            BOOKING CHART
        ====================================================== */}

        <div className="mb-7">
          <BookingChart
            bookings={bookings}
            roomName={roomName}
          />
        </div>

        {/* =====================================================
            BOOKING LISTS
        ====================================================== */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* TODAY */}

          <BookingTableCard
            title="Today's Bookings"
            subtitle="Live meeting room bookings for today"
            count={todayBookings.length}
            bookings={todayBookings}
            roomName={roomName}
            showDate={false}
          />

          {/* UPCOMING */}

          <BookingTableCard
            title="Upcoming Bookings (Next 6 Days)"
            subtitle="Reservations scheduled after today"
            count={upcomingBookings.length}
            bookings={upcomingBookings}
            roomName={roomName}
            showDate={true}
          />
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  icon,
  title,
  value,
  description,
  iconStyle,
  valueClass = "text-3xl",
}: {
  icon: "calendar" | "check" | "alert" | "chart";
  title: string;
  value: string | number;
  description: string;
  iconStyle: string;
  valueClass?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/65 p-5 shadow-xl shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">
            {title}
          </p>

          <p
            className={`mt-3 font-extrabold tracking-tight text-white ${valueClass}`}
          >
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
        >
          {icon === "calendar" && (
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="3" y="4" width="18" height="17" rx="3" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          )}

          {icon === "check" && (
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 2.5 2.5L16.5 9" />
            </svg>
          )}

          {icon === "alert" && (
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M12 3 2.8 19a1.5 1.5 0 0 0 1.3 2.2h15.8a1.5 1.5 0 0 0 1.3-2.2L12 3Z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          )}

          {icon === "chart" && (
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 19V5M4 19h16" />
              <path d="m7 15 4-4 3 2 5-7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   BOOKING TABLE CARD
============================================================ */

function BookingTableCard({
  title,
  subtitle,
  count,
  bookings,
  roomName,
  showDate,
}: {
  title: string;
  subtitle: string;
  count: number;
  bookings: Booking[];
  roomName: (id: number) => string;
  showDate: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/65 shadow-xl shadow-black/10">
      {/* Card header */}

      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="3" y="4" width="18" height="17" rx="3" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-white">
              {title}
            </h2>

            <p className="mt-1 truncate text-xs text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>

        <span className="ml-3 shrink-0 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs font-medium text-slate-300">
          {count} booking{count === 1 ? "" : "s"}
        </span>
      </div>

      {/* Table */}

      <div className="max-h-[320px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-700">
        <table className="w-full table-fixed border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-[#080f20]">
            <tr className="border-b border-slate-800 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {showDate && (
                <th className="w-[14%] px-3 py-3">
                  Date
                </th>
              )}

              <th className={showDate ? "w-[18%] px-3 py-3" : "w-[22%] px-3 py-3"}>
                Room
              </th>

              <th className="w-[18%] px-3 py-3">
                Booked By
              </th>

              <th className="w-[17%] px-3 py-3">
                Time
              </th>

              <th className={showDate ? "w-[20%] px-3 py-3" : "w-[23%] px-3 py-3"}>
                Purpose
              </th>

              <th className="w-[15%] px-3 py-3 text-center">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/70">
            {bookings.length > 0 ? (
              bookings.map((booking) => {
                const room =
                  booking.room?.name ||
                  roomName(booking.room_id);

                const userName =
                  booking.user?.name || "Unknown User";

                return (
                  <tr
                    key={booking.id}
                    className="transition-colors hover:bg-slate-800/30"
                  >
                    {showDate && (
                      <td className="px-3 py-4 align-top text-xs text-slate-300">
                        <span className="block leading-5">
                          {new Date(
                            `${dateOnly(booking.booking_date)}T00:00:00`
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                    )}

                    <td className="px-3 py-4 align-top">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />

                        <span className="break-words text-xs font-semibold leading-5 text-blue-400">
                          {room}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-4 align-top">
                      <div className="flex min-w-0 items-start gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-slate-200">
                          {getInitials(userName)}
                        </div>

                        <span className="break-words pt-1 text-xs leading-4 text-slate-300">
                          {userName}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-4 align-top whitespace-nowrap text-xs font-medium text-slate-300">
                      {booking.start_time?.substring(0, 5)}{" "}
                      -{" "}
                      {booking.end_time?.substring(0, 5)}
                    </td>

                    <td className="px-3 py-4 align-top">
                      <span className="break-words text-xs leading-5 text-slate-400">
                        {booking.purpose || "No purpose stated"}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-center align-top">
                      <span
                        className={`inline-flex max-w-full items-center justify-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold whitespace-nowrap ${getStatusStyle(
                          booking.status
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />

                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={showDate ? 6 : 5}
                  className="px-4 py-14 text-center"
                >
                  <div className="flex flex-col items-center">
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-800/70 text-slate-500">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="17"
                          rx="3"
                        />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                    </div>

                    <p className="text-sm font-medium text-slate-400">
                      No bookings available
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      There are no bookings in this period.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}