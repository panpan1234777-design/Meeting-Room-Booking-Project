"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../context/AuthContext";

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
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-rose-500",
];

function getEndOfWeek(date: Date) {
  const day = date.getDay(); // 0 = Sunday
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
    <main className="flex-1 overflow-y-auto p-8">
      <h1 className="mb-6 text-2xl font-bold text-white">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {loading && <p className="text-slate-500">Loading rooms...</p>}
        {rooms.map((room, i) => (
          <div
            key={room.id}
            className={`rounded-xl border-l-4 bg-slate-900 p-3 shadow ${cardColors[i % cardColors.length]
              }`}
          >
            <h3 className="truncate text-sm font-semibold text-white">
              {room.name}
            </h3>
            {room.location && (
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {room.location}
              </p>
            )}
            {room.capacity && (
              <p className="mt-1 text-[11px] text-slate-500">
                Capacity: {room.capacity}
              </p>
            )}
          </div>
        ))}
      </div>

      <BookingTable
        title="Recent Bookings"
        bookings={recentBookings}
        roomName={roomName}
      />

      <div className="mt-8">
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
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
        {title}
      </h2>
      <div className="max-h-[320px] flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <table className="w-full table-fixed border-collapse text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-800/60 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="w-[16%] py-2.5">Room</th>
              <th className="w-[16%] py-2.5">Booked By</th>
              <th className="w-[14%] py-2.5">Date</th>
              <th className="w-[18%] py-2.5">Time</th>
              <th className="w-[22%] py-2.5">Purpose</th>
              <th className="w-[14%] py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 text-slate-300">
            {bookings && bookings.length > 0 ? (
              bookings.map((b) => (
                <tr
                  key={b.id}
                  className="transition-colors hover:bg-slate-800/20"
                >
                  <td className="truncate py-2 font-semibold text-indigo-400">
                    {b.room?.name || roomName(b.room_id)}
                  </td>
                  <td className="truncate py-2 font-medium text-white">
                    {b.user?.name || "Unknown"}
                  </td>
                  <td className="py-2 tabular-nums text-slate-400">
                    {b.booking_date}
                  </td>
                  <td className="py-2 tabular-nums text-slate-400">
                    {b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}
                  </td>
                  <td className="truncate py-2 text-slate-400">
                    {b.purpose}
                  </td>
                  <td className="py-2 text-center">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${b.status === "confirmed"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : b.status === "rejected"
                            ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                        }`}
                    >
                      {b.status === "confirmed"
                        ? "Confirmed"
                        : b.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center italic text-slate-500"
                >
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}