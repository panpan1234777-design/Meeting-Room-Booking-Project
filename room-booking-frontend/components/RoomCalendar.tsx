"use client";

import { useState } from "react";

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

const BUSINESS_START = 9;
const BUSINESS_END = 17;
const HOURS = Array.from(
  { length: BUSINESS_END - BUSINESS_START },
  (_, i) => BUSINESS_START + i
);
const TOTAL_MINUTES = (BUSINESS_END - BUSINESS_START) * 60;

const statusColor: Record<Booking["status"], string> = {
  confirmed: "bg-emerald-500/90 border-emerald-600 text-white",
  pending: "bg-amber-400/90 border-amber-500 text-slate-900",
  rejected: "bg-rose-400/70 border-rose-500 text-white",
};

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function combineDateAndTime(bookingDate: string, time: string) {
  const datePart = bookingDate.split("T")[0]; 
  const timePart = time.length === 5 ? `${time}:00` : time; 
  return new Date(`${datePart}T${timePart}`);
}

function getPositionPercent(dt: Date, viewStart: Date) {
  const minutesFromStart = (dt.getTime() - viewStart.getTime()) / 60000;
  const clamped = Math.min(Math.max(minutesFromStart, 0), TOTAL_MINUTES);
  return (clamped / TOTAL_MINUTES) * 100;
}

export default function RoomCalendar({
  rooms,
  bookings,
  date,
}: {
  rooms: Room[];
  bookings: Booking[];
  date: Date;
}) {
  const viewStart = new Date(new Date(date).setHours(BUSINESS_START, 0, 0, 0));
  const gridCols = `repeat(${HOURS.length}, minmax(0, 1fr))`;
  const selectedKey = toDateKey(date);
  const [hovered, setHovered] = useState<Booking | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  return (
    <div className="rounded-2xl bg-white shadow-[0_20px_60px_-15px_rgba(255,255,255,0.3)] ring-1 ring-violet-100 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="flex border-b-2 border-violet-200 bg-violet-50/60 min-w-[900px]">
          <div className="w-40 shrink-0 p-3 text-slate-900 text-sm font-semibold">
            Room
          </div>
          <div className="flex-1 grid" style={{ gridTemplateColumns: gridCols }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="text-center text-xs text-slate-700 font-medium py-3 border-l border-violet-200"
              >
                {h}:00 - {h + 1}:00
              </div>
            ))}
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">
            No rooms to display.
          </div>
        ) : (
          rooms.map((room) => {
            const roomBookings = bookings.filter((b) => {
              const bRoomId = b.room_id ?? b.room?.id;
              return (
                bRoomId === room.id &&
                b.booking_date.split("T")[0] === selectedKey
              );
            });

            return (
              <div
                key={room.id}
                className="flex border-b border-violet-100 min-w-[900px] relative hover:bg-violet-50/30 transition-colors"
              >
                <div className="w-40 shrink-0 p-3 text-slate-900 text-sm font-medium truncate">
                  {room.name}
                </div>
                <div className="flex-1 relative h-14">
                  <div
                    className="absolute inset-0 grid"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    {HOURS.map((h) => (
                      <div key={h} className="border-l border-violet-100" />
                    ))}
                  </div>
                  {roomBookings.map((b) => {
                    const startDt = combineDateAndTime(b.booking_date, b.start_time);
                    const endDt = combineDateAndTime(b.booking_date, b.end_time);
                    const left = getPositionPercent(startDt, viewStart);
                    const right = getPositionPercent(endDt, viewStart);
                    const width = right - left;
                    if (width <= 0) return null;

                    return (
                      <div
                        key={b.id}
                        className={`absolute top-3 h-8 rounded-lg border shadow-sm text-xs px-2 flex items-center overflow-hidden cursor-pointer transition-transform hover:scale-[1.03] hover:shadow-md ${statusColor[b.status]}`}
                        style={{
                          left: `calc(${left}% + 6px)`,
                          width: `calc(${width}% - 10px)`,
                        }}
                        onMouseEnter={(e) => {
                          setHovered(b);
                          setHoverPos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseMove={(e) =>
                          setHoverPos({ x: e.clientX, y: e.clientY })
                        }
                        onMouseLeave={() => setHovered(null)}
                      >
                        <span className="truncate font-medium">
                          {b.user?.name ?? b.purpose}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-5 px-4 py-2.5 border-t border-violet-100 bg-violet-50/40">
        {(
          [
            { status: "confirmed", label: "Confirmed" },
            { status: "pending", label: "Pending" },
            { status: "rejected", label: "Rejected" },
          ] as const
        ).map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-sm ${statusColor[status].split(" ")[0]}`}
            />
            <span className="text-xs font-medium text-slate-700">
              {label}
            </span>
          </div>
        ))}
      </div>

      {hovered && (
        <div
          className="fixed z-50 w-64 rounded-xl border border-violet-200 bg-white shadow-[0_15px_40px_-10px_rgba(124,58,237,0.4)] p-4 pointer-events-none"
          style={{ left: hoverPos.x + 16, top: hoverPos.y + 16 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-900">
              {hovered.user?.name}
            </span>
            <span
              className={`text-[10px] uppercase px-2 py-0.5 rounded-full border ${statusColor[hovered.status]}`}
            >
              {hovered.status}
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-1">
            {hovered.room?.name} · {hovered.purpose}
          </p>
          <p className="text-xs text-slate-500">
            {hovered.booking_date.split("T")[0]} &nbsp;
            {hovered.start_time.slice(0, 5)} - {hovered.end_time.slice(0, 5)}
          </p>
        </div>
      )}
    </div>
  );
}