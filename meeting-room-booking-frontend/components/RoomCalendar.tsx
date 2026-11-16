"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Users,
  Building2,
} from "lucide-react";

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
   * Backend may return "cancel" or "cancelled"
   */
  status: "booked" | "cancel" | "cancelled" | "rejected";
};

const BUSINESS_START = 9;
const BUSINESS_END = 17;

const HOURS = Array.from(
  { length: BUSINESS_END - BUSINESS_START },
  (_, i) => BUSINESS_START + i
);

const TOTAL_MINUTES =
  (BUSINESS_END - BUSINESS_START) * 60;

/*
==================================================
NORMALIZE STATUS
==================================================
*/

type NormalizedStatus = "booked" | "cancel" | "rejected";

function normalizeStatus(
  status: string
): NormalizedStatus {
  if (status === "cancelled" || status === "canceled")
    return "cancel";
  if (status === "booked" || status === "cancel" || status === "rejected")
    return status as NormalizedStatus;
  return "cancel";
}

/*
==================================================
STATUS STYLE
==================================================
*/

const statusColor: Record<NormalizedStatus, string> = {
  booked:
    "bg-emerald-500 border-emerald-600 text-white",

  cancel:
    "bg-slate-400/90 border-slate-500 text-white",

  rejected:
    "bg-rose-400 border-rose-500 text-white",
};

const statusLabel: Record<NormalizedStatus, string> = {
  booked: "Booked",
  cancel: "Cancelled",
  rejected: "Rejected",
};

/*
==================================================
DATE HELPERS
==================================================
*/

