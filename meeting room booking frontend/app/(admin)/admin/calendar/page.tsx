"use client";

import { useEffect, useState } from "react";
import RoomCalendar from "@/components/RoomCalendar";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";

type Room = { id: number; name: string; floor?: string };
type Booking = {
  id: number;
  room_id?: number;
  room: { id?: number; name: string };
  user: { name: string };
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: "pending" | "confirmed" | "rejected";
};

export default function AdminCalendarPage() {
  const { token } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    apiFetch("/rooms", { token })
      .then((res) => setRooms(res.data ?? res ?? []))
      .catch((err) => setError(err?.message ?? "Failed to load rooms"));
  }, [token]);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    // backend returns ALL bookings;  filter by date on the frontend
    apiFetch("/bookings", { token })
      .then((res) => setBookings(res.data ?? res ?? []))
      .catch((err) => setError(err?.message ?? "Failed to load bookings"))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            View all bookings
          </p>
        </div>
        <input
          type="date"
          value={selectedDate.toISOString().split("T")[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm">Loading...</div>
      ) : (
        <RoomCalendar rooms={rooms} bookings={bookings} date={selectedDate} />
      )}
    </div>
  );
}