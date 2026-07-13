"use client";

import { useEffect, useState } from "react";
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
  status: "confirmed" | "pending" | "rejected" | string;
  room?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
  };
}

const cardColors = [
  "border-t-blue-500",
  // "border-t-emerald-500",
  // "border-t-amber-500",
  // "border-t-rose-500",
];

function getEndOfWeek(date: Date) {
  const day = date.getDay(); 
  const diffToSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(date);
  sunday.setDate(date.getDate() + diffToSunday);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChart, setShowChart] =useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadData() {
      try {
        const roomsData = await apiFetch("/rooms", { token });
        const bookingsData = await apiFetch("/bookings", { token });
        setRooms(roomsData.data || roomsData);
        setBookings(bookingsData.data || bookingsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token, router]);

  const endOfWeekStr = getEndOfWeek(new Date()).toISOString().split("T")[0];

  const recentBookings = bookings.filter((b) => b.booking_date <= endOfWeekStr);
  const upcomingBookings = bookings.filter((b) => b.booking_date > endOfWeekStr);

  function roomName(roomId: number) {
    return rooms.find((r) => r.id === roomId)?.name || `Room #${roomId}`;
  }

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-slate-950 min-h-screen">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">Overview of meeting rooms and live bookings status.</p>
      </div>

      <div className="mb-10">
        <h2 className="mb-4 text-lg font-bold text-white tracking-wide">Meeting Rooms Status</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading && <p className="text-slate-400 text-sm animate-pulse">Loading rooms information...</p>}
          {!loading && rooms.map((room, i) => (
            <div
              key={room.id}
              className={`rounded-xl border-t-4 bg-slate-900 p-5 shadow-lg shadow-black/20 hover:scale-[1.02] transition-transform duration-200 ${
                cardColors[i % cardColors.length]
              }`}
            >
              <h3 className="truncate text-base font-bold text-white">
                {room.name}
              </h3>
              {room.location && (
                <p className="mt-1 truncate text-xs text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  {room.location}
                </p>
              )}
              {room.capacity && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-2 text-xs text-slate-400">
                  <span>Capacity:</span>
                  <span className="font-semibold text-slate-200">{room.capacity} seats</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowChart(!showChart)}
          className="rounded-lg bg-slate-950 border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white hover:border-slate-700 active:scale-95 transition-all "
        >
          {showChart ? "✕ Hide Chart" : "📊 Show Analytics Chart"}
        </button>
      </div>

      {showChart && (
        <div className="animate-fadeIn">
          <BookingChart bookings={bookings} roomName={roomName} />
        </div>
      )}

      <div className="space-y-8">
        <BookingTable
          title="Recent Bookings (This Week)"
          bookings={recentBookings}
          roomName={roomName}
        />

        <BookingTable
          title="Upcoming Bookings"
          bookings={upcomingBookings}
          roomName={roomName}
        />
      </div>
    </main>
  );
}

function BookingTable({
  title,
  bookings,
  roomName,
}: {
  title: string;
  bookings: Booking[];
  roomName: (id: number) => string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
      <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-4">
        <h2 className="text-base font-bold text-slate-200 tracking-wide">
          {title}
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-6 py-4.5">Room</th>
              <th className="px-6 py-4.5">Booked By</th>
              <th className="px-6 py-4.5">Date</th>
              <th className="px-6 py-4.5">Time Window</th>
              <th className="px-6 py-4.5">Purpose</th>
              <th className="px-6 py-4.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {bookings && bookings.length > 0 ? (
              bookings.map((b) => (
                <tr
                  key={b.id}
                  className="transition-colors hover:bg-slate-800/40"
                >
                  <td className="px-6 py-4 font-bold text-indigo-400 truncate max-w-[150px]">
                    {b.room?.name || roomName(b.room_id)}
                  </td>
                  <td className="px-6 py-4 font-medium text-white truncate max-w-[150px]">
                    {b.user?.name || "Unknown User"}
                  </td>
                  <td className="px-6 py-4 tabular-nums text-slate-300">
                    {b.booking_date}
                  </td>
                  <td className="px-6 py-4 tabular-nums text-slate-300 font-medium">
                    {b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}
                  </td>
                  <td className="px-6 py-4 text-slate-400 truncate max-w-[200px]" title={b.purpose}>
                    {b.purpose || <span className="italic text-slate-600">No purpose stated</span>}
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-block rounded-md border px-3 py-1 text-xs font-semibold tracking-wide ${
                        b.status === "confirmed"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : b.status === "rejected"
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-400"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {b.status === "confirmed"
                        ? "Confirmed"
                        : b.status === "rejected"
                          ? "Rejected"
                          : "Pending"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-12 text-center italic text-slate-500 text-sm bg-slate-900/20"
                >
                  No active bookings available in this section.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}