"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
} from "lucide-react";

import RoomCalendar from "@/components/RoomCalendar";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/app/context/AuthContext";

type Room = {
  id: number;
  name: string;
  floor?: string;
  capacity?: number;
};

type Booking = {
  id: number;
  room_id?: number;

  room: {
    id?: number;
    name: string;
  };

  user: {
    name: string;
  };

  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;

  /*
   * Current project booking logic
   */
  status: "booked" | "cancel" | "rejected";
};

/*
==================================================
DATE -> YYYY-MM-DD
==================================================
*/

function toDateKey(date: Date) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
==================================================
YYYY-MM-DD -> LOCAL DATE
==================================================
*/

function fromDateKey(value: string) {
  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

export default function AdminCalendarPage() {

  const { token } = useAuth();

  /*
  ==================================================
  STATE
  ==================================================
  */

  const [rooms, setRooms] =
    useState<Room[]>([]);

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /*
  ==================================================
  LOAD ROOMS
  ==================================================
  */

  useEffect(() => {

    if (!token) return;

    apiFetch("/rooms", {
      token,
    })
      .then((res) => {

        setRooms(
          res.data ??
          res ??
          []
        );

      })
      .catch((err) => {

        setError(
          err?.message ??
          "Failed to load rooms"
        );

      });

  }, [token]);

  /*
  ==================================================
  LOAD BOOKINGS
  ==================================================
  */

  useEffect(() => {

    if (!token) return;

    setLoading(true);
    setError(null);

    /*
     * Backend returns all bookings.
     *
     * RoomCalendar handles:
     * - selected date
     * - room filter
     * - booking positioning
     */

    apiFetch("/bookings", {
      token,
    })
      .then((res) => {

        setBookings(
          res.data ??
          res ??
          []
        );

      })
      .catch((err) => {

        setError(
          err?.message ??
          "Failed to load bookings"
        );

      })
      .finally(() => {

        setLoading(false);

      });

  }, [token]);

  /*
  ==================================================
  DATE PICKER
  ==================================================
  */

  const handleDateChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    const value =
      event.target.value;

    if (!value) return;

    setSelectedDate(
      fromDateKey(value)
    );
  };

  /*
  ==================================================
  TODAY
  ==================================================
  */

  const handleToday = () => {
    setSelectedDate(
      new Date()
    );
  };

  /*
  ==================================================
  PAGE
  ==================================================
  */

  return (

    <div className="p-6">

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div className="mb-5 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Calendar
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            View all bookings
          </p>

        </div>

        {/* ==================================================
            RIGHT DATE CONTROL
        ================================================== */}

        <div className="flex items-center gap-2">

          {/* TODAY */}

          <button
            type="button"
            onClick={handleToday}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Today
          </button>

          {/* DATE */}

          <label className="relative flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2">

            <CalendarDays
              size={16}
              className="text-orange-400"
            />

            <input
              type="date"
              value={toDateKey(
                selectedDate
              )}
              onChange={
                handleDateChange
              }
              className="bg-transparent text-sm text-slate-200 outline-none"
            />

          </label>

        </div>

      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (

        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>

      )}

      {/* ==================================================
          CALENDAR
      ================================================== */}

      {loading ? (

        <div className="flex min-h-[500px] items-center justify-center">

          <div className="text-sm text-slate-400">
            Loading calendar...
          </div>

        </div>

      ) : (

        <RoomCalendar
          rooms={rooms}
          bookings={bookings}
          date={selectedDate}
          onDateChange={
            setSelectedDate
          }
        />

      )}

    </div>
  );
}