function toDateKey(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function fromDateKey(value: string) {
  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}

function isSameDay(
  first: Date,
  second: Date
) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/*
==================================================
COMBINE DATE + TIME
==================================================
*/

function combineDateAndTime(
  bookingDate: string,
  time: string
) {
  const datePart =
    bookingDate.split("T")[0];

  const timePart =
    time.length === 5
      ? `${time}:00`
      : time;

  return new Date(
    `${datePart}T${timePart}`
  );
}

/*
==================================================
CALENDAR POSITION
==================================================
*/

function getPositionPercent(
  dt: Date,
  viewStart: Date
) {
  const minutesFromStart =
    (dt.getTime() - viewStart.getTime()) /
    60000;

  const clamped = Math.min(
    Math.max(
      minutesFromStart,
      0
    ),
    TOTAL_MINUTES
  );

  return (
    (clamped / TOTAL_MINUTES) * 100
  );
}

/*
==================================================
MAIN COMPONENT
==================================================
*/

export default function RoomCalendar({
  rooms,
  bookings,
  date,
  onDateChange,
}: {
  rooms: Room[];
  bookings: Booking[];
  date: Date;
  onDateChange: (date: Date) => void;
}) {
  /*
  ==================================================
  STATE
  ==================================================
  */

  const [currentMonth, setCurrentMonth] =
    useState(
      new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      )
    );

  const [selectedRoomId, setSelectedRoomId] =
    useState<number | null>(null);

  const [hovered, setHovered] =
    useState<Booking | null>(null);

  const [hoverPos, setHoverPos] =
    useState({
      x: 0,
      y: 0,
    });

  // Tooltip width & height constants for clamping
  const TOOLTIP_W = 270;
  const TOOLTIP_H = 230;

  function clampTooltip(cx: number, cy: number) {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const gap = 15;
    let x = cx + gap;
    let y = cy + gap;
    if (x + TOOLTIP_W > vw - 8) x = cx - TOOLTIP_W - gap;
    if (y + TOOLTIP_H > vh - 8) y = cy - TOOLTIP_H - gap;
    return { x: Math.max(8, x), y: Math.max(8, y) };
  }

  /*
  ==================================================
  KEEP MINI CALENDAR IN SYNC
  ==================================================
  */

  useEffect(() => {
    setCurrentMonth(
      new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      )
    );
  }, [date]);

  /*
  ==================================================
  SELECTED DATE
  ==================================================
  */

  const selectedKey = toDateKey(date);

  /*
  ==================================================
  CALENDAR DAYS
  ==================================================
  */

  const calendarDays = useMemo(() => {
    const year =
      currentMonth.getFullYear();

    const month =
      currentMonth.getMonth();

    const firstDay =
      new Date(
        year,
        month,
        1
      );

    const lastDay =
      new Date(
        year,
        month + 1,
        0
      );

    /*
     * Convert Sunday-first to Monday-first
     */
    const firstDayIndex =
      (firstDay.getDay() + 6) % 7;

    const totalDays =
      lastDay.getDate();

    const days: (
      Date | null
    )[] = [];

    for (
      let i = 0;
      i < firstDayIndex;
      i++
    ) {
      days.push(null);
    }

    for (
      let day = 1;
      day <= totalDays;
      day++
    ) {
      days.push(
        new Date(
          year,
          month,
          day
        )
      );
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [currentMonth]);

  /*
  ==================================================
  ROOM FILTER
  ==================================================
  */

  const visibleRooms =
    selectedRoomId === null
      ? rooms
      : rooms.filter(
          (room) =>
            room.id === selectedRoomId
        );

  /*
  ==================================================
  VIEW START = 9:00 AM
  ==================================================
  */

  const viewStart = new Date(date);

  viewStart.setHours(
    BUSINESS_START,
    0,
    0,
    0
  );

  const gridCols =
    `repeat(${HOURS.length}, minmax(90px, 1fr))`;

  /*
  ==================================================
  MONTH NAVIGATION
  ==================================================
  */

  const goPreviousMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );
  };

  const goNextMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );
  };

  /*
  ==================================================
  SELECT DATE
  ==================================================
  */

  const handleDateSelect = (
    selectedDate: Date
  ) => {
    onDateChange(selectedDate);
  };

  /*
  ==================================================
  RENDER
  ==================================================
  */

  return (
    <div className="rounded-2xl bg-white shadow-[0_20px_70px_-20px_rgba(255,255,255,0.28)] overflow-hidden">

      <div className="flex min-h-[570px]">

        {/* ==================================================
            LEFT SIDEBAR
        ================================================== */}

        <aside className="w-[255px] shrink-0 border-r border-slate-200 bg-white p-5">

          {/* ==================================================
              MINI CALENDAR HEADER
          ================================================== */}

          <div className="flex items-center justify-between mb-5">

            <div className="flex items-center gap-2">

              <CalendarDays
                size={18}
                className="text-orange-500"
              />

              <span className="text-sm font-bold text-slate-800">
                {formatMonthYear(
                  currentMonth
                )}
              </span>

            </div>

            <div className="flex items-center gap-1">

              <button
                type="button"
                onClick={goPreviousMonth}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <ChevronLeft
                  size={16}
                />
              </button>

              <button
                type="button"
                onClick={goNextMonth}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <ChevronRight
                  size={16}
                />
              </button>

            </div>

          </div>

          {/* ==================================================
              WEEK DAYS
          ================================================== */}

          <div className="grid grid-cols-7 mb-2">

            {[
              "M",
              "T",
              "W",
              "T",
              "F",
              "S",
              "S",
            ].map((day, index) => (

              <div
                key={`${day}-${index}`}
                className="text-center text-[10px] font-semibold text-slate-400"
              >
                {day}
              </div>

            ))}

          </div>

          {/* ==================================================
              DAYS
          ================================================== */}

          <div className="grid grid-cols-7 gap-y-1">

            {calendarDays.map(
              (day, index) => {

                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="h-8"
                    />
                  );
                }

                const isSelected =
                  isSameDay(
                    day,
                    date
                  );

                const isToday =
                  isSameDay(
                    day,
                    new Date()
                  );

                return (
                  <button
                    key={toDateKey(day)}
                    type="button"
                    onClick={() =>
                      handleDateSelect(
                        day
                      )
                    }
                    className={`
                      mx-auto
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-full
                      text-xs
                      transition
                      ${
                        isSelected
                          ? "bg-orange-500 text-white font-bold shadow-sm"
                          : isToday
                          ? "border border-orange-300 text-orange-600 font-semibold"
                          : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                      }
                    `}
                  >
                    {day.getDate()}
                  </button>
                );
              }
            )}

          </div>

          {/* ==================================================
              TODAY BUTTON
          ================================================== */}

          <button
            type="button"
            onClick={() =>
              handleDateSelect(
                new Date()
              )
            }
            className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition"
          >
            Today
          </button>

          {/* ==================================================
              ROOM FILTER
          ================================================== */}

          <div className="mt-7">

            <div className="mb-3 flex items-center gap-2">

              <Building2
                size={15}
                className="text-slate-500"
              />

              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Rooms
              </h3>

            </div>

            <div className="space-y-1">

              {/* ALL ROOMS */}

              <button
                type="button"
                onClick={() =>
                  setSelectedRoomId(null)
                }
                className={`
                  w-full
                  rounded-lg
                  px-3
                  py-2
                  text-left
                  text-xs
                  font-medium
                  transition
                  ${
                    selectedRoomId === null
                      ? "bg-orange-50 text-orange-600"
                      : "text-slate-600 hover:bg-slate-50"
                  }
                `}
              >
                <span className="mr-2">
                  {selectedRoomId === null
                    ? "✓"
                    : "○"}
                </span>

                All Rooms
              </button>

              {/* ROOM LIST */}

              {rooms.map((room) => {

                const selected =
                  selectedRoomId ===
                  room.id;

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() =>
                      setSelectedRoomId(
                        room.id
                      )
                    }
                    className={`
                      w-full
                      rounded-lg
                      px-3
                      py-2
                      text-left
                      text-xs
                      font-medium
                      transition
                      ${
                        selected
                          ? "bg-orange-50 text-orange-600"
                          : "text-slate-600 hover:bg-slate-50"
                      }
                    `}
                  >
                    <span className="mr-2">
                      {selected
                        ? "✓"
                        : "○"}
                    </span>

                    {room.name}
                  </button>
                );
              })}

            </div>

          </div>

          {/* ==================================================
              STATUS
          ================================================== */}

          <div className="mt-7">

            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              Status
            </h3>

            <div className="space-y-2">

              {/* BOOKED */}

              <div className="flex items-center gap-2">

                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                <span className="text-xs text-slate-600">
                  Booked
                </span>

              </div>

              {/* CANCELLED */}

              <div className="flex items-center gap-2">

                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />

                <span className="text-xs text-slate-600">
                  Cancelled
                </span>

              </div>

              {/* REJECTED */}

              <div className="flex items-center gap-2">

                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />

                <span className="text-xs text-slate-600">
                  Rejected
                </span>

              </div>

            </div>

          </div>

        </aside>

        {/* ==================================================
            RIGHT CALENDAR AREA
        ================================================== */}

        <div className="flex-1 min-w-0">

          {/* ==================================================
              CALENDAR HEADER
          ================================================== */}

          <div className="flex h-[65px] items-center justify-between border-b border-slate-200 px-5">

            <div>

              <h2 className="text-sm font-bold text-slate-800">
                Meeting Rooms
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                {date.toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </p>

            </div>

            <div className="flex items-center gap-2">

              <Clock3
                size={15}
                className="text-slate-400"
              />

              <span className="text-xs text-slate-500">
                9:00 AM - 5:00 PM
              </span>

            </div>

          </div>

          {/* ==================================================
              TIMELINE SCROLL
          ================================================== */}

          <div className="overflow-x-auto">

            <div className="min-w-[900px]">

              {/* ==================================================
                  TIME HEADER
              ================================================== */}

              <div className="flex border-b border-slate-200 bg-slate-50/70">

                <div className="w-[150px] shrink-0 px-4 py-3 text-xs font-bold text-slate-700">
                  Room
                </div>

                <div
                  className="grid flex-1"
                  style={{
                    gridTemplateColumns:
                      gridCols,
                  }}
                >

                  {HOURS.map((hour) => (

                    <div
                      key={hour}
                      className="border-l border-slate-200 px-2 py-3 text-center text-[11px] font-semibold text-slate-500"
                    >
                      {hour}:00 -{" "}
                      {hour + 1}:00
                    </div>

                  ))}

                </div>

              </div>

              {/* ==================================================
                  ROOM ROWS
              ================================================== */}

              {visibleRooms.length === 0 ? (

                <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
                  No rooms available.
                </div>

              ) : (

                visibleRooms.map(
                  (room) => {

                    /*
                    -----------------------------------------------
                    Get booking for this room + selected date
                    -----------------------------------------------
                    */

                    const roomBookings =
                      bookings.filter(
                        (booking) => {

                          const bookingRoomId =
                            booking.room_id ??
                            booking.room?.id;

                          const bookingDate =
                            booking.booking_date.split(
                              "T"
                            )[0];

                          return (
                            bookingRoomId ===
                              room.id &&
                            bookingDate ===
                              selectedKey
                          );
                        }
                      );

                    return (
                      <div
                        key={room.id}
                        className="flex h-[86px] border-b border-slate-200"
                      >

                        {/* ==================================================
                            ROOM NAME
                        ================================================== */}

                        <div className="flex w-[150px] shrink-0 flex-col justify-center px-4">

                          <div className="flex items-center gap-2">

                            <span className="h-2 w-2 rounded-full bg-orange-400" />

                            <span className="truncate text-xs font-bold text-slate-800">
                              {room.name}
                            </span>

                          </div>

                          {room.capacity && (

                            <div className="mt-1 flex items-center gap-1 pl-4 text-[10px] text-slate-400">

                              <Users
                                size={11}
                              />

                              Capacity:{" "}
                              {room.capacity}

                            </div>

                          )}

                        </div>

                        {/* ==================================================
                            TIME GRID
                        ================================================== */}

                        <div className="relative flex-1">

                          {/* GRID LINES */}

                          <div
                            className="absolute inset-0 grid"
                            style={{
                              gridTemplateColumns:
                                gridCols,
                            }}
                          >

                            {HOURS.map(
                              (hour) => (

                                <div
                                  key={hour}
                                  className="border-l border-slate-100"
                                />

                              )
                            )}

                          </div>

                          {/* ==================================================
                              BOOKINGS
                          ================================================== */}

                          {roomBookings.map(
                            (booking) => {

                              const startDt =
                                combineDateAndTime(
                                  booking.booking_date,
                                  booking.start_time
                                );

                              const endDt =
                                combineDateAndTime(
                                  booking.booking_date,
                                  booking.end_time
                                );

                              const left =
                                getPositionPercent(
                                  startDt,
                                  viewStart
                                );

                              const right =
                                getPositionPercent(
                                  endDt,
                                  viewStart
                                );

                              const width =
                                right - left;

                              if (
                                width <= 0
                              ) {
                                return null;
                              }

                              return (
                                <div
                                  key={
                                    booking.id
                                  }
                                  className={`
                                    absolute
                                    top-5
                                    h-12
                                    rounded-xl
                                    border
                                    px-3
                                    shadow-sm
                                    cursor-pointer
                                    overflow-hidden
                                    transition-all
                                    hover:shadow-md
                                    ${statusColor[normalizeStatus(booking.status)]}
                                  `}
                                  style={{
                                    left: `calc(${left}% + 5px)`,
                                    width: `calc(${width}% - 10px)`,
                                  }}
                                  onMouseEnter={(
                                    event
                                  ) => {
                                    setHovered(booking);
                                    setHoverPos(
                                      clampTooltip(
                                        event.clientX,
                                        event.clientY
                                      )
                                    );
                                  }}
                                  onMouseMove={(
                                    event
                                  ) => {
                                    setHoverPos(
                                      clampTooltip(
                                        event.clientX,
                                        event.clientY
                                      )
                                    );
                                  }}
                                  onMouseLeave={() =>
                                    setHovered(
                                      null
                                    )
                                  }
                                >

                                  <div className="flex h-full min-w-0 flex-col justify-center">

                                    <span className="truncate text-xs font-bold">
                                      {
                                        booking
                                          .user
                                          ?.name
                                      }
                                    </span>

                                    <span className="truncate text-[10px] opacity-90">
                                      {booking.start_time.slice(
                                        0,
                                        5
                                      )}
                                      {" - "}
                                      {booking.end_time.slice(
                                        0,
                                        5
                                      )}
                                    </span>

                                  </div>

                                </div>
                              );
                            }
                          )}

                        </div>

                      </div>
                    );
                  }
                )
              )}

            </div>

          </div>

        </div>

      </div>

      {/* ==================================================
          HOVER BOOKING DETAIL
      ================================================== */}

      {hovered && (

        <div
          className="fixed z-[100] w-[270px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_50px_-15px_rgba(15,23,42,0.35)] pointer-events-none"
          style={{
            left: hoverPos.x + 15,
            top: hoverPos.y + 15,
          }}
        >

          {/* TOP */}

          <div className="border-b border-slate-100 p-4">

            <div className="flex items-start justify-between gap-3">

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-600">
                  {hovered.user?.name
                    ?.slice(0, 2)
                    .toUpperCase()}
                </div>

                <div>

                  <p className="text-sm font-bold text-slate-800">
                    {hovered.user?.name}
                  </p>

                  <p className="text-[10px] text-slate-400">
                    Booking #{hovered.id}
                  </p>

                </div>

              </div>

              <span
                className={`
                  rounded-full
                  px-2
                  py-1
                  text-[9px]
                  font-bold
                  uppercase
                  ${statusColor[normalizeStatus(hovered.status)]}
                `}
              >
                {statusLabel[
                  normalizeStatus(hovered.status)
                ]}
              </span>

            </div>

          </div>

          {/* DETAILS */}

          <div className="space-y-3 p-4">

            {/* ROOM */}

            <div className="flex items-center gap-3">

              <Building2
                size={15}
                className="text-slate-400"
              />

              <div>

                <p className="text-[10px] text-slate-400">
                  Room
                </p>

                <p className="text-xs font-semibold text-slate-700">
                  {hovered.room?.name}
                </p>

              </div>

            </div>

            {/* PURPOSE */}

            <div className="flex items-center gap-3">

              <span className="flex h-[15px] w-[15px] items-center justify-center text-slate-400">
                ✦
              </span>

              <div>

                <p className="text-[10px] text-slate-400">
                  Purpose
                </p>

                <p className="max-w-[200px] truncate text-xs font-semibold text-slate-700">
                  {hovered.purpose}
                </p>

              </div>

            </div>

            {/* DATE */}

            <div className="flex items-center gap-3">

              <CalendarDays
                size={15}
                className="text-slate-400"
              />

              <div>

                <p className="text-[10px] text-slate-400">
                  Date
                </p>

                <p className="text-xs font-semibold text-slate-700">
                  {hovered.booking_date.split(
                    "T"
                  )[0]}
                </p>

              </div>

            </div>

            {/* TIME */}

            <div className="flex items-center gap-3">

              <Clock3
                size={15}
                className="text-slate-400"
              />

              <div>

                <p className="text-[10px] text-slate-400">
                  Time
                </p>

                <p className="text-xs font-semibold text-slate-700">
                  {hovered.start_time.slice(
                    0,
                    5
                  )}
                  {" - "}
                  {hovered.end_time.slice(
                    0,
                    5
                  )}
                </p>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